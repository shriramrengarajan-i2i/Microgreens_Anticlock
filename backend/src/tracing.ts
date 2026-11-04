import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

// Must be imported before any other application module so instrumentation can patch http/express.
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, '');

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'micro-v5-backend',
  traceExporter: endpoint
    ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })
    : new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: endpoint
      ? new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` })
      : new ConsoleMetricExporter(),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  void sdk.shutdown();
});
