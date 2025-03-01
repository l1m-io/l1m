import { structured } from "./model";
import { validateJsonSchema } from "./schema";

const validTypes = [
  "text/plain",
  "application/json",
  "image/jpeg",
  "image/png",
];

export { structured, validateJsonSchema, validTypes };
