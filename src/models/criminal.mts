import type { Knex } from 'knex';

export interface Criminal {
    id: number;
    slug: string;
    name: string;
    nname: string;
    dob: string;
    country: string;
    address: string;
    description: string;
}

interface ModelOptions {
    db: Knex<Criminal, Criminal[]> | Knex.Transaction<Criminal, Criminal[]>;
}

export class CriminalModel {
    public static readonly tableName = 'criminals';

    private readonly db: Knex<Criminal, Criminal[]>;

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    public byIds(ids: number[]): Promise<Criminal[]> {
        return this.db(CriminalModel.tableName).whereIn('id', ids);
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [CriminalModel.tableName]: Criminal;
    }
}
