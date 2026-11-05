import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Server-side configuration. Secrets are read from the environment and never returned to clients. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get aiProviderApiKey(): string | undefined {
    return this.config.get<string>('AI_PROVIDER_API_KEY') || undefined;
  }

  get retry(): { maxAttempts: number; baseDelayMs: number; maxDelayMs: number } {
    return {
      maxAttempts: this.positiveInt('HTTP_RETRY_MAX_ATTEMPTS', 4),
      baseDelayMs: this.positiveInt('HTTP_RETRY_BASE_DELAY_MS', 200),
      maxDelayMs: this.positiveInt('HTTP_RETRY_MAX_DELAY_MS', 5000),
    };
  }

  get elasticsearch(): {
    url: string;
    indexPrefix: string;
    apiKey: string | undefined;
    requestTimeoutMs: number;
  } {
    const indexPrefix = this.config.get<string>('ELASTICSEARCH_INDEX_PREFIX') || 'micro-v5';
    // Elasticsearch index names must be lowercase and cannot start with '-', '_' or '+'.
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(indexPrefix)) {
      throw new Error(
        'ELASTICSEARCH_INDEX_PREFIX must be lowercase letters, digits, "-" or "_" and start with a letter or digit',
      );
    }
    return {
      url: (this.config.get<string>('ELASTICSEARCH_URL') || 'http://localhost:9200').replace(/\/+$/, ''),
      indexPrefix,
      apiKey: this.config.get<string>('ELASTICSEARCH_API_KEY') || undefined,
      requestTimeoutMs: this.positiveInt('ELASTICSEARCH_REQUEST_TIMEOUT_MS', 5000),
    };
  }

  private positiveInt(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key));
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
}
