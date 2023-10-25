/* eslint-disable import/no-named-as-default-member */
import { type Express } from 'express';
import request from 'supertest';
import mockKnex from 'mock-knex';
import { configureApp, createApp } from '../../../src/server.mjs';
import { decodeMyrotvoretsQueryHandler } from '../../helpers.mjs';
import { decodeMyrotvoretsResult } from '../../fixtures/results.mjs';
import { container } from '../../../src/lib/container.mjs';

describe('DecodeController', function () {
    let app: Express;

    before(async function () {
        await container.dispose();
        app = createApp();
        configureApp(app);

        mockKnex.mock(container.resolve('db'));
    });

    after(function () {
        return container.dispose();
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
