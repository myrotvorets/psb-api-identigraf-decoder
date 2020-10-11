import express, { json } from 'express';
import knex from 'knex';
import { join } from 'path';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer } from '@myrotvorets/create-server';
import morgan from 'morgan';
import { Model } from 'objection';

import { buildKnexConfig } from './knexfile';
import { environment } from './lib/environment';

import decodeController from './controllers/decode';
import monitoringController from './controllers/monitoring';

export async function configureApp(app: express.Express): Promise<void> {
    const env = environment();

    app.use(json());

    await installOpenApiValidator(join(__dirname, 'specs', 'identigraf-decoder.yaml'), app, env.NODE_ENV);

    app.use('/', decodeController());
    app.use('/', notFoundMiddleware);
    app.use(errorMiddleware);
}

/* istanbul ignore next */
export function setupApp(): express.Express {
    const app = express();
    app.set('strict routing', true);
    app.set('x-powered-by', false);

    app.use(
        morgan(
            '[PSBAPI-identigraf-decoder] :req[X-Request-ID]\t:method\t:url\t:status :res[content-length]\t:date[iso]\t:response-time\t:total-time',
        ),
    );

    return app;
}

/* istanbul ignore next */
function setupKnex(): knex {
    const db = knex(buildKnexConfig());
    Model.knex(db);
    return db;
}

/* istanbul ignore next */
export async function run(): Promise<void> {
    const [env, app, db] = [environment(), setupApp(), setupKnex()];

    app.use('/monitoring', monitoringController(db));

    await configureApp(app);

    const server = await createServer(app);
    server.once('close', () => {
        db.destroy().catch((e) => console.error(e));
    });
    server.listen(env.PORT);
}
