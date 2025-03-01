import Ajv from "ajv";

import { Schema } from "jsonschema";
import { dereferenceSync } from "dereference-json-schema";

const ajv = new Ajv();

// Build a minimal representation of the JSON schema for use in prompt
export const minimalSchema = (schema: Schema): string => {
  if (!schema) return "";

  schema = dereferenceSync(schema);

  if (schema.enum && Array.isArray(schema.enum)) {
    return schema.enum
      .map((value) => (typeof value === "string" ? `'${value}'` : value))
      .join(" | ");
  }

  switch (schema.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "float";
    case "boolean":
      return "boolean";
    case "array":
      if (schema.items) {
        const item = Array.isArray(schema.items)
          ? schema.items[0]
          : schema.items;
        const itemsType = minimalSchema(item);

        if (item.type === "object" && item.properties) {
          return `[ ${itemsType} ]`;
        }

        return `${itemsType}[]`;
      }
      return "string[]";
    case "object":
      if (!schema.properties) return "{}";

      const properties = Object.entries(schema.properties)
        .map(([key, propSchema]) => {
          const propValue = minimalSchema(propSchema);
          return `${key}: ${propValue}`;
        })
        .join(", ");

      return `{ ${properties} }`;
    default:
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Unsupported schema type: ${schema.type}`);
      }
      return "any";
  }
};

// Recursively collect descriptions from properties within a schema in the format
// <JSON path>: <description>
export const collectDescriptions = (
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

export const validateResult = (schema: object, data: unknown) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  return {
    valid,
    errors: validate.errors,
  };
};

export const validateJsonSchema = (schema: object) => {
  try {
    ajv.compile(schema);
    return illegalSchemaCheck(schema);
  } catch {
    return "Provided JSON schema is invalid";
  }
};

// Check that the schema matches our minimal implementation
const illegalSchemaCheck = (
  schema: Record<string, any>
): string | undefined => {
  const disallowedKeys = [
    "minLength",
    "minimum",
    "maxLength",
    "maximum",
    "oneOf",
    "anyOf",
    "allOf",
    "pattern",
  ];

  for (const key in schema) {
    if (disallowedKeys.includes(key)) {
      return `Disallowed property '${key}' found in schema`;
    }

    if (key === "properties" && typeof schema[key] === "object") {
      for (const prop of Object.values(schema[key])) {
        const error = illegalSchemaCheck(prop as Record<string, any>);
        if (error) return error;
      }
    }

    if (key === "items" && typeof schema[key] === "object") {
      const error = illegalSchemaCheck(schema[key]);
      if (error) return error;
    }
  }
};
