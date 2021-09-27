import express from 'express';
import request from 'supertest';
import { Knex, knex } from 'knex';
import { Model } from 'objection';
import { buildKnexConfig } from '../../../src/knexfile';
import { configureApp } from '../../../src/server';
import decodeController from '../../../src/controllers/decode';
import { e2eResult } from '../../fixtures/results';

let app: express.Express;
let db: Knex;

async function buildApp(): Promise<express.Express> {
    const application = express();
    application.use('/monitoring', decodeController());
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
        Model.knex(db);
    });

    afterAll(() => db.destroy());

    beforeEach(() =>
        db.seed
            .run()
            .then(() => buildApp())
            .then((application) => (app = application)),
    );
}

describe('DecodeController', () => {
    it('should return the expected result', () => {
        const input = ['!1-0-1-12', '!1-0-2-21'];

        const expected = e2eResult;

        return request(app)
            .post('/decode')
            .set('Content-Type', 'application/json')
            .send(input)
            .expect(200)
            .expect(expected);
    });
});
