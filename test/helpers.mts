import { expect } from 'chai';
import type { QueryDetails } from 'mock-knex';
import { criminalsResponse, photosResponse, primaryPhotosResponse } from './fixtures/queryresponses.mjs';

export function decodeMyrotvoretsQueryHandler(query: QueryDetails, step: number): void {
    expect(step).to.be.greaterThanOrEqual(1).and.lessThanOrEqual(6);
    if (step > 2 && step < 6) {
        expect(query.method).to.equal('select');
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(query.transacting).to.be.true;

        if (query.sql.includes('from `criminals`')) {
            query.response(criminalsResponse);
            return;
        }

        if (query.sql.includes('FIRST_VALUE(att_id)')) {
            query.response(primaryPhotosResponse);
            return;
        }

        query.response(photosResponse);
        return;
    }

    query.response([]);
}
