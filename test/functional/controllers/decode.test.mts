/* eslint-disable import/no-named-as-default-member */
import { after, before, describe, it } from 'mocha';
import express, { type Express } from 'express';
import request from 'supertest';
import * as knexpkg from 'knex';
import mockKnex from 'mock-knex';
import { Model } from 'objection';
import { configureApp } from '../../../src/server.mjs';
import { decodeMyrotvoretsQueryHandler } from '../../helpers.mjs';
import { decodeMyrotvoretsResult } from '../../fixtures/results.mjs';
import { FakeClient } from '../../fake-client.cjs';

describe('DecodeController', () => {
    let app: Express;
    let db: knexpkg.Knex;

    before(() => {
        const { knex } = knexpkg.default;
        db = knex({ client: FakeClient });
        mockKnex.mock(db);
        Model.knex(db);

        app = express();
        return configureApp(app);
    });

    after(() => {
        mockKnex.unmock(db);
        return db.destroy();
    });

    afterEach(() => mockKnex.getTracker().uninstall());

    describe('Error Handling', () => {
        it('should fail the request without body', () => {
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should fail non-JSON requests', () => {
            return request(app).post('/decode').set('Content-Type', 'text/plain').send('["!1-0-1-2-3"]').expect(415);
        });

        it('should fail empty requests', () => {
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send('[]')
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should fail requests with too many items', () => {
            const data = Array(101).fill('!1-0-1-2');
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(data))
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should return a 404 on non-existing URLs', () => {
            return request(app).get('/admin').expect(404);
        });

        const methods = ['get', 'put', 'head', 'delete', 'patch', 'options'] as const;
        methods.forEach((method) => {
            it(`should return a 405 on disallowed methods (${method})`, () =>
                request(app)[method]('/decode').expect(405));
        });
    });

    describe('Normal operation', () => {
        it('should return the expected result', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input = ['!1-0-1-12', '!1-0-2-21'];

            const expected = {
                success: true,
                items: decodeMyrotvoretsResult,
            };

            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send(input)
                .expect(200)
                .expect(expected);
        });
    });
});
