import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { HttpClientService } from '../http/http-client.service';
import { BASE_INDEX_CONFIG } from './search-index.config';

export interface SearchHit<T> {
  id: string;
  score: number | null;
  source: T;
}

export class SearchRequestError extends Error {
  constructor(
    readonly operation: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(`Elasticsearch ${operation} failed with HTTP ${status}`);
  }
}

/** Minimal Elasticsearch REST client: connectivity, base index setup, indexing and match queries. */
@Injectable()
export class SearchService {
  constructor(
    private readonly config: AppConfigService,
    private readonly http: HttpClientService,
  ) {}

  /** Full index name for a logical name, e.g. "knowledge" -> "micro-v5-knowledge". */
  indexName(name: string): string {
    return `${this.config.elasticsearch.indexPrefix}-${name}`;
  }

  /** Cluster info from GET /; throws when the instance is unreachable or rejects the request. */
  async ping(): Promise<{ clusterName: string; version: string }> {
    const info = await this.requestJson<{ cluster_name: string; version: { number: string } }>(
      'ping',
      'GET',
      '/',
    );
    return { clusterName: info.cluster_name, version: info.version.number };
  }

  /** Creates the index with the base configuration when it does not exist. Returns true when created. */
  async ensureIndex(index: string): Promise<boolean> {
    const existing = await this.request('HEAD', `/${encodeURIComponent(index)}`);
    if (existing.status === 200) {
      return false;
    }
    if (existing.status !== 404) {
      throw new SearchRequestError('index lookup', existing.status, '');
    }
    const created = await this.request('PUT', `/${encodeURIComponent(index)}`, BASE_INDEX_CONFIG);
    if (created.ok) {
      return true;
    }
    const body = await created.text();
    // Another process may have created it between the lookup and the create.
    if (created.status === 400 && body.includes('resource_already_exists_exception')) {
      return false;
    }
    throw new SearchRequestError('index create', created.status, body);
  }

  /** Indexes (or replaces) a document by id. refresh=wait_for makes it searchable before returning. */
  async indexDocument(index: string, id: string, document: object, waitForRefresh = false): Promise<void> {
    const query = waitForRefresh ? '?refresh=wait_for' : '';
    await this.requestJson(
      'index document',
      'PUT',
      `/${encodeURIComponent(index)}/_doc/${encodeURIComponent(id)}${query}`,
      document,
    );
  }

  async match<T>(index: string, field: string, text: string, size = 10): Promise<SearchHit<T>[]> {
    const result = await this.requestJson<{
      hits: { hits: { _id: string; _score: number | null; _source: T }[] };
    }>('search', 'POST', `/${encodeURIComponent(index)}/_search`, {
      size,
      query: { match: { [field]: text } },
    });
    return result.hits.hits.map((hit) => ({ id: hit._id, score: hit._score, source: hit._source }));
  }

  /** Deletes the index; a missing index is not an error. */
  async deleteIndex(index: string): Promise<void> {
    const response = await this.request('DELETE', `/${encodeURIComponent(index)}`);
    if (!response.ok && response.status !== 404) {
      throw new SearchRequestError('index delete', response.status, await response.text());
    }
  }

  private async requestJson<T>(operation: string, method: string, path: string, body?: object): Promise<T> {
    const response = await this.request(method, path, body);
    if (!response.ok) {
      throw new SearchRequestError(operation, response.status, await response.text());
    }
    return (await response.json()) as T;
  }

  private request(method: string, path: string, body?: object): Promise<Response> {
    const { url, apiKey, requestTimeoutMs } = this.config.elasticsearch;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (apiKey) {
      headers.Authorization = `ApiKey ${apiKey}`;
    }
    return this.http.fetch(`${url}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // One deadline for the call, including any retries made by HttpClientService.
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  }
}
