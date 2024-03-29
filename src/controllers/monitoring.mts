import {
    HealthChecker,
    HealthEndpoint,
    LivenessEndpoint,
    ReadinessCheck,
    ReadinessEndpoint,
    ShutdownCheck,
} from '@cloudnative/health-connect';
import { addJsonContentTypeMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { Router } from 'express';
import type { Knex } from 'knex';

export let healthChecker: HealthChecker | undefined;

export function monitoringController(db: Knex): Router {
    const router = Router();

    const dbCheck = new ReadinessCheck('database', async (): Promise<void> => {
        const client = db.client as Knex.Client;
        const conn = await (client.acquireConnection() as Promise<unknown>);
        await client.releaseConnection(conn);
    });

    const shutdownCheck = new ShutdownCheck('SIGTERM', (): Promise<void> => Promise.resolve());

    healthChecker = new HealthChecker();
    healthChecker.registerReadinessCheck(dbCheck);
    healthChecker.registerShutdownCheck(shutdownCheck);

    router.use(addJsonContentTypeMiddleware);
    router.get('/live', LivenessEndpoint(healthChecker));
    router.get('/ready', ReadinessEndpoint(healthChecker));
    router.get('/health', HealthEndpoint(healthChecker));

    return router;
}
