/* eslint-disable import/no-named-as-default-member */
import { expect } from 'chai';
import mockKnex from 'mock-knex';
import { asClass } from 'awilix';
import { container, initializeContainer } from '../../../src/lib/container.mjs';
import { DecoderServiceInterface } from '../../../src/services/decoderserviceinterface.mjs';
import { DecoderService, type Queue, type QueueItem } from '../../../src/services/decoderservice.mjs';
import { decodeMyrotvoretsResult } from '../../fixtures/results.mjs';
import { decodeMyrotvoretsQueryHandler } from '../../helpers.mjs';

class MyDecoderService extends DecoderService {
    public static override prepareV1Items(
        ...params: Parameters<(typeof DecoderService)['prepareV1Items']>
    ): ReturnType<(typeof DecoderService)['prepareV1Items']> {
        return DecoderService.prepareV1Items(...params);
    }

    public override decodeMyrotvorets(
        ...params: Parameters<DecoderService['decodeMyrotvorets']>
    ): ReturnType<DecoderService['decodeMyrotvorets']> {
        return super.decodeMyrotvorets(...params);
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
        let service: MyDecoderService;

        before(async function () {
            await container.dispose();
            initializeContainer();
            container.register('decoderService', asClass(MyDecoderService).singleton());
            mockKnex.mock(container.resolve('db'));
            service = container.resolve('decoderService') as MyDecoderService;
        });

        after(function () {
            return container.dispose();
        });

        afterEach(function () {
            mockKnex.getTracker().uninstall();
        });

        const table: (undefined | QueueItem[])[] = [undefined, []];

        // eslint-disable-next-line mocha/no-setup-in-describe
        table.forEach((input) => {
            it(`should return an empty object on empty input (${JSON.stringify(input)})`, function () {
                const expected = {};
                return expect(service.decodeMyrotvorets(input)).to.become(expected);
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
            return expect(service.decodeMyrotvorets([[1, 2, '!1-0-1-2']])).to.become(expected);
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
            return expect(service.decodeMyrotvorets(input)).to.become(expected);
        });
    });

    describe('decode', function () {
        let service: DecoderServiceInterface;

        before(async function () {
            await container.dispose();
            initializeContainer();
            mockKnex.mock(container.resolve('db'));
            service = container.resolve('decoderService');
        });

        after(function () {
            return container.dispose();
        });

        afterEach(function () {
            mockKnex.getTracker().uninstall();
        });

        it('should handle empty input', function () {
            const expected = {};
            return expect(service.decode([])).to.become(expected);
        });

        it('should produce the expected results', function () {
            const tracker = mockKnex.getTracker();
            tracker.on('query', decodeMyrotvoretsQueryHandler);
            tracker.install();
            const input = ['!1-0-1-12', '!1-0-2-21'];

            const expected = decodeMyrotvoretsResult;
            return expect(service.decode(input)).to.become(expected);
        });
    });
});
