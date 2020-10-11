import express from 'express';
import request from 'supertest';
import knex from 'knex';
import mockKnex from 'mock-knex';
import { buildKnexConfig } from '../../../src/knexfile';
import { configureApp } from '../../../src/server';
import monitoringController, { healthChecker } from '../../../src/controllers/monitoring';

let app: express.Express;

async function buildApp(): Promise<express.Express> {
    const application = express();
    const db = knex(buildKnexConfig({ MYSQL_DATABASE: 'fake' }));
    mockKnex.mock(db);
    afterAll(() => mockKnex.unmock(db));
    application.use('/monitoring', monitoringController(db));
    await configureApp(application);
    return application;
}

afterEach(() => mockKnex.getTracker().uninstall());

beforeEach((done) => {
    buildApp()
        .then((application) => {
            app = application;
            healthChecker.shutdownRequested = false;
            done();
        })
        .catch((e: Error) => {
            done.fail(e);
        });
});

describe('MonitoringController', () => {
    const checker200 = (endpoint: string): Promise<unknown> => request(app).get(`/monitoring/${endpoint}`).expect(200);
    const checker503 = (endpoint: string): Promise<unknown> => {
        healthChecker.shutdownRequested = true;
        return request(app).get(`/monitoring/${endpoint}`).expect(503);
    };

    describe('Liveness Check', () => {
        it('should succeed', () => checker200('live'));
        it('should fail when shutdown requested', () => checker503('live'));
    });

    describe('Readyness Check', () => {
        it('should succeed', () => checker200('ready'));
        it('should fail when shutdown requested', () => checker503('ready'));
    });

    describe('Health Check', () => {
        it('should succeed', () => checker200('health'));
        it('should fail when shutdown requested', () => checker503('health'));
    });
});
