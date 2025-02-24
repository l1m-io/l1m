import Anthropic from "@anthropic-ai/sdk";
import { Validator, Schema } from "jsonschema";
import crypto from "crypto";
import { redis } from "../redis";

export function generateRequestId(jsonString: string, schema: Schema): string {
  function minimalJson(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return minimalJson(obj[0]);
    } else if (typeof obj === "object" && obj !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = minimalJson(value);
      }
      return result;
    } else {
      return obj;
    }
  }

  const keys = JSON.stringify(minimalJson(jsonString), null, 2)
    .split("\n")
    .filter((line) => {
      const possibleKey = line.trim().split(":")[0].trim();
      return possibleKey.startsWith('"') && possibleKey.endsWith('"');
    })
    .map((line) => {
      const [key, value] = line.trim().split(":");

      console.log(key, value);

      const valueType = value.includes("[") ? "(array)" : "(scalar)";

      return `${key}:${valueType}`;
    })
    .sort()
    .join(",");

  const hash = crypto.createHash("sha256");
  hash.update(keys);
  hash.update(JSON.stringify(schema));
  return hash.digest("hex");
}

async function generateFn(raw: string, jsonSchema: Schema) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Create an example based on the schema for demonstration
  const exampleOutput = createExampleFromSchema(jsonSchema);

  const systemPrompt = `You are a data extraction specialist that generates javascript code to extract data from a given text.
You must:
1. Generate javascript code that extracts information that matches the provided schema exactly
2. Return ONLY the javascript code with no additional text or explanation
3. Ensure all required fields from the schema are present
4. Use null for missing values rather than omitting fields

Schema: ${JSON.stringify(jsonSchema, null, 2)}

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
        content: `Extract data as JSON matching the schema. Input text: ${raw}`,
      },
      {
        role: "assistant",
        content: "function extract(json) {", // Prefill the start of JSON response
      },
    ],
  });

  console.log(message.content);

  const response =
    message.content[0].type === "text" ? message.content[0].text : "";
  const fn = `(function extract(json) { ${response})`;

  return fn;
}

export async function extractJson(raw: string, jsonSchema: Schema) {
  const requestId = generateRequestId(raw, jsonSchema);
  const fromCache = await redis.get(`json_${requestId}`);

  const fn = fromCache ?? (await generateFn(raw, jsonSchema));

  const code = `${fn}(${raw})`;

  // evaluate the code
  const result = eval(code);

  console.log(result);

  // Validate using jsonschema
  const validator = new Validator();
  const validationResult = validator.validate(result, jsonSchema);

  if (!validationResult.valid) {
    const errors = validationResult.errors
      .map((error) => error.stack)
      .join("\n");
    throw new Error(`Schema validation failed:\n${errors}`);
  }

  await redis.set(`json_${generateRequestId(raw, jsonSchema)}`, fn);

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
