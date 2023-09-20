import { after, before, describe, it } from 'mocha';
import express, { type Express } from 'express';
import request from 'supertest';
import type { Knex } from 'knex';
import { configureApp, setupKnex } from '../../../src/server.mjs';
import { monitoringController } from '../../../src/controllers/monitoring.mjs';

describe('MonitoringController (integration)', function () {
    let app: Express;
    let db: Knex | undefined = undefined;

    before(function () {
        if (!process.env.RUN_INTEGRATION_TESTS) {
            this.skip();
        }

        db = setupKnex();

        app = express();
        app.use('/monitoring', monitoringController(db));
        return configureApp(app);
    });

    after(() => db?.destroy());

    const checker200 = (endpoint: string): Promise<unknown> => request(app).get(`/monitoring/${endpoint}`).expect(200);

    it('Liveness Check should succeed', () => checker200('live'));
    it('Readiness Check should succeed', () => checker200('ready'));
    it('Health Check should succeed', () => checker200('health'));
});
