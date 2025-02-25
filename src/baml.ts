import { b } from "./baml_client"
import { Schema } from "jsonschema";
import TypeBuilder from "./baml_client/type_builder";
import { ClassBuilder } from "@boundaryml/baml/type_builder";
import { ClientRegistry, Image, Audio } from "@boundaryml/baml";

const addJsonProperty = ({
  tb,
  cb,
  property,
  key
}:
  {
    tb: TypeBuilder,
    cb: ClassBuilder<string>,
    property: Schema,
    key: string
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

    Object.keys(property.properties).forEach(key => addJsonProperty({
      tb,
      cb: nestedCb,
      property: property.properties![key],
      key
    }));

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
          key: `${key}_item`
        });
      } else {
        addJsonProperty({
          tb,
          cb: nestedCb,
          property: property.items,
          key: `${key}_item`
        });
      }
      cb.addProperty(key, tb.list(nestedCb.type()));
    } else {
      // Default to string
      cb.addProperty(key, tb.list(tb.string()));
    }
  }
}

export const buildClientRegistry = (provider: {
  url?: string,
  key?: string
  model?: string
}) => {
  const clientRegistry = new ClientRegistry();

  if (provider.url && provider.key && provider.model) {
    clientRegistry.addLlmClient("custom", "openai-generic", {
      base_url: provider.url,
      api_key: provider.key,
      model: provider.model,
    });
    clientRegistry.setPrimary("custom");
  } else {
    clientRegistry.addLlmClient("bedrock", "aws-bedrock", {
      model: process.env.DEFAULT_BEDROCK_MODEL
    });
    clientRegistry.setPrimary("bedrock");
  }

  return clientRegistry;
}

export const structured = async ({
  raw,
  type,
  schema,
  clientRegistry
}:{
  raw: string,
  type: string,
  schema: Schema,
  clientRegistry?: ClientRegistry
}) => {
  const tb = new TypeBuilder();

  if (schema.type === "object" && schema.properties) {
    Object.keys(schema.properties).forEach(key => addJsonProperty({
      tb,
      cb: tb.Dynamic,
      property: schema.properties![key],
      key
    }));
  } else {
    throw new Error("Schema must be an object");
  }

  if (type && type.startsWith("image/")) {
    return await b.ExtractImage(Image.fromBase64(type, raw), {tb, clientRegistry});
  }

  return await b.ExtractString(raw, {tb, clientRegistry});
}
