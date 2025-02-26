import crypto from "crypto";
import fastify from "fastify";

import { apiContract } from "./contract";
import { initServer } from "@ts-rest/fastify";
import { redis } from "./redis";
import { buildClientRegistry, structured } from "./baml";
import {
  BamlClientFinishReasonError,
  BamlClientHttpError,
  BamlValidationError,
} from "@boundaryml/baml";
import { inferMimeType } from "./base64";

const server = fastify({ logger: true });
const s = initServer();

const generateCacheKey = (input: string[]) => {
  const hash = crypto.createHash("sha256");
  input.forEach((text) => hash.update(text));
  return hash.digest("hex");
};

const validMimeTypes = [
  "text/plain",
  "application/json",
  "image/jpeg",
  "image/png",
];

const router = s.router(apiContract, {
  home: async () => {
    return {
      status: 200,
      body: {
        message:
          "Hello, world! This is the l1m (pronounced el-one-em) API. It's a simple API that allows you to extract structured data from text. See https://l1m.io for docs.",
      },
    };
  },
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

    const providerKey = headers["x-provider-key"];
    const providerModel = headers["x-provider-model"];
    const providerUrl = headers["x-provider-url"];

    const { input, schema } = body;

    const type = await inferMimeType(input);

    if (type && !validMimeTypes.includes(type)) {
      server.log.warn({
        route: "structured",
        error: "Invalid mime type",
        type,
      });
      return {
        status: 400,
        body: {
          message: "Provided content has invalid mime type",
          type,
        },
      };
    }

    server.log.info({
      route: "structured",
      schemaType: schema.type,
      contentLength: input.length,
    });

    try {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      let cacheKey: string = generateCacheKey([
        input,
        JSON.stringify(schema),
        providerKey,
        providerModel,
      ]);

      if (headers["x-cache-key"]) {
        cacheKey = generateCacheKey([
          headers["x-cache-key"],
          providerKey,
          providerModel,
        ]);
      }

      const fromCache = await redis?.get(cacheKey);

      let result = fromCache
        ? JSON.parse(fromCache)
        : await structured({
            input,
            type,
            schema,
            clientRegistry: buildClientRegistry({
              url: providerUrl,
              key: providerKey,
              model: providerModel,
            }),
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
        ...(error instanceof Error
          ? { error: error.message }
          : { error: error }),
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
    } catch {}

    reply.status(error.status_code || 500).send({
      providerResponse,
      message: "Failed to call provider",
    });
  } else if (
    error instanceof BamlValidationError ||
    error instanceof BamlClientFinishReasonError
  ) {
    reply.status(200).send({
      data: null,
    });
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
