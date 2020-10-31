import express from 'express';
import request from 'supertest';
import knex from 'knex';
import mockKnex from 'mock-knex';
import { Model } from 'objection';
import { buildKnexConfig } from '../../../src/knexfile';
import { configureApp } from '../../../src/server';
import { decodeMyrotvoretsQueryHandler } from '../../helpers';
import { decodeMyrotvoretsResult } from '../../fixtures/results';

let app: express.Express;

async function buildApp(): Promise<express.Express> {
    const application = express();
    const db = knex(buildKnexConfig({ MYSQL_DATABASE: 'fake' }));
    mockKnex.mock(db);
    Model.knex(db);
    afterAll(() => mockKnex.unmock(db));
    await configureApp(application);
    return application;
}

beforeAll(() => buildApp().then((application) => (app = application)));

afterEach(() => mockKnex.getTracker().uninstall());

describe('DecodeController', () => {
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

        it.each<['get' | 'put' | 'head' | 'delete' | 'patch' | 'options']>([
            ['get'],
            ['put'],
            ['head'],
            ['delete'],
            ['patch'],
            ['options'],
        ])('should return a 405 on disallowed methods (%s)', (method) => {
            return request(app)[method]('/decode').expect(405);
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
