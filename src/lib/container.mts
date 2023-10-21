import { AwilixContainer, asClass, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import * as knexpkg from 'knex';
import { type Logger, type Meter, getLogger, getMeter } from '@myrotvorets/otel-utils';
import { environment } from './environment.mjs';
import { buildKnexConfig } from '../knexfile.mjs';
import { DecoderService } from '../services/decoderservice.mjs';
import type { DecoderServiceInterface } from '../services/decoderserviceinterface.mjs';
import { ModelService } from '../services/modelservice.mjs';

export interface Container {
    environment: ReturnType<typeof environment>;
    logger: Logger;
    meter: Meter;
    db: knexpkg.Knex;
    decoderService: DecoderServiceInterface;
    modelService: ModelService;
    cdnPrefix: string;
    urlPrefix: string;
}

export interface RequestContainer {
    req: Request;
}

export type LocalsWithContainer = Record<'container', AwilixContainer<RequestContainer & Container>>;

export const container = createContainer<Container>();

function createLogger({ req }: Partial<RequestContainer>): Logger {
    const logger = getLogger();
    logger.clearAttributes();
    if (req) {
        if (req.ip) {
            logger.setAttribute('ip', req.ip);
        }

        logger.setAttribute('request', `${req.method} ${req.url}`);
    }

    return logger;
}

function createMeter(): Meter {
    return getMeter();
}

function createDatabase(): knexpkg.Knex {
    const { knex } = knexpkg.default;
    return knex(buildKnexConfig());
}

export function initializeContainer(): typeof container {
    const env = environment(true);
    container.register({
        environment: asValue(env),
        logger: asFunction(createLogger).scoped(),
        meter: asFunction(createMeter).singleton(),
        cdnPrefix: asValue('https://cdn.myrotvorets.center/m/'),
        urlPrefix: asValue('https://myrotvorets.center/criminal/'),
        db: asFunction(createDatabase)
            .singleton()
            .disposer((db) => db.destroy()),
        decoderService: asClass(DecoderService).singleton(),
        modelService: asClass(ModelService).singleton(),
    });

    container.register('req', asValue(undefined));
    return container;
}

export function scopedContainerMiddleware(
    req: Request,
    res: Response<unknown, LocalsWithContainer>,
    next: NextFunction,
): void {
    res.locals.container = container.createScope<RequestContainer>();
    res.locals.container.register({
        req: asValue(req),
    });

    res.on('close', () => {
        void res.locals.container.dispose();
    });

    next();
}
