import fastify from "fastify";
import { initServer } from "@ts-rest/fastify";
import { apiContract } from "./contract";
import { extractJson } from "./strategies/json";
import { extractText } from "./strategies/text";

const server = fastify({ logger: true });
const s = initServer();

// Implement the contract
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
  extract: async ({ body, request }) => {
    const startTime = process.hrtime();
    const { raw, mimeType, schema } = body;

    server.log.info({
      event: "extract_request",
      mimeType,
      schemaType: schema.type,
      contentLength: raw.length,
    });

    let result;
    try {
      switch (mimeType) {
        case "application/json":
          result = await extractJson(raw, schema);
          break;
        case "text/plain":
          result = await extractText(raw, schema);
          break;
        default:
          throw new Error(`Unsupported mimeType: ${mimeType}`);
      }

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      server.log.info({
        event: "extract_success",
        mimeType,
        duration_ms: duration.toFixed(2),
      });

      return {
        status: 200,
        body: {
          success: true,
          data: result,
        },
      };
    } catch (error) {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      server.log.error({
        event: "extract_error",
        mimeType,
        error: (error as Error).message,
        duration_ms: duration.toFixed(2),
      });

      throw error;
    }
  },
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
    server.log.info(`Server started at ${new Date().toISOString()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
