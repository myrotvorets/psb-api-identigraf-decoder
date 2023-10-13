/* eslint-disable import/no-named-as-default-member */
import { expect } from 'chai';
import mockKnex from 'mock-knex';
import * as knexpkg from 'knex';
import { Model } from 'objection';
import { FakeClient } from '@myrotvorets/fake-knex-client';
import { type DecodedItem, DecoderService, type Queue, type QueueItem } from '../../../src/services/decoder.mjs';
import { decodeMyrotvoretsResult } from '../../fixtures/results.mjs';
import { decodeMyrotvoretsQueryHandler } from '../../helpers.mjs';

class MyDecoderService extends DecoderService {
    public static override prepareV1Items(items: Readonly<string[]>, queue: Readonly<Queue>): Queue {
        return DecoderService.prepareV1Items(items, queue);
    }

    public static override decodeMyrotvorets(items?: QueueItem[]): Promise<Record<string, DecodedItem>> {
        return DecoderService.decodeMyrotvorets(items);
    }
}

describe('DecoderService', function () {
    describe('prepareV1Items', function () {
        it('should reject invalid items', function () {
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

        it('should properly process valid items', function () {
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

    describe('decodeMyrotvorets', function () {
        let db: knexpkg.Knex;

        before(function () {
            const { knex } = knexpkg.default;
            db = knex({ client: FakeClient });
            mockKnex.mock(db);
            Model.knex(db);
        });

        after(function () {
            mockKnex.unmock(db);
        });

        afterEach(function () {
            mockKnex.getTracker().uninstall();
        });

        const table: (undefined | QueueItem[])[] = [undefined, []];

        // eslint-disable-next-line mocha/no-setup-in-describe
        table.forEach((input) => {
            it(`should return an empty object on empty input (${JSON.stringify(input)})`, function () {
                const expected = {};
                return expect(MyDecoderService.decodeMyrotvorets(input)).to.become(expected);
            });
        });

        it('should handle empty result sets gracefully', function () {
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

        it('should return the expected results', function () {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input: QueueItem[] = [
                [1, 12, '!1-0-1-12'],
                [2, 21, '!1-0-2-21'],
            ];

            const expected = decodeMyrotvoretsResult;
            return expect(MyDecoderService.decodeMyrotvorets(input)).to.become(expected);
        });
    });

    describe('decode', function () {
        let db: knexpkg.Knex;

        before(function () {
            const { knex } = knexpkg.default;
            db = knex({ client: FakeClient });
            mockKnex.mock(db);
            Model.knex(db);
        });

        after(function () {
            mockKnex.unmock(db);
            return db.destroy();
        });

        afterEach(function () {
            mockKnex.getTracker().uninstall();
        });

        it('should handle empty input', function () {
            const expected = {};
            return expect(DecoderService.decode([])).to.become(expected);
        });

        it('should produce the expected results', function () {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input = ['!1-0-1-12', '!1-0-2-21'];

            const expected = decodeMyrotvoretsResult;
            return expect(MyDecoderService.decode(input)).to.become(expected);
        });
    });
});
