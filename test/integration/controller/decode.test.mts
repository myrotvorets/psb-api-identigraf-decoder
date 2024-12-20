/* eslint-disable sonarjs/assertions-in-tests */
import type { RequestListener } from 'node:http';
import { type Express } from 'express';
import request from 'supertest';
import { configureApp, createApp } from '../../../src/server.mjs';
import { container } from '../../../src/lib/container.mjs';
import { e2eData } from '../../fixtures/e2e.mjs';

describe('DecodeController (integration)', function () {
    let app: Express;

    before(async function () {
        if (!process.env['RUN_INTEGRATION_TESTS']) {
            this.skip();
        }

        await container.dispose();
        app = createApp();
        return configureApp(app);
    });

    after(function () {
        return container.dispose();
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    e2eData.forEach(({ request: input, response: expected, code }) => {
        it(`should return the expected result (${JSON.stringify(input)})`, function () {
            return request(app as RequestListener)
                .post('/decode')
                .set('Content-Type', 'application/json')
                .send(input)
                .expect(code)
                .expect(expected);
        });
    });
});
