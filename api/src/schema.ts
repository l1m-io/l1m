import Ajv from "ajv";

const ajv = new Ajv();

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
