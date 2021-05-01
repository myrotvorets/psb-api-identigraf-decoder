import { NextFunction, Request, Response, Router } from 'express';
import asyncWrapper from '@myrotvorets/express-async-middleware-wrapper';
import DecoderService, { DecodedItem } from '../services/decoder';

type DefaultParams = Record<string, string>;

type DecodeRequestBody = string[];

interface DecodeBody {
    success: true;
    items: Record<string, DecodedItem>;
}

async function decodeHandler(
    req: Request<DefaultParams, DecodeBody, DecodeRequestBody>,
    res: Response<DecodeBody>,
    next: NextFunction,
): Promise<void> {
    const items = await DecoderService.decode(req.body);
    res.json({
        success: true,
        items,
    });

    next();
}

export default function (): Router {
    const router = Router();
    router.post('/decode', asyncWrapper(decodeHandler));
    return router;
}
