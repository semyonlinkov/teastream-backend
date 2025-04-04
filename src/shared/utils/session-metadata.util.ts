import type { Request } from "express"
import { lookup } from 'geoip-lite';

import type { SessionMetadata } from "../types/session-metadata.types"
import DeviceDetector = require('device-detector-js');
import { IS_DEV_ENV } from "./is-dev.util"

export function getSessionMetadata(
    req: Request,
    userAgent: string
): SessionMetadata {
    const ip = IS_DEV_ENV
        ? '173.166.164.121'
        : Array.isArray(req.headers['cf-connecting-ip'])
            ? req.headers['cf-connecting-ip'][0]
            : req.headers['cf-connecting-ip'] ||
            (typeof req.headers['x-forwarded-for'] === 'string'
                ? req.headers['x-forwarded-for'].split(',')[0]
                : req.ip)



    //TODO ip type error
    const location = lookup(ip as string);
    const device = new DeviceDetector().parse(userAgent)

    return {
        location: {
            country: location?.country || 'Неизвестно',
            city: location!?.city,
            latitude: location?.ll[0] || 0,
            longitude: location?.ll[1] || 0
        },
        device: {
            browser: device.client?.name as string,
            os: device.os?.name as string,
            type: device.device!?.type
        },
        //@ts-ignore
        ip
    }
}