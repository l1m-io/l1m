import Ajv from "ajv";

const ajv = new Ajv();

export const illegalSchemaCheck = (schema: Record<string, any>): string | undefined => {
  const disallowedKeys = ["minLength", "minimum", "maxLength", "maximum", "oneOf", "anyOf", "allOf", "pattern", "enum"];

  for (const key in schema) {
    if (disallowedKeys.includes(key)) {
      return `Disallowed property '${key}' found in schema`;
    }

    if (key === "properties" && typeof schema[key] === "object") {
      for (const prop of Object.values(schema[key])) {
        const error = illegalSchemaCheck(prop as Record<string, any>)
        if (error) return error;
      }
    }

    if (key === "items" && typeof schema[key] === "object") {
      const error = illegalSchemaCheck(schema[key])
      if (error) return error;
    }
  }
};

export const validateJsonSchema = (schema: object) => {
  try {
    ajv.compile(schema);
    return true
  } catch  {
    return false
  }
}

export const validateJson = (schema: object, data: unknown) => {
  try {
    ajv.validate(schema, data);
    return true
  } catch  {
    return false
  }
}
