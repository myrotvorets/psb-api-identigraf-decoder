import type { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import type { DecodeBody } from '../../src/controllers/decode.mjs';

interface E2ETestData {
    code: number;
    request: string[];
    response: ErrorResponse | DecodeBody;
}

export const e2eData: E2ETestData[] = [
    {
        code: 200,
        request: ['!1-0-1-12', '!1-0-2-21'],
        response: {
            success: true,
            items: {
                '!1-0-1-12': {
                    name: 'Путин Владимир Владимирович',
                    country: 'Россия',
                    link: 'https://myrotvorets.center/criminal/putin-vladimir-vladimirovich/',
                    primaryPhoto: 'https://cdn.myrotvorets.center/m/criminals/00/37/41/img_50247fffa5534dc.jpg',
                    matchedPhoto:
                        'https://cdn.myrotvorets.center/m/criminals/00/37/41/0_9acf5_10c20f0c_L_zpsbbf9285b.jpg',
                },
                '!1-0-2-21': {
                    name: 'Захарченко Александр Владимирович',
                    country: 'Украина',
                    link: 'https://myrotvorets.center/criminal/zakharchenko-aleksandr-vladimirovich-2/',
                    primaryPhoto: 'https://cdn.myrotvorets.center/m/criminals/00/25/b9/19-zaharchenko-010.jpg',
                    matchedPhoto: null as string | null,
                },
            },
        },
    },
    {
        code: 200,
        request: ['!1-0-100-500'],
        response: {
            success: true,
            items: {},
        },
    },
    {
        code: 200,
        request: ['!1-0-A-B'],
        response: {
            success: true,
            items: {},
        },
    },
    {
        code: 200,
        request: ['!1-0-3-100'],
        response: {
            success: true,
            items: {
                '!1-0-3-100': {
                    country: '',
                    link: 'https://myrotvorets.center/criminal/andreo-sergej-vladimirovich/',
                    name: 'Андрео Сергей Владимирович',
                    primaryPhoto: null,
                    matchedPhoto: null,
                },
            },
        },
    },
    {
        code: 200,
        request: ['!9-0-100-500'],
        response: {
            success: true,
            items: {},
        },
    },
    {
        code: 400,
        request: [],
        response: {
            success: false,
            status: 400,
            code: 'BAD_REQUEST',
            message: 'request/body must NOT have fewer than 1 items',
            errors: [
                {
                    errorCode: 'minItems.openapi.validation',
                    message: 'must NOT have fewer than 1 items',
                    path: '/body',
                },
            ],
        },
    },
];
