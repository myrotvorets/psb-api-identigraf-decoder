import type { Knex } from 'knex';
import { CriminalModel } from '../models/criminal.mjs';
import { CriminalAttachmentModel } from '../models/criminalattachment.mjs';

interface ModelServiceOptions {
    db: Knex;
}

export interface Models {
    criminal: CriminalModel;
    criminalAttachment: CriminalAttachmentModel;
}

export class ModelService {
    private readonly _db: Knex;

    public constructor({ db }: ModelServiceOptions) {
        this._db = db;
    }

    public transaction<T = unknown>(
        callback: (trx: Knex.Transaction, models: Models) => void | Promise<T>, // eslint-disable-line @typescript-eslint/no-invalid-void-type
        config?: Knex.TransactionConfig,
    ): Promise<T> {
        return this._db.transaction<T>((trx) => {
            const models: Models = {
                criminal: new CriminalModel({ db: trx }),
                criminalAttachment: new CriminalAttachmentModel({ db: trx }),
            };

            return callback(trx, models);
        }, config);
    }
}
