"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiContract = void 0;
const core_1 = require("@ts-rest/core");
const zod_1 = require("zod");
const c = (0, core_1.initContract)();
const hasDefaultProvider = !!process.env.DEFAULT_BEDROCK_MODEL;
exports.apiContract = c.router({
    health: {
        method: "GET",
        path: "/health",
        responses: {
            200: zod_1.z.object({
                status: zod_1.z.string(),
                timestamp: zod_1.z.number(),
                uptime: zod_1.z.number(),
            }),
        },
    },
    structured: {
        method: "POST",
        path: "/structured",
        body: zod_1.z.object({
            raw: zod_1.z.string().optional(),
            url: zod_1.z.string().optional(),
            schema: zod_1.z.record(zod_1.z.any()),
        })
            .refine((body) => (body.raw || body.url) && !((body.raw && body.url) || !(body.raw || body.url)), "Either raw or url must be provided"),
        headers: zod_1.z.object({
            ...(hasDefaultProvider ? {
                "x-provider-model": zod_1.z.string().optional(),
                "x-provider-url": zod_1.z.string().optional(),
                "x-provider-key": zod_1.z.string().optional(),
            } : {
                "x-provider-model": zod_1.z.string(),
                "x-provider-url": zod_1.z.string(),
                "x-provider-key": zod_1.z.string(),
            }),
            "x-cache-key": zod_1.z.string().optional(),
        })
            // If any "x-provider" header is set, then all "x-provider" headers must be set
            .refine((headers) => (!headers["x-provider-model"] && !headers["x-provider-url"] && !headers["x-provider-key"])
            || (headers["x-provider-model"] && headers["x-provider-url"] && headers["x-provider-key"]), "If any x-provider-* header is set, then all x-provider headers must be set"),
        responses: {
            200: zod_1.z.object({
                data: zod_1.z.record(zod_1.z.any()),
            }),
        },
    },
});
