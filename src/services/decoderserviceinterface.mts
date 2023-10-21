export interface DecodedItem {
    name: string;
    country: string;
    link: string;
    primaryPhoto: string | null;
    matchedPhoto: string | null;
}

export interface DecoderServiceInterface {
    decode(items: Readonly<string[]>): Promise<Record<string, DecodedItem>>;
}
