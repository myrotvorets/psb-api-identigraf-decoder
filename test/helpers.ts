import { QueryDetails } from 'mock-knex';
import { criminalsResponse, photosResponse, primaryPhotosResponse } from './fixtures/queryresponses';

export function decodeMyrotvoretsQueryHandler(query: QueryDetails, step: number): void {
    expect(step).toBeLessThanOrEqual(5);
    if (step > 1 && step < 5) {
        expect(query.method).toBe('select');
        expect(query.transacting).toBe(true);

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
