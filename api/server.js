"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const async_retry_1 = __importDefault(require("async-retry"));
const fastify_1 = __importDefault(require("fastify"));
const contract_1 = require("./contract");
const fastify_2 = require("@ts-rest/fastify");
const redis_1 = require("./redis");
const baml_1 = require("./baml");
const baml_2 = require("@boundaryml/baml");
const server = (0, fastify_1.default)({ logger: true });
const s = (0, fastify_2.initServer)();
const generateCacheKey = (input) => {
    const hash = crypto_1.default.createHash("sha256");
    input.forEach(text => hash.update(text));
    return hash.digest("hex");
};
const validMimeTypes = [
    "text/plain",
    "application/json",
    "image/jpeg",
    "image/png",
];
const router = s.router(contract_1.apiContract, {
    health: async () => {
        return {
            status: 200,
            body: {
                status: "ok",
                timestamp: Date.now(),
                uptime: process.uptime(),
            },
        };
    },
    structured: async ({ body, request, headers }) => {
        const startTime = process.hrtime();
        const schema = body.schema;
        const url = body.url;
        let raw = body.raw;
        let type;
        if (url) {
            try {
                const result = await (0, async_retry_1.default)(async () => {
                    const response = await fetch(url);
                    const buffer = await response.arrayBuffer();
                    return {
                        raw: Buffer.from(buffer).toString("base64"),
                        type: response.headers.get("content-type"),
                    };
                }, { retries: 2 });
                raw = result.raw;
                type = result.type ?? type;
            }
            catch {
                server.log.warn({ route: "structured", error: "Failed to fetch url contents" });
                return {
                    status: 400,
                    body: {
                        message: "Failed to fetch url contents",
                    },
                };
            }
        }
        if (type && !validMimeTypes.includes(type)) {
            server.log.warn({ route: "structured", error: "Invalid mime type", type });
            return {
                status: 400,
                body: {
                    message: "Provided URL has invalid mime type",
                    type,
                },
            };
        }
        if (!raw) {
            throw new Error("Could not find raw content");
        }
        server.log.info({
            route: "structured",
            schemaType: schema.type,
            contentLength: raw.length,
        });
        try {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            let cacheKey = generateCacheKey([raw, JSON.stringify(schema), headers["x-provider-key"] ?? ""]);
            if (headers["x-cache-key"] && headers["x-provider-key"]) {
                cacheKey = generateCacheKey([headers["x-cache-key"], headers["x-provider-key"]]);
            }
            // TODO: Validate model support
            const fromCache = await redis_1.redis?.get(cacheKey);
            let result = fromCache ? JSON.parse(fromCache) : await (0, baml_1.structured)({
                raw,
                type,
                schema,
                clientRegistry: (0, baml_1.buildClientRegistry)({
                    url: headers["x-provider-url"],
                    key: headers["x-provider-key"],
                    model: headers["x-provider-model"],
                })
            });
            if (!fromCache) {
                await redis_1.redis?.set(cacheKey, JSON.stringify(result));
            }
            server.log.info({
                event: "structured_success",
                cached: !!fromCache,
                duration_ms: duration.toFixed(2),
            });
            return {
                status: 200,
                body: {
                    data: result,
                },
            };
        }
        catch (error) {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            server.log.error({
                route: "structured",
                ...(error instanceof Error ? { error: error.message } : { error: error }),
                duration_ms: duration.toFixed(2),
            });
            throw error;
        }
    },
});
server.setErrorHandler((error, request, reply) => {
    // Forward provider error messages / status codes
    if (error instanceof baml_2.BamlClientHttpError) {
        // TODO: Check if this is consistent for other providers
        let providerResponse = error.message.split("\n")[1];
        try {
            providerResponse = JSON.parse(providerResponse);
        }
        catch { }
        reply.status(error.status_code || 500).send({
            providerResponse,
            message: "Failed to call provider",
        });
    }
    else if (error instanceof baml_2.BamlValidationError || error instanceof baml_2.BamlClientFinishReasonError) {
        reply.status(400).send({
            message: error.message,
        });
    }
    else {
        reply.status(error.statusCode || 500).send({
            message: error.message,
        });
    }
});
// Register the routes
server.register(s.plugin(router));
// Start the server
const start = async () => {
    try {
        await server.listen({
            port: 3000,
            host: "0.0.0.0",
        });
        server.log.info("Server started");
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
