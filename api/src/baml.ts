import { b } from "./baml_client";
import { Schema } from "jsonschema";
import TypeBuilder from "./baml_client/type_builder";
import { ClassBuilder } from "@boundaryml/baml/type_builder";
import { ClientRegistry, Image, BamlClientHttpError } from "@boundaryml/baml";
import { z } from "zod";

const addJsonProperty = ({
  tb,
  cb,
  property,
  key,
}: {
  tb: TypeBuilder;
  cb: ClassBuilder<string>;
  property: Schema;
  key: string;
}) => {
  if (property.type === "string") {
    cb.addProperty(key, tb.string());
  }

  if (property.type === "number") {
    cb.addProperty(key, tb.float());
  }

  if (property.type === "boolean") {
    cb.addProperty(key, tb.bool());
  }

  if (property.type === "object" && property.properties) {
    const nestedCb = tb.addClass(key);

    Object.keys(property.properties).forEach((key) =>
      addJsonProperty({
        tb,
        cb: nestedCb,
        property: property.properties![key],
        key,
      })
    );

    cb.addProperty(key, nestedCb.type());
  }

  if (property.type === "array") {
    if (property.items) {
      const nestedCb = tb.addClass(key);
      if (Array.isArray(property.items)) {
        addJsonProperty({
          tb,
          cb: nestedCb,
          property: property.items[0],
          key: `${key}_item`,
        });
      } else {
        addJsonProperty({
          tb,
          cb: nestedCb,
          property: property.items,
          key: `${key}_item`,
        });
      }
      cb.addProperty(key, tb.list(nestedCb.type()));
    } else {
      // Default to string
      cb.addProperty(key, tb.list(tb.string()));
    }
  }
};

export const buildClientRegistry = (provider: {
  url: string;
  key: string;
  model: string;
}) => {
  const clientRegistry = new ClientRegistry();

  if (provider.url.includes("api.openai.com")) {
    clientRegistry.addLlmClient("openai", "openai", {
      api_key: provider.key,
      model: provider.model,
    });
    clientRegistry.setPrimary("openai");
  } else if (provider.url.includes("api.anthropic.com")) {
    clientRegistry.addLlmClient("anthropic", "anthropic", {
      api_key: provider.key,
      model: provider.model,
      headers: {
        "x-api-key": provider.key,
      },
    });
    clientRegistry.setPrimary("anthropic");
  } else {
    clientRegistry.addLlmClient("custom", "openai-generic", {
      base_url: provider.url,
      api_key: provider.key,
      model: provider.model,
    });
    clientRegistry.setPrimary("custom");
  }

  return clientRegistry;
};

export const structured = async ({
  input,
  type,
  schema,
  clientRegistry,
}: {
  input: string;
  type?: string;
  schema: Schema;
  clientRegistry?: ClientRegistry;
}) => {
  const tb = new TypeBuilder();

  if (schema.type === "object" && schema.properties) {
    Object.keys(schema.properties).forEach((key) =>
      addJsonProperty({
        tb,
        cb: tb.Dynamic,
        property: schema.properties![key],
        key,
      })
    );
  } else {
    throw new Error("Schema must be an object");
  }

  try {
    if (type && type.startsWith("image/")) {
      return await b.ExtractImage(Image.fromBase64(type, input), {
        tb,
        clientRegistry,
      });
    }

    return await b.ExtractString(input, { tb, clientRegistry });
  } catch (error) {
    // Special handling for non-parsed Baml errors. i.e OpenRouter 402 errors
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "GenericFailure" &&
      error.message.includes(
        "Failed to parse into a response accepted by baml_runtime"
      )
    ) {
      const result = z
        .object({
          // This may be OpenRouter specific
          error: z.object({
            code: z.union([z.string(), z.number()]),
            message: z.string(),
          }),
        })
        .safeParse(parseJsonSubstring(error.message));

      if (result.success) {
        // Rethrow as a BamlClientHttpError which will forward the error to the client
        throw new BamlClientHttpError(
          "unknown",
          result.data.error.message,
          Number(result.data.error.code)
        );
      } else {
        throw new Error("Failed to parse message from provider");
      }
    }

    throw error;
  }
};

// Attempt to parse a JSON object substring from a string
const parseJsonSubstring = (raw: string): unknown | null => {
  const jsonMatch = raw.match(/{.*}/s); // Match JSON-like content
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};
