import express from 'express';
import request from 'supertest';
import knex from 'knex';
import { buildKnexConfig } from '../../../src/knexfile';
import { configureApp } from '../../../src/server';
import monitoringController from '../../../src/controllers/monitoring';

let app: express.Express;
let db: knex;

async function buildApp(): Promise<express.Express> {
    const application = express();
    application.use('/monitoring', monitoringController(db));
    await configureApp(application);
    return application;
}

if (!process.env.RUN_INTEGRATION_TESTS) {
    // eslint-disable-next-line jest/no-focused-tests
    test.only('Skipping integration tests', () => {
        /* Skipping integration tests because RUN_INTEGRATION_TESTS is not set */
    });
} else {
    beforeAll(() => {
        db = knex(buildKnexConfig());
    });

    afterAll(() => db.destroy());

    beforeEach(() => buildApp().then((application) => (app = application)));
}

describe('MonitoringController', () => {
    const checker200 = (endpoint: string): Promise<unknown> => request(app).get(`/monitoring/${endpoint}`).expect(200);

    it('Liveness Check should succeed', () => checker200('live'));
    it('Readyness Check should succeed', () => checker200('ready'));
    it('Health Check should succeed', () => checker200('health'));
});
