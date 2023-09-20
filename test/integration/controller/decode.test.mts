import { after, before, describe, it } from 'mocha';
import express, { type Express } from 'express';
import request from 'supertest';
import type { Knex } from 'knex';
import { Model } from 'objection';
import { configureApp, setupKnex } from '../../../src/server.mjs';
import { e2eResult } from '../../fixtures/results.mjs';

describe('DecodeController (integration)', function () {
    let app: Express;
    let db: Knex | undefined = undefined;

    before(async function () {
        if (!process.env.RUN_INTEGRATION_TESTS) {
            this.skip();
        }

        db = setupKnex();
        await db.seed.run();
        Model.knex(db);

        app = express();
        return configureApp(app);
    });

    after(() => db?.destroy());

    it('should return the expected result', function () {
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
