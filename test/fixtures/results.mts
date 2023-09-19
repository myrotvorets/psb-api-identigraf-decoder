export const decodeMyrotvoretsResult = {
    '!1-0-1-12': {
        name: 'Name 1',
        country: 'Country 1',
        link: 'https://myrotvorets.center/criminal/name-1/',
        primaryPhoto: 'https://cdn.myrotvorets.center/m/photo1-1.jpg',
        matchedPhoto: 'https://cdn.myrotvorets.center/m/photo1-2.jpg',
    },
    '!1-0-2-21': {
        name: 'Name 2',
        country: 'Country 2',
        link: 'https://myrotvorets.center/criminal/name-2/',
        primaryPhoto: null as string | null,
        matchedPhoto: null as string | null,
    },
};

export const e2eResult = {
    success: true,
    items: {
        '!1-0-1-12': {
            name: 'Путин Владимир Владимирович',
            country: 'Россия',
            link: 'https://myrotvorets.center/criminal/putin-vladimir-vladimirovich/',
            primaryPhoto: 'https://cdn.myrotvorets.center/m/criminals/00/37/41/img_50247fffa5534dc.jpg',
            matchedPhoto: 'https://cdn.myrotvorets.center/m/criminals/00/37/41/0_9acf5_10c20f0c_L_zpsbbf9285b.jpg',
        },
        '!1-0-2-21': {
            name: 'Захарченко Александр Владимирович',
            country: 'Украина',
            link: 'https://myrotvorets.center/criminal/zakharchenko-aleksandr-vladimirovich-2/',
            primaryPhoto: 'https://cdn.myrotvorets.center/m/criminals/00/25/b9/19-zaharchenko-010.jpg',
            matchedPhoto: null as string | null,
        },
    },
};
