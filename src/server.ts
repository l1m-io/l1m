import assert from "assert";

import crypto from "crypto";
import retry from "async-retry";
import fastify from "fastify";

import { apiContract } from "./contract";
import { initServer } from "@ts-rest/fastify";
import { redis } from "./redis";
import { Schema } from "jsonschema";
import { buildClientRegistry, structured } from "./baml";
import { BamlClientFinishReasonError, BamlClientHttpError, BamlValidationError } from "@boundaryml/baml";

const server = fastify({ logger: true });
const s = initServer();

const generateCacheKey = (input: string[]) => {
  const hash = crypto.createHash("sha256");
  input.forEach(text => hash.update(text));
  return hash.digest("hex");
}

const validMimeTypes = [
  "text/plain",
  "application/json",

  "image/jpeg",
  "image/png",
]

const router = s.router(apiContract, {
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

    let type: string | undefined;

    if (url) {
      try {
        const result = await retry(async () => {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          return {
            raw: Buffer.from(buffer).toString("base64"),
            type: response.headers.get("content-type"),
          }
        }, { retries: 2 });

        raw = result.raw;
        type = result.type ?? type;

      } catch {
        server.log.warn({route: "structured", error: "Failed to fetch url contents"});
        return {
          status: 400,
          body: {
            message: "Failed to fetch url contents",
          },
        }
      }
    }

    if (type && !validMimeTypes.includes(type)) {
      server.log.warn({route: "structured", error: "Invalid mime type", type});
      return {
        status: 400,
        body: {
          message: "Provided content has invalid mime type",
          type,
        },
      }

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

      let cacheKey: string = generateCacheKey([raw, JSON.stringify(schema), headers["x-provider-key"] ?? ""]);

      if (headers["x-cache-key"] && headers["x-provider-key"]) {
        cacheKey = generateCacheKey([headers["x-cache-key"], headers["x-provider-key"]])
      }

      // TODO: Validate model support

      const fromCache = await redis?.get(cacheKey);

      let result = fromCache ? JSON.parse(fromCache) : await structured({
        raw,
        type,
        schema,
        clientRegistry: buildClientRegistry({
          url: headers["x-provider-url"],
          key: headers["x-provider-key"],
          model: headers["x-provider-model"],
        })
      });

      if (!fromCache) {
        await redis?.set(cacheKey, JSON.stringify(result));
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
    } catch (error) {
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
  if (error instanceof BamlClientHttpError) {
    // TODO: Check if this is consistent for other providers
    let providerResponse = error.message.split("\n")[1];

    try {
      providerResponse = JSON.parse(providerResponse);
    } catch { }

    reply.status(error.status_code || 500).send({
      providerResponse,
      message: "Failed to call provider",
    });
  } else if (error instanceof BamlValidationError || error instanceof BamlClientFinishReasonError) {
    reply.status(200).send({
      data: null,
    })
  } else {
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
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
