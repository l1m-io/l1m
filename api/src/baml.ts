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
      if (Array.isArray(property.items)) {
        // For array of items, use the first item's schema
        const item = property.items[0];

        if (item.type === "object" && item.properties) {
          const nestedCb = tb.addClass(key + "Item");
          Object.keys(item.properties).forEach((propKey) =>
            addJsonProperty({
              tb,
              cb: nestedCb,
              property: item.properties![propKey],
              key: propKey,
            })
          );
          cb.addProperty(key, tb.list(nestedCb.type()));
        } else {
          // For primitive types in array
          cb.addProperty(key, tb.list(getTypeForSchema(tb, item)));
        }
      } else {
        const items = property.items;

        // For single item schema
        if (items.type === "object" && items.properties) {
          const nestedCb = tb.addClass(key + "Item");
          Object.keys(items.properties).forEach((propKey) =>
            addJsonProperty({
              tb,
              cb: nestedCb,
              property: items.properties![propKey],
              key: propKey,
            })
          );
          cb.addProperty(key, tb.list(nestedCb.type()));
        } else {
          // For primitive types in array
          cb.addProperty(key, tb.list(getTypeForSchema(tb, items)));
        }
      }
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

// Recursively collect descriptions from properties within a schema in the format
// <JSON path>: <description>
const collectDescriptions = (
  schema: Schema,
  path: string = "",
  descriptions: string = ""
) => {
  if (!schema) {
    return descriptions;
  }

  if (schema.description) {
    descriptions += `${path}: ${schema.description}\n`;
  }

  if (schema.properties) {
    Object.keys(schema.properties).forEach((key) => {
      const prop = schema.properties?.[key];

      if (prop) {
        descriptions = collectDescriptions(
          prop,
          `${path}.${key}`,
          descriptions
        );
      }
    });
  }

  if (schema.type === "array" && schema.items) {
    let item = schema.items;

    if (Array.isArray(schema.items)) {
      item = schema.items[0];
    }

    if (item) {
      descriptions = collectDescriptions(
        schema.items as Schema,
        `${path}[]`,
        descriptions
      );
    }
  }

  return descriptions;
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

  let additional = collectDescriptions(schema);

  if (schema.properties) {
    Object.keys(schema.properties).forEach((key) =>
      addJsonProperty({
        tb,
        cb: tb.Dynamic,
        property: schema.properties![key],
        key,
      })
    );
  } else {
    throw new Error(
      "Schema must be an object. Try wrapping your schema in an object."
    );
  }

  try {
    if (type && type.startsWith("image/")) {
      return await b.ExtractImage(Image.fromBase64(type, input), additional, {
        tb,
        clientRegistry,
      });
    }

    return await b.ExtractString(input, additional, { tb, clientRegistry });
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
export const parseJsonSubstring = (raw: string): unknown | undefined => {
  const jsonMatch = raw.match(/{.*}/s); // Match JSON-like content
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {}
};
