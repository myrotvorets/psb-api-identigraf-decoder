import type { Knex } from 'knex';

export interface CriminalAttachment {
    id: number;
    att_id: number;
    path: string;
    mime_type: string;
}

interface ModelOptions {
    db: Knex<CriminalAttachment, CriminalAttachment[]> | Knex.Transaction<CriminalAttachment, CriminalAttachment[]>;
}

export class CriminalAttachmentModel {
    public static readonly tableName = 'criminal_attachments';

    private readonly db: Knex<CriminalAttachment, CriminalAttachment[]>;

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    private findPrimaryPhotos(criminalIDs: number[]): Knex.QueryBuilder<CriminalAttachment> {
        return this.db(CriminalAttachmentModel.tableName)
            .distinct(this.db.raw('FIRST_VALUE(att_id) OVER (PARTITION BY id ORDER BY sort_order, att_id)'))
            .whereIn('id', criminalIDs)
            .where('mime_type', 'LIKE', 'image/%');
    }

    public primaryPhotos(criminalIDs: number[]): Promise<CriminalAttachment[]> {
        return this.db(CriminalAttachmentModel.tableName).whereIn('att_id', this.findPrimaryPhotos(criminalIDs));
    }

    public imageAttachmentsByAttachmentIds(attachmentIDs: number[]): Promise<CriminalAttachment[]> {
        return this.db(CriminalAttachmentModel.tableName)
            .whereIn('att_id', attachmentIDs)
            .where('mime_type', 'LIKE', 'image/%');
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [CriminalAttachmentModel.tableName]: CriminalAttachment;
    }
}
