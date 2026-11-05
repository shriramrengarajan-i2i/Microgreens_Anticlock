# Micro_V5 backend (NestJS)

```
cp .env.example .env
npm install
npm run start:dev
```

- Health: `GET http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/docs` (OpenAPI JSON at `/docs-json`)
- Telemetry: traces/metrics print to the console, or go to `OTEL_EXPORTER_OTLP_ENDPOINT` when set.
- Secrets (e.g. `AI_PROVIDER_API_KEY`) come only from the server environment / `.env` (git-ignored).
- Outbound calls should use `HttpClientService` (exponential backoff with jitter).
- HTTPS is expected to be terminated by the hosting layer (owned by the deployment scaffold).

## Elasticsearch search index

```
docker compose up -d elasticsearch   # from the repository root; local/dev instance on 127.0.0.1:9200
npm run search:check                 # connects with .env settings, ensures the base index, index + match round trip
```

- Connection settings (server-side only): `ELASTICSEARCH_URL`, `ELASTICSEARCH_INDEX_PREFIX`,
  `ELASTICSEARCH_API_KEY` (optional, for secured clusters), `ELASTICSEARCH_REQUEST_TIMEOUT_MS`.
- Index names are `<prefix>-<name>` in lowercase, e.g. `micro-v5-knowledge` for the knowledge base;
  `<prefix>-smoke-check` is a throwaway index used and deleted by `search:check`.
- Base index configuration (placeholder mapping) lives in `src/search/search-index.config.ts`;
  the knowledge-base feature work defines the full mapping.
- Connectivity: `GET http://localhost:3000/health/search` returns 200 with the Elasticsearch version, or 503.
- Backend code uses `SearchService` (REST API through `HttpClientService`).
