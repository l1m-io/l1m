import fastify from "fastify";

import { apiContract } from "./contract";
import { initServer } from "@ts-rest/fastify";
import { generateCacheKey, redis } from "./redis";
import { getDemoData } from "./demo-provider";

import { validateJsonSchema, structured, validTypes, inferType } from "@l1m/core";

const server = fastify({ logger: true });
const s = initServer();

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
  structured: async ({ body, headers, reply }) => {
    const startTime = process.hrtime();

    const providerKey = headers["x-provider-key"];
    const providerModel = headers["x-provider-model"];
    const providerUrl = headers["x-provider-url"];

    const { input, instruction } = body;
    let { schema } = body;

    const schemaError = validateJsonSchema(schema);
    if (schemaError) {
      return {
        status: 400,
        body: {
          message: schemaError,
        },
      };
    }

    const demoData = getDemoData({
      input,
      schema: JSON.stringify(schema),
      providerKey,
      providerModel,
      providerUrl,
    });

    if (demoData) {
      return {
        status: 200,
        body: {
          data: demoData,
        },
      };
    }

    const type = await inferType(input);

    if (type && !validTypes.includes(type)) {
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

      const ttl = parseInt(headers["x-cache-ttl"] ?? "0");

      if (ttl < 0 || ttl > 60 * 60 * 24 * 7) {
        return {
          status: 400,
          body: {
            message:
              "Invalid cache TTL. Must be between 0 and 604800 seconds (7 days).",
          },
        };
      }

      const cacheKey: string | null = ttl
        ? generateCacheKey([
            input,
            JSON.stringify(schema),
            providerKey,
            providerModel,
          ])
        : null;

      const fromCache = cacheKey ? await redis?.get(cacheKey) : null;
      reply.header("x-cache", fromCache ? "HIT" : "MISS");

      const result = fromCache ?
        {
          structured: JSON.parse(fromCache),
          valid: true,
          raw: undefined,
          errors: undefined,
        } :
        await structured({
          input,
          type,
          schema,
          instruction,
          provider: {
            url: providerUrl,
            key: providerKey,
            model: providerModel,
          },
        });

      if (!result.valid) {
        return {
          status: 422,
          body: {
            message: "Failed to extract structured data",
            validation: result.errors,
            raw: result.raw,
            data: result.structured,
          },
        };
      }

      if (!fromCache && cacheKey) {
        await redis?.set(cacheKey, JSON.stringify(result.structured), "EX", ttl);
      }

      server.log.info({
        event: "structured_success",
        cached: !!fromCache,
        duration_ms: duration.toFixed(2),
      });

      return {
        status: 200,
        body: {
          data: result.structured,
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

server.setErrorHandler((error, _, reply) => {
  let status = error.statusCode || 500;
  if ('status' in error && typeof error.status === 'number') {
    status = error.status;

  }

  reply.status(status).send({
    message: error.message || "Internal server error",
  });
});

// Register the routes
server.register(s.plugin(router));

// Start the server
const start = async () => {
  try {
    await server.listen({
      port: 10337,
      host: "0.0.0.0",
    });
    server.log.info("Server started");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', () => {
  server.log.info('SIGTERM signal received: closing HTTP server')
  shutdown()
})

process.on('SIGINT', () => {
  server.log.info('SIGINT signal received: closing HTTP server')
  shutdown()
})

const shutdown = async () => {
  try {
    // Close the server first (stop accepting new connections)
    await server.close()
    server.log.info('HTTP server closed')

    // Close Redis connection if it exists
    if (redis && redis.quit) {
      await redis.quit()
      server.log.info('Redis connection closed')
    }

    server.log.info('Shutdown completed')
    process.exit(0)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
