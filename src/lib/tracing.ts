/* istanbul ignore file */

import { EventEmitter } from 'events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
// import { KnexPlugin } from '@myrotvorets/opentelemetry-plugin-knex';

if (+(process.env.ENABLE_TRACING || 0)) {
    const configurator = new OpenTelemetryConfigurator({
        serviceName: 'psb-api-identigraf-decoder',
        // instrumentations: [new KnexPlugin()],
    });

    configurator.start().catch((e) => console.error('Failed to initialize OpenTelemetry:', e));
    EventEmitter.defaultMaxListeners += 5;
}
