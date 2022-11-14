import { Model, Modifiers, QueryBuilder } from 'objection';

export default class CriminalAttachment extends Model {
    public id!: number;
    public att_id!: number;
    public path!: string;
    public mime_type!: string;

    public static tableName = 'criminal_attachments';

    public get link(): string {
        return `https://cdn.myrotvorets.center/m/${this.path}`;
    }

    // eslint-disable-next-line no-use-before-define
    public static modifiers: Modifiers<QueryBuilder<CriminalAttachment>> = {
        findImages(builder): QueryBuilder<CriminalAttachment> {
            return builder.where('mime_type', 'LIKE', 'image/%');
        },
        findByAttachmentIds(builder, attachmentIDs: number[]): QueryBuilder<CriminalAttachment> {
            return builder.whereIn('att_id', attachmentIDs);
        },
        findPrimaryPhotos(builder, criminalIDs: number[]): QueryBuilder<CriminalAttachment> {
            return builder
                .distinct(Model.raw('FIRST_VALUE(att_id) OVER (PARTITION BY id ORDER BY sort_order, att_id)'))
                .whereIn('id', criminalIDs)
                .modify('findImages');
        },
    };
}
