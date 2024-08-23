export interface DecodedItem {
    name: string;
    country: string;
    link: string;
    primaryPhoto: string | null;
    matchedPhoto: string | null;
}

export interface DecoderServiceInterface {
    decode(items: readonly string[]): Promise<Record<string, DecodedItem>>;
}
