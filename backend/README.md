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
