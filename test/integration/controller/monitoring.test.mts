import type { RequestListener } from 'node:http';
import { type Express } from 'express';
import request from 'supertest';
import { configureApp, createApp } from '../../../src/server.mjs';
import { container } from '../../../src/lib/container.mjs';

describe('MonitoringController (integration)', function () {
    let app: Express;

    before(async function () {
        if (!process.env['RUN_INTEGRATION_TESTS']) {
            this.skip();
        }

        await container.dispose();
        app = createApp();
        return configureApp(app);
    });

    after(function () {
        return container.dispose();
    });

    const checker200 = (endpoint: string): Promise<unknown> =>
        request(app as RequestListener)
            .get(`/monitoring/${endpoint}`)
            .expect(200);

    it('Liveness Check should succeed', function () {
        return checker200('live');
    });

    it('Readiness Check should succeed', function () {
        return checker200('ready');
    });

    it('Health Check should succeed', function () {
        return checker200('health');
    });
});
