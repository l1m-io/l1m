import fastify from "fastify";
import { initServer } from "@ts-rest/fastify";
import { apiContract } from "./contract";
import { extractJson } from "./strategies/json";
import { extractText } from "./strategies/text";

const server = fastify({ logger: true });
const s = initServer();

// Implement the contract
const router = s.router(apiContract, {
  extract: async ({ body }) => {
    const { raw, mimeType, schema } = body;

    let result;
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

    return {
      status: 200,
      body: {
        success: true,
        data: result,
      },
    };
  },
});

// Register the routes
server.register(s.plugin(router));

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
