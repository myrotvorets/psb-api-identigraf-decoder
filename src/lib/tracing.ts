/* istanbul ignore file */

import { NodeTracerProvider } from '@opentelemetry/node';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';

const provider = new NodeTracerProvider({
    plugins: {
        express: {},
        http: {},
        https: {},
        knex: {
            path: '@myrotvorets/opentelemetry-plugin-knex',
        },
    },
});

if (+(process.env.ENABLE_TRACING || 0) && process.env.ZIPKIN_ENDPOINT) {
    const zipkinExporter = new ZipkinExporter({
        url: process.env.ZIPKIN_ENDPOINT,
        serviceName: 'psb-api-identigraf-decoder',
    });

    const zipkinProcessor = new SimpleSpanProcessor(zipkinExporter);
    provider.addSpanProcessor(zipkinProcessor);
}

provider.register();
