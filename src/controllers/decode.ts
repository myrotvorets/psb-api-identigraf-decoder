import { NextFunction, Request, Response, Router } from 'express';
import DecoderService, { DecodedItem } from '../services/decoder';

type DefaultParams = Record<string, string>;

type DecodeRequestBody = string[];

interface DecodeBody {
    success: true;
    items: Record<string, DecodedItem>;
}

function decodeHandler(
    req: Request<DefaultParams, DecodeBody, DecodeRequestBody>,
    res: Response<DecodeBody>,
    next: NextFunction,
): void {
    DecoderService.decode(req.body)
        .then((items) =>
            res.json({
                success: true,
                items,
            }),
        )
        .catch(next);
}

export default function (): Router {
    const router = Router();
    router.post('/decode', decodeHandler);
    return router;
}
