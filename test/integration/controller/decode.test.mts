import express, { type Express } from 'express';
import request from 'supertest';
import type { Knex } from 'knex';
import { Model } from 'objection';
import { configureApp, setupKnex } from '../../../src/server.mjs';
import { e2eData } from '../../fixtures/e2e.mjs';

describe('DecodeController (integration)', function () {
    let app: Express;
    let db: Knex | undefined = undefined;

    before(async function () {
        if (!process.env['RUN_INTEGRATION_TESTS']) {
            this.skip();
        }

        db = setupKnex();
        await db.seed.run();
        Model.knex(db);

        app = express();
        return configureApp(app);
    });

    after(function () {
        return db?.destroy();
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    e2eData.forEach(({ request: input, response: expected, code }) => {
        it(`should return the expected result (${JSON.stringify(input)})`, function () {
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send(input)
                .expect(code)
                .expect(expected);
        });
    });
});
