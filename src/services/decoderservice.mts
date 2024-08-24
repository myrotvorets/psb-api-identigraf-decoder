import type { DecodedItem, DecoderServiceInterface } from './decoderserviceinterface.mjs';
import { ModelService } from './modelservice.mjs';
import { convertCollection } from '../lib/helpers.mjs';
import { type Criminal, CriminalModel } from '../models/criminal.mjs';
import { type CriminalAttachment, CriminalAttachmentModel } from '../models/criminalattachment.mjs';

export type QueueItem = [criminalID: number, attachmentID: number, item: string];
export type Queue = Record<number, QueueItem[]>;

interface DecoderServiceOptions {
    modelService: ModelService;
    cdnPrefix: string;
    urlPrefix: string;
}

export class DecoderService implements DecoderServiceInterface {
    private readonly cdnPrefix: string;
    private readonly modelService: ModelService;
    private readonly urlPrefix: string;

    public constructor({ cdnPrefix, modelService, urlPrefix }: DecoderServiceOptions) {
        this.cdnPrefix = cdnPrefix;
        this.modelService = modelService;
        this.urlPrefix = urlPrefix;
    }

    public decode(items: readonly string[]): Promise<Record<string, DecodedItem>> {
        const v1OIDs = items.filter((item) => item.startsWith('!1-'));
        const queue = DecoderService.prepareV1Items(v1OIDs, {});
        return this.decodeMyrotvorets(queue[0]);
    }

    protected static prepareV1Items(items: readonly string[], queue: Readonly<Queue>): Queue {
        return items.reduce<Queue>((accumulator, item) => {
            const parts = item
                .substring(1)
                .split('-')
                // eslint-disable-next-line sonarjs/concise-regex
                .map((x) => (/^(0|[1-9][0-9]{0,14})$/u.test(x) ? parseInt(x, 10) : NaN)) // NOSONAR
                .filter((x) => !isNaN(x));

            if (parts.length === 4) {
                const [, typeID, criminalID, attachmentID] = parts;
                if (accumulator[typeID!] === undefined) {
                    accumulator[typeID!] = [];
                }

                accumulator[typeID!]!.push([criminalID!, attachmentID!, item]);
            }

            return accumulator;
        }, queue);
    }

    protected async decodeMyrotvorets(items: QueueItem[] = []): Promise<Record<string, DecodedItem>> {
        if (!items.length) {
            return {};
        }

        const [criminalIDs, attachmentIDs] = DecoderService.getUniqueIDs(items);
        const [criminals, attachments, primaryPhotos] = await this.modelService.transaction(
            (_trx, { criminal, criminalAttachment }) =>
                Promise.all([
                    DecoderService.getCriminals(criminal, criminalIDs),
                    DecoderService.getAttachments(criminalAttachment, attachmentIDs),
                    DecoderService.getPrimaryPhotos(criminalAttachment, criminalIDs),
                ]),
            { readOnly: true },
        );

        const result: Record<string, DecodedItem> = {};
        for (const [criminalID, attachmentID, key] of items) {
            const criminal: Criminal | undefined = criminals[criminalID];
            const primaryPhoto: CriminalAttachment | undefined = primaryPhotos[criminalID];
            const attachment: CriminalAttachment | undefined = attachments[attachmentID];
            if (criminal) {
                result[key] = {
                    name: criminal.name,
                    country: criminal.country,
                    link: `${this.urlPrefix}${criminal.slug}/`,
                    primaryPhoto: primaryPhoto ? `${this.cdnPrefix}${primaryPhoto.path}` : null,
                    matchedPhoto: attachment?.id === criminalID ? `${this.cdnPrefix}${attachment.path}` : null,
                };
            }
        }

        return result;
    }

    private static getUniqueIDs(items: QueueItem[]): [number[], number[]] {
        const criminalIDs = new Set<number>();
        const attachmentIDs = new Set<number>();
        for (const [criminalID, attachmentID] of items) {
            criminalIDs.add(criminalID);
            attachmentIDs.add(attachmentID);
        }

        return [Array.from(criminalIDs), Array.from(attachmentIDs)];
    }

    private static async getCriminals(model: CriminalModel, criminalIDs: number[]): Promise<Record<number, Criminal>> {
        const items = await model.byIds(criminalIDs);
        return convertCollection(items, 'id');
    }

    private static async getPrimaryPhotos(
        model: CriminalAttachmentModel,
        criminalIDs: number[],
    ): Promise<Record<number, CriminalAttachment>> {
        const items = await model.primaryPhotos(criminalIDs);
        return convertCollection(items, 'id');
    }

    private static async getAttachments(
        model: CriminalAttachmentModel,
        attachmentIDs: number[],
    ): Promise<Record<number, CriminalAttachment>> {
        const items = await model.imageAttachmentsByAttachmentIds(attachmentIDs);
        return convertCollection(items, 'att_id');
    }
}
