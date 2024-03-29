import { expect } from 'chai';
import { convertCollection } from '../../../src/lib/helpers.mjs';

describe('convertCollection', function () {
    it('should convert collections to keyed objects', function () {
        const expected = {
            0: { id: 0, data: 'data 0' },
            1: { id: 1, data: 'data 1' },
            2: { id: 2, data: 'data 2', extra: 2 },
            3: { id: 3, data: 'data 3' },
        };

        const input = [
            { id: 0, data: 'data 0' },
            { id: 1, data: 'data 1' },
            { id: 3, data: 'data 3' },
            { id: 2, data: 'data 2', extra: 2 },
        ];

        const actual = convertCollection(input, 'id');
        expect(actual).to.deep.equal(expected);
    });

    it('should handle empty arrays', function () {
        const expected = {};
        const actual = convertCollection([], 'id');
        expect(actual).to.deep.equal(expected);
    });

    it('should handle duplicate IDs', function () {
        const expected = { key: { id: 'key' } };
        const input = [{ id: 'key' }, { id: 'key' }];
        const actual = convertCollection(input, 'id');
        expect(actual).to.deep.equal(expected);
    });
});
