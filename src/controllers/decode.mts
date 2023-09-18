import { type NextFunction, type Request, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import { DecodedItem, DecoderService } from '../services/decoder.mjs';

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

export function decodeController(): Router {
    const router = Router();
    router.post('/decode', asyncWrapperMiddleware(decodeHandler));
    return router;
}
