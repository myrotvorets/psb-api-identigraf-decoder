import { expect } from 'chai';
import type { QueryDetails } from 'mock-knex';
import { criminalsResponse, photosResponse, primaryPhotosResponse } from './fixtures/queryresponses.mjs';

export function decodeMyrotvoretsQueryHandler(query: QueryDetails, step: number): void {
    expect(step).to.be.greaterThanOrEqual(1).and.lessThanOrEqual(5);
    if (step > 1 && step < 5) {
        expect(query.method).to.equal('select');
        expect(query.transacting).to.be.true;

        if (query.sql.includes('from `criminals`')) {
            return query.response(criminalsResponse);
        }

        if (query.sql.includes('FIRST_VALUE(att_id)')) {
            return query.response(primaryPhotosResponse);
        }

        return query.response(photosResponse);
    }

    return query.response([]);
}
