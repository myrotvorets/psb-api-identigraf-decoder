import mockKnex from 'mock-knex';
import knex from 'knex';
import { Model } from 'objection';
import { buildKnexConfig } from '../../../src/knexfile';
import DecoderService, { DecodedItem, Queue } from '../../../src/services/decoder';
import { decodeMyrotvoretsResult } from '../../fixtures/results';
import { decodeMyrotvoretsQueryHandler } from '../../helpers';

class MyDecoderService extends DecoderService {
    public static prepareV1Items(items: Readonly<string[]>, queue: Readonly<Queue>): Queue {
        return DecoderService.prepareV1Items(items, queue);
    }

    public static decodeMyrotvorets(items?: [number, number, string][]): Promise<Record<string, DecodedItem>> {
        return DecoderService.decodeMyrotvorets(items);
    }
}

describe('DecoderService', () => {
    describe('prepareV1Items', () => {
        it('should reject invalid items', () => {
            const input = [
                '!1-t-c-a',
                '!1-1-2-3-4',
                '!1-0x01-0x02-0x03',
                '!1- 1 -2 - 3',
                '!1-01-02-03',
                '!1-1-2-1111111111111111',
            ];
            const expected = {};
            const actual = MyDecoderService.prepareV1Items(input, {});
            expect(actual).toStrictEqual(expected);
        });

        it('should properly process valid items', () => {
            const input = ['!1-1-2-3', '!1-0-2-3', '!1-0-2-3', '!1-0-4-5'];
            const expected = {
                0: [
                    [2, 3, '!1-0-2-3'],
                    [2, 3, '!1-0-2-3'],
                    [4, 5, '!1-0-4-5'],
                ],
                1: [[2, 3, '!1-1-2-3']],
            };
            const actual = MyDecoderService.prepareV1Items(input, {});
            expect(actual).toStrictEqual(expected);
        });
    });

    describe('decodeMyrotvorets', () => {
        const db = knex(buildKnexConfig({ MYSQL_DATABASE: 'fake' }));
        beforeEach(() => {
            mockKnex.mock(db);
            Model.knex(db);
        });

        afterEach(() => {
            mockKnex.getTracker().uninstall();
            mockKnex.unmock(db);
        });

        it.each([[undefined], [[]]])('should return an empty object on empty input (%p)', (input) => {
            const expected = {};
            return expect(MyDecoderService.decodeMyrotvorets(input)).resolves.toStrictEqual(expected);
        });

        it('should handle empty result sets gracefully', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', (query, step) => {
                expect(step).toBeLessThanOrEqual(5);
                if (step > 1 && step < 5) {
                    expect(query.method).toEqual('select');
                    expect(query.transacting).toBe(true);
                }

                query.response([]);
            });

            tracker.install();
            return expect(MyDecoderService.decodeMyrotvorets([[1, 2, '!1-0-1-2']])).resolves.toEqual({});
        });

        it('should return the expected results', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input: [number, number, string][] = [
                [1, 12, '!1-0-1-12'],
                [2, 21, '!1-0-2-21'],
            ];

            const expected = decodeMyrotvoretsResult;
            return expect(MyDecoderService.decodeMyrotvorets(input)).resolves.toStrictEqual(expected);
        });
    });

    describe('decode', () => {
        const db = knex(buildKnexConfig({ MYSQL_DATABASE: 'fake' }));
        beforeEach(() => {
            mockKnex.mock(db);
            Model.knex(db);
        });

        afterEach(() => {
            mockKnex.getTracker().uninstall();
            mockKnex.unmock(db);
        });

        it('should handle empty input', () => {
            return expect(DecoderService.decode([])).resolves.toStrictEqual({});
        });

        it('should produce the expected results', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input = ['!1-0-1-12', '!1-0-2-21'];

            const expected = decodeMyrotvoretsResult;
            return expect(MyDecoderService.decode(input)).resolves.toStrictEqual(expected);
        });
    });
});
