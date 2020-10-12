import { Model, Transaction } from 'objection';
import Criminal from '../models/criminal';
import CriminalAttachment from '../models/criminalattachment';
import { convertCollection } from '../lib/helpers';

export interface DecodedItem {
    name: string;
    country: string;
    link: string;
    primaryPhoto: string | null;
    matchedPhoto: string | null;
}

export type Queue = Record<number, [criminalID: number, attachmentID: number, item: string][]>;

export default class DecoderService {
    public static decode(items: Readonly<string[]>): Promise<Record<string, DecodedItem>> {
        const v1OIDs = items.filter((item) => item.startsWith('!1-'));
        const queue = DecoderService.prepareV1Items(v1OIDs, {});
        return DecoderService.decodeMyrotvorets(queue[0]);
    }

    protected static prepareV1Items(items: Readonly<string[]>, queue: Readonly<Queue>): Queue {
        return items.reduce<Queue>((accumulator, item) => {
            const parts = item
                .substring(1)
                .split('-')
                .map((x) => (/^(0|[1-9][0-9]{0,14})$/u.test(x) ? parseInt(x, 10) : NaN))
                .filter((x) => !isNaN(x));

            if (parts.length === 4) {
                const [, typeID, criminalID, attachmentID] = parts;
                if (accumulator[typeID] === undefined) {
                    accumulator[typeID] = [];
                }

                accumulator[typeID].push([criminalID, attachmentID, item]);
            }

            return accumulator;
        }, queue);
    }

    protected static async decodeMyrotvorets(
        items: [number, number, string][] = [],
    ): Promise<Record<string, DecodedItem>> {
        if (!items.length) {
            return {};
        }

        const cids = new Set<number>();
        const aids = new Set<number>();
        for (const [criminalID, attachmentID] of items) {
            cids.add(criminalID);
            aids.add(attachmentID);
        }

        const criminalIDs = Array.from(cids);
        const attachmentIDs = Array.from(aids);

        const [criminals, attachments, primaryPhotos] = await Model.transaction((trx) =>
            Promise.all([
                DecoderService.getCriminals(trx, criminalIDs),
                DecoderService.getAttachments(trx, attachmentIDs),
                DecoderService.getPrimaryPhotos(trx, criminalIDs),
            ]),
        );

        const result: Record<string, DecodedItem> = {};
        for (const [criminalID, attachmentID, key] of items) {
            const criminal: Criminal | undefined = criminals[criminalID];
            const primaryPhoto: CriminalAttachment | undefined = primaryPhotos[criminalID];
            const attachment: CriminalAttachment | undefined = attachments[attachmentID];
            if (criminal) {
                const entry: DecodedItem = {
                    name: criminal.name,
                    country: criminal.country,
                    link: criminal.link,
                    primaryPhoto: primaryPhoto ? primaryPhoto.link : null,
                    matchedPhoto: attachment && attachment.id === criminalID ? attachment.link : null,
                };

                result[key] = entry;
            }
        }

        return result;
    }

    private static async getCriminals(trx: Transaction, criminalIDs: number[]): Promise<Record<number, Criminal>> {
        const items = await Criminal.query(trx).findByIds(criminalIDs);
        return convertCollection(items, 'id');
    }

    private static async getPrimaryPhotos(
        trx: Transaction,
        criminalIDs: number[],
    ): Promise<Record<number, CriminalAttachment>> {
        const items = await CriminalAttachment.query(trx).whereIn(
            'att_id',
            CriminalAttachment.query(trx).modify('findPrimaryPhotos', criminalIDs),
        );

        return convertCollection(items, 'id');
    }

    private static async getAttachments(
        trx: Transaction,
        attachmentIDs: number[],
    ): Promise<Record<number, CriminalAttachment>> {
        const items = await CriminalAttachment.query(trx).modify(['findImages', 'findByAttachmentIds'], attachmentIDs);

        return convertCollection(items, 'att_id');
    }
}
