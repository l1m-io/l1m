import Ajv from "ajv";

export const illegalSchemaCheck = (schema: Record<string, any>): string | undefined => {
  const disallowedKeys = ["minLength", "minimum", "maxLength", "maximum", "oneOf", "anyOf", "allOf", "pattern"];

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

export const validateJsonSchema = (schema: object): boolean => {
  const ajv = new Ajv();
  try {
    ajv.compile(schema); // Compiling ensures validity
    return true;
  } catch {
    return false;
  }
};

export const validateJson = (schema: object, data: unknown): boolean => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema); // Compiling avoids re-parsing schema every time
  return validate(data);
};
