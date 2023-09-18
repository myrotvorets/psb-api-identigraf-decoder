import { Knex } from 'knex';

declare module './fake-client.cjs' {
    export class FakeClient extends Knex.Client {}
}
