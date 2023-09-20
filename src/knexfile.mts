/* c8 ignore start */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanEnv, num, str } from 'envalid';
import type { Knex } from 'knex';

interface DbEnv {
    NODE_ENV: string;
    MYSQL_DATABASE: string;
    MYSQL_HOST: string;
    MYSQL_USER: string;
    MYSQL_PASSWORD: string;
    MYSQL_CONN_LIMIT: number;
}

function getEnvironment(environment: NodeJS.Dict<string>): Readonly<DbEnv> {
    return cleanEnv(environment, {
        NODE_ENV: str({ default: 'development' }),
        MYSQL_DATABASE: str(),
        MYSQL_HOST: str({ default: 'localhost' }),
        MYSQL_USER: str({ default: '' }),
        MYSQL_PASSWORD: str({ default: '' }),
        MYSQL_CONN_LIMIT: num({ default: 2 }),
    });
}

export function buildKnexConfig(environment: NodeJS.Dict<string> = process.env): Knex.Config {
    const env = getEnvironment(environment);

    return {
        client: 'mysql2',
        asyncStackTraces: ['development', 'test'].includes(env.NODE_ENV),
        connection: {
            database: env.MYSQL_DATABASE,
            host: env.MYSQL_HOST,
            user: env.MYSQL_USER,
            password: env.MYSQL_PASSWORD,
            dateStrings: true,
            charset: 'utf8mb4',
        },
        pool: {
            min: 0,
            max: env.MYSQL_CONN_LIMIT,
        },
        migrations: {
            tableName: 'knex_migrations_identigraf_decoder',
            directory: join(dirname(fileURLToPath(import.meta.url)), '..', 'test', 'migrations'),
            loadExtensions: ['.mts'],
        },
        seeds: {
            directory: join(dirname(fileURLToPath(import.meta.url)), '..', 'test', 'seeds'),
            loadExtensions: ['.mts'],
        },
    };
}
/* c8 ignore end */
