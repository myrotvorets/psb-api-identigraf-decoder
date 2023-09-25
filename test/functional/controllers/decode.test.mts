/* eslint-disable import/no-named-as-default-member */
import express, { type Express } from 'express';
import request from 'supertest';
import * as knexpkg from 'knex';
import mockKnex from 'mock-knex';
import { Model } from 'objection';
import { FakeClient } from '@myrotvorets/fake-knex-client';
import { configureApp } from '../../../src/server.mjs';
import { decodeMyrotvoretsQueryHandler } from '../../helpers.mjs';
import { decodeMyrotvoretsResult } from '../../fixtures/results.mjs';

describe('DecodeController', function () {
    let app: Express;
    let db: knexpkg.Knex;

    before(function () {
        const { knex } = knexpkg.default;
        db = knex({ client: FakeClient });
        mockKnex.mock(db);
        Model.knex(db);

        app = express();
        return configureApp(app);
    });

    after(function () {
        mockKnex.unmock(db);
        return db.destroy();
    });

    afterEach(function () {
        mockKnex.getTracker().uninstall();
    });

    describe('Error Handling', function () {
        it('should fail the request without body', function () {
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should fail non-JSON requests', function () {
            return request(app).post('/decode').set('Content-Type', 'text/plain').send('["!1-0-1-2-3"]').expect(415);
        });

        it('should fail empty requests', function () {
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send('[]')
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should fail requests with too many items', function () {
            const data = Array(101).fill('!1-0-1-2');
            return request(app)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(data))
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should return a 404 on non-existing URLs', function () {
            return request(app).get('/admin').expect(404);
        });

        const methods = ['get', 'put', 'head', 'delete', 'patch', 'options'] as const;
        // eslint-disable-next-line mocha/no-setup-in-describe
        methods.forEach((method) => {
            it(`should return a 405 on disallowed methods (${method})`, function () {
                return request(app)[method]('/decode').expect(405);
            });
        });
    });

    describe('Normal operation', function () {
        it('should return the expected result', function () {
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
