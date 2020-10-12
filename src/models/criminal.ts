import { Model } from 'objection';

export default class Criminal extends Model {
    public id!: number;
    public slug!: string;
    public name!: string;
    public nname!: string;
    public dob!: string;
    public country!: string;
    public address!: string;
    public description!: string;

    public static tableName = 'criminals';

    public get link(): string {
        return `https://myrotvorets.center/criminal/${this.slug}/`;
    }
}
