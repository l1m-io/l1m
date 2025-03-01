import { minimalSchema } from "./schema";

describe("schema", () => {
  test("should convert simple enum schema correctly", () => {
    // Example 1: Simple schema with enums
    const schema1 = {
      type: "object",
      properties: {
        skyColor: {
          type: "string",
          enum: ["lightBlue", "gray", "black"],
          description: "The color of the sky",
        },
        grassColor: {
          type: "string",
          enum: ["green", "brown", "yellow"],
          description: "The color of grass",
        },
      },
    };

    const expected1 =
      "{ skyColor: 'lightBlue' | 'gray' | 'black', grassColor: 'green' | 'brown' | 'yellow' }";
    expect(minimalSchema(schema1)).toBe(expected1);
  });

  test("should convert complex nested schema correctly", () => {
    const schema2 = {
      type: "object",
      properties: {
        companyName: { type: "string", description: "The name of the company" },
        foundedYear: {
          type: "number",
          description: "The year the company was founded",
        },
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: {
              type: "string",
              description: "The city the company is located in",
            },
            state: { type: "string" },
            country: { type: "string" },
            zipcode: { type: "string" },
            suite: { type: "string" },
          },
        },
        engineeringTeams: { type: "array" },
        departments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              employees: {
                type: "number",
                description: "The number of employees in the department",
              },
            },
          },
        },
      },
    };

    const expected2 =
      "{ companyName: string, foundedYear: float, address: { street: string, city: string, state: string, country: string, zipcode: string, suite: string }, engineeringTeams: string[], departments: [ { name: string, employees: float } ] }";
    expect(minimalSchema(schema2)).toBe(expected2);
  });

  test.only("should handle referenced schema types", () => {
    const schema = {
      "$id": "https://example.com/schemas/customer",
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "first_name": { "type": "string" },
        "last_name": { "type": "string" },
        "shipping_address": { "$ref": "#/$defs/address" },
      },
      "$defs": {
        "address": {
          "$id": "https://example.com/schemas/address",
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "street_address": { "type": "string" },
            "city": { "type": "string" },
            "state": { "$ref": "#/$defs/state" }
          },
        },
        "state": { "enum": ["CA", "NY"] }
      }
    };

    const expected =
      "{ first_name: string, last_name: string, shipping_address: { street_address: string, city: string, state: 'CA' | 'NY' } }";
    expect(minimalSchema(schema)).toBe(expected);

  });

  test("should handle mixed numeric and string enums", () => {
    const schema = {
      type: "object",
      properties: {
        status: {
          type: "number",
          enum: [0, 1, 2],
          description: "Status code",
        },
        mode: {
          type: "string",
          enum: ["auto", "manual"],
        },
      },
    };

    const expected = "{ status: 0 | 1 | 2, mode: 'auto' | 'manual' }";
    expect(minimalSchema(schema)).toBe(expected);
  });

  test("should handle array with primitive items", () => {
    const schema = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    };

    const expected = "{ tags: string[] }";
    expect(minimalSchema(schema)).toBe(expected);
  });

  test("should handle empty objects", () => {
    const schema = {
      type: "object",
      properties: {
        metadata: {
          type: "object",
        },
      },
    };

    const expected = "{ metadata: {} }";
    expect(minimalSchema(schema)).toBe(expected);
  });

  test("should handle boolean types", () => {
    const schema = {
      type: "object",
      properties: {
        isActive: {
          type: "boolean",
          description: "Whether the account is active",
        },
      },
    };

    const expected = "{ isActive: boolean }";
    expect(minimalSchema(schema)).toBe(expected);
  });
});
