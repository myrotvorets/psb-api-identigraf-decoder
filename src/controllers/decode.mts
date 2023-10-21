import { type NextFunction, type Request, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import { LocalsWithContainer } from '../lib/container.mjs';
import { DecodedItem } from '../services/decoderserviceinterface.mjs';

type DecodeRequestBody = string[];

export interface DecodeBody {
    success: true;
    items: Record<string, DecodedItem>;
}

async function decodeHandler(
    req: Request<never, DecodeBody, DecodeRequestBody, never>,
    res: Response<DecodeBody, LocalsWithContainer>,
    next: NextFunction,
): Promise<void> {
    const service = res.locals.container.resolve('decoderService');
    const items = await service.decode(req.body);
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
