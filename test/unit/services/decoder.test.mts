/* eslint-disable import/no-named-as-default-member */
import { after, before, describe, it } from 'mocha';
import { expect } from 'chai';
import mockKnex from 'mock-knex';
import * as knexpkg from 'knex';
import { Model } from 'objection';
import { DecodedItem, DecoderService, Queue } from '../../../src/services/decoder.mjs';
import { decodeMyrotvoretsResult } from '../../fixtures/results.mjs';
import { decodeMyrotvoretsQueryHandler } from '../../helpers.mjs';
import { FakeClient } from '../../fake-client.cjs';

type Item = [number, number, string];
class MyDecoderService extends DecoderService {
    public static prepareV1Items(items: Readonly<string[]>, queue: Readonly<Queue>): Queue {
        return DecoderService.prepareV1Items(items, queue);
    }

    public static decodeMyrotvorets(items?: Item[]): Promise<Record<string, DecodedItem>> {
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
            expect(actual).to.deep.equal(expected);
        });

        it('should properly process valid items', () => {
            const input = ['!1-1-2-3', '!1-0-2-3', '!1-0-2-3', '!1-0-4-5'];
            const expected: Queue = {
                0: [
                    [2, 3, '!1-0-2-3'],
                    [2, 3, '!1-0-2-3'],
                    [4, 5, '!1-0-4-5'],
                ],
                1: [[2, 3, '!1-1-2-3']],
            };
            const actual = MyDecoderService.prepareV1Items(input, {});
            expect(actual).to.deep.equal(expected);
        });
    });

    describe('decodeMyrotvorets', () => {
        let db: knexpkg.Knex;

        before(() => {
            const { knex } = knexpkg.default;
            db = knex({ client: FakeClient });
            mockKnex.mock(db);
            Model.knex(db);
        });

        after(() => mockKnex.unmock(db));

        afterEach(() => mockKnex.getTracker().uninstall());

        const table: (undefined | Item[])[] = [undefined, [] as Item[]];

        table.forEach((input) => {
            it(`should return an empty object on empty input (${JSON.stringify(input)})`, () => {
                const expected = {};
                return expect(MyDecoderService.decodeMyrotvorets(input)).to.become(expected);
            });
        });

        it('should handle empty result sets gracefully', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', (query, step) => {
                expect(step).to.be.lessThanOrEqual(5);
                if (step > 1 && step < 5) {
                    expect(query.method).to.equal('select');
                    expect(query.transacting).to.be.true;
                }

                query.response([]);
            });

            tracker.install();

            const expected = {};
            return expect(MyDecoderService.decodeMyrotvorets([[1, 2, '!1-0-1-2']])).to.become(expected);
        });

        it('should return the expected results', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input: Item[] = [
                [1, 12, '!1-0-1-12'],
                [2, 21, '!1-0-2-21'],
            ];

            const expected = decodeMyrotvoretsResult;
            return expect(MyDecoderService.decodeMyrotvorets(input)).to.become(expected);
        });
    });

    describe('decode', () => {
        let db: knexpkg.Knex;

        before(() => {
            const { knex } = knexpkg.default;
            db = knex({ client: FakeClient });
            mockKnex.mock(db);
            Model.knex(db);
        });

        after(() => {
            mockKnex.unmock(db);
            return db.destroy();
        });

        afterEach(() => mockKnex.getTracker().uninstall());

        it('should handle empty input', () => {
            const expected = {};
            return expect(DecoderService.decode([])).to.become(expected);
        });

        it('should produce the expected results', () => {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input = ['!1-0-1-12', '!1-0-2-21'];

            const expected = decodeMyrotvoretsResult;
            return expect(MyDecoderService.decode(input)).to.become(expected);
        });
    });
});
