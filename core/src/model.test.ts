import { parseJsonSubstring, structured } from "./model";
import { Schema } from "jsonschema";

describe("structured", () => {
  test("Retries on error", async () => {
    // Mock provider that fails first time, succeeds second time
    let attempts = 0;
    const mockProvider = async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error("Simulated failure");
      }
      return '{"result": "success"}';
    };

    const schema: Schema = {
      type: "object",
      properties: {
        result: { type: "string" }
      }
    };

    const result = await structured({
      input: "test input",
      schema,
      provider: mockProvider,
      maxAttempts: 2
    });

    expect(attempts).toBe(2);
    expect(result.structured).toEqual({ result: "success" });
    expect(result.attempts).toBe(2);
  });
});

describe("parseJsonSubstring", () => {
  test("Extracts JSON from a code block", () => {
    const input = 'Here is JSON:\n```json\n{\n"character": "Shrek"\n}\n```';
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Shrek",
    });
  });

  test("Extracts JSON from plain text", () => {
    const input = '\n{\n"character": "Shrek"\n}\n';
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Shrek",
    });
  });

  test("Chooses last JSON object when multiple exist", () => {
    const input = `
    {
      "character": "Shrek"
    }

    {
      "character": "Donkey"
    }`;
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Donkey",
    });
  });

  test("Extracts JSON from last valid code block", () => {
    const input = `
    Here is the first JSON:
    \`\`\`json
    { "character": "Shrek" }
    \`\`\`

    And here is the second one:
    \`\`\`json
    { "character": "Donkey" }
    \`\`\``;
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Donkey",
    });
  });

  test("Handles JSON with nested objects", () => {
    const input = `
    \`\`\`json
    {
      "character": "Shrek",
      "details": {
        "age": 30,
        "species": "ogre"
      }
    }
    \`\`\``;
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Shrek",
      details: {
        age: 30,
        species: "ogre",
      },
    });
  });

  test("Handles text before and after JSON", () => {
    const input =
      'Some text before\n{\n"character": "Shrek"\n}\nSome text after';
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Shrek",
    });
  });

  test("Handles JSON with spaces and newlines", () => {
    const input = '  \n  {  \n  "character"  :  "Shrek"  \n  }  \n  ';
    expect(parseJsonSubstring(input).structured).toEqual({
      character: "Shrek",
    });
  });

  test("Ignores invalid/malformed JSON", () => {
    const input = "Here is a malformed JSON: ```json { character: Shrek } ```";
    expect(parseJsonSubstring(input).structured).toBeNull();
  });

  test("Returns null when no JSON is found", () => {
    const input = "This is just some text with no JSON.";
    expect(parseJsonSubstring(input).structured).toBeNull();
  });

  test("Returns null for empty input", () => {
    const input = "";
    expect(parseJsonSubstring(input).structured).toBeNull();
  });
});
