import {
    HealthChecker,
    HealthEndpoint,
    LivenessEndpoint,
    ReadinessCheck,
    ReadinessEndpoint,
    ShutdownCheck,
} from '@cloudnative/health-connect';
import { Router } from 'express';
import knex, { Client } from 'knex';

export const healthChecker = new HealthChecker();

export default function (db: knex): Router {
    const router = Router();

    const dbCheck = new ReadinessCheck(
        'database',
        (): Promise<void> => {
            const client = db.client as Client;
            const connection = client.acquireConnection() as Promise<unknown>;
            return connection.then((conn) => client.releaseConnection(conn) as Promise<void>);
        },
    );

    const shutdownCheck = new ShutdownCheck('SIGTERM', (): Promise<void> => Promise.resolve());

    healthChecker.registerReadinessCheck(dbCheck);
    healthChecker.registerShutdownCheck(shutdownCheck);

    router.get('/live', LivenessEndpoint(healthChecker));
    router.get('/ready', ReadinessEndpoint(healthChecker));
    router.get('/health', HealthEndpoint(healthChecker));

    return router;
}
