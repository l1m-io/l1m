import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { redis } from "../redis";
import { Schema } from "jsonschema";
import { Validator } from "jsonschema";

export function generateTextFingerprint(text: string, schema: Schema): string {
  const hash = crypto.createHash("sha256");
  hash.update(text);
  hash.update(JSON.stringify(schema));
  return hash.digest("hex");
}

export async function extractText(raw: string, schema: Schema) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const requestId = generateTextFingerprint(raw, schema);
  const fromCache = await redis.get(`text_${requestId}`);

  console.log("fromCache", fromCache);
  console.log("requestId", requestId);

  if (fromCache && typeof fromCache === "string") {
    return JSON.parse(fromCache);
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Create an example based on the schema for demonstration
  const exampleOutput = createExampleFromSchema(schema);

  const systemPrompt = `You are a data extraction specialist that extracts structured data from text.
You must:
1. Extract information that matches the provided schema exactly
2. Return ONLY a JSON object with the specified fields
3. Ensure all required fields from the schema are present
4. Use null for any information that cannot be confidently extracted

Schema: ${JSON.stringify(schema, null, 2)}

Example output format:
${JSON.stringify(exampleOutput, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Extract structured data from the following text and return it as a JSON object: ${raw}`,
      },
    ],
  });

  const response =
    message.content[0].type === "text" ? message.content[0].text : "";
  const result = JSON.parse(response);

  // Validate using jsonschema
  const validator = new Validator();
  const validationResult = validator.validate(result, schema);

  if (!validationResult.valid) {
    const errors = validationResult.errors
      .map((error) => error.stack)
      .join("\n");
    throw new Error(`Schema validation failed:\n${errors}`);
  }

  await redis.set(`text_${requestId}`, JSON.stringify(result));

  return result;
}

function createExampleFromSchema(schema: Schema): any {
  if (!schema.type) {
    return null;
  }

  switch (schema.type) {
    case "string":
      return "example_string";
    case "number":
    case "integer":
      return 123;
    case "boolean":
      return true;
    case "array":
      if (schema.items && typeof schema.items === "object") {
        return [createExampleFromSchema(schema.items as Schema)];
      }
      return [];
    case "object":
      if (schema.properties) {
        const example: Record<string, any> = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          example[key] = createExampleFromSchema(propSchema as Schema);
        }
        return example;
      }
      return {};
    default:
      return null;
  }
}
