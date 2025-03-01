import { parseJsonSubstring } from "./model";

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
