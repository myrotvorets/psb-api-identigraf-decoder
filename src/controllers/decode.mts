import { type NextFunction, type Request, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import { DecodedItem, DecoderService } from '../services/decoder.mjs';

type DecodeRequestBody = string[];

export interface DecodeBody {
    success: true;
    items: Record<string, DecodedItem>;
}

async function decodeHandler(
    req: Request<never, DecodeBody, DecodeRequestBody, never>,
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
