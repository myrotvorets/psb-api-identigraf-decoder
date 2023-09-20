// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertCollection<Item extends Record<string | number, any>, Key extends keyof Item>(
    items: Item[],
    key: Key,
): Record<number | string, Item> {
    return items.reduce<Record<number | string, Item>>((accumulator, current) => {
        accumulator[current[key] as string | number] = current;
        return accumulator;
    }, {});
}
