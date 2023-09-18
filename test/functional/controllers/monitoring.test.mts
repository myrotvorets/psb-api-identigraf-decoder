/* eslint-disable import/no-named-as-default-member */
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';
import express, { type Express } from 'express';
import request from 'supertest';
import * as knexpkg from 'knex';
import mockKnex from 'mock-knex';
import { healthChecker, monitoringController } from '../../../src/controllers/monitoring.mjs';
import { FakeClient } from '../../fake-client.cjs';

describe('MonitoringController', () => {
    let app: Express;
    let db: knexpkg.Knex;

    before(() => {
        const { knex } = knexpkg.default;
        db = knex({ client: FakeClient });
        mockKnex.mock(db);

        app = express();
        app.disable('x-powered-by');
        app.use('/monitoring', monitoringController(db));
    });

    beforeEach(() => {
        healthChecker.shutdownRequested = false;
    });

    after(() => {
        mockKnex.unmock(db);
        return db.destroy();
    });

    afterEach(() => {
        process.removeAllListeners('SIGTERM');
        mockKnex.getTracker().uninstall();
    });

    const checker200 = (endpoint: string): Promise<unknown> =>
        request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(200);

    const checker503 = (endpoint: string): Promise<unknown> => {
        healthChecker.shutdownRequested = true;
        return request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(503);
    };

    describe('Liveness Check', () => {
        it('should succeed', () => checker200('live'));
        it('should fail when shutdown requested', () => checker503('live'));
    });

    describe('Readiness Check', () => {
        it('should succeed', () => checker200('ready'));
        it('should fail when shutdown requested', () => checker503('ready'));
    });

    describe('Health Check', () => {
        it('should succeed', () => checker200('health'));
        it('should fail when shutdown requested', () => checker503('health'));
    });
});
