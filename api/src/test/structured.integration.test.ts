import fetchMock from "jest-fetch-mock";

// Configure environment checks
beforeAll(() => {
  // Enable fetch mocking if needed
  fetchMock.enableMocks();
  fetchMock.dontMock();

  // Verify required env variables
  expect(process.env.TEST_PROVIDER_MODEL).toBeDefined();
  expect(process.env.TEST_PROVIDER_URL).toBeDefined();
  expect(process.env.TEST_PROVIDER_KEY).toBeDefined();

  console.log("Testing with provider", {
    url: process.env.TEST_PROVIDER_URL,
    model: process.env.TEST_PROVIDER_MODEL,
  });
});

async function structured(input: {
  input: string;
  instruction?: string;
  schema: object;
  customHeaders?: Record<string, string>;
}) {
  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:10337/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-provider-url": process.env.TEST_PROVIDER_URL!,
        "x-provider-key": process.env.TEST_PROVIDER_KEY!,
        "x-provider-model": process.env.TEST_PROVIDER_MODEL!,
        ...input.customHeaders,
      },
      body: JSON.stringify({
        input: input.input,
        schema: input.schema,
        instruction: input.instruction,
      }),
    }
  );

  const result = await response.json();

  return { response, result };
}

describe("Structured Data Extraction API", () => {
  test("extracts JSON object correctly", async () => {
    const testData = {
      input: `{
        "company": {
          "name": "Tech Innovations Inc.",
          "founded": 2010,
          "location": {
            "city": "San Francisco",
            "state": "CA",
            "country": "USA",
            "address": {
              "street": "123 Innovation Way",
              "zipcode": "94107",
              "suite": "400"
            }
          },
          "departments": [
            {
              "name": "Engineering",
              "employees": 120,
              "teams": ["Frontend", "Backend", "DevOps"]
            },
            {
              "name": "Sales",
              "employees": 85,
              "regions": ["North America", "Europe", "Asia"]
            }
          ]
        }
      }`,
      schema: {
        type: "object",
        properties: {
          companyName: {
            type: "string",
            description: "The name of the company",
          },
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
      },
    };

    const { response, result } = await structured(testData);

    expect(response.ok).toBeTruthy();
    expect(result.data.companyName).toBe("Tech Innovations Inc.");
    expect(result.data.foundedYear).toBe(2010);
    expect(typeof result.data.address).toBe("object");
    expect(result.data.address.street).toBe("123 Innovation Way");
    expect(Array.isArray(result.data.engineeringTeams)).toBeTruthy();
    expect(result.data.engineeringTeams.length).toBe(3);
    expect(response.headers.get("x-attempts")).toBe("1");
  });

  test("handles base64 encoded JSON correctly", async () => {
    const rawInput = `{
        "company": {
          "name": "Tech Innovations Inc.",
          "founded": 2010,
          "location": {
            "city": "San Francisco",
            "state": "CA",
            "country": "USA",
            "address": {
              "street": "123 Innovation Way",
              "zipcode": "94107",
              "suite": "400"
            }
          },
          "departments": [
            {
              "name": "Engineering",
              "employees": 120,
              "teams": ["Frontend", "Backend", "DevOps"]
            },
            {
              "name": "Sales",
              "employees": 85,
              "regions": ["North America", "Europe", "Asia"]
            }
          ]
        }
      }`;

    const input = Buffer.from(rawInput).toString("base64");

    const schema = {
      type: "object",
      properties: {
        companyName: { type: "string" },
        foundedYear: { type: "number" },
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
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
              employees: { type: "number" },
            },
          },
        },
      },
    };

    const { response, result } = await structured({ input, schema });

    expect(response.ok).toBeTruthy();
    expect(result.data.companyName).toBe("Tech Innovations Inc.");
    expect(result.data.foundedYear).toBe(2010);
    expect(typeof result.data.address).toBe("object");
    expect(result.data.address.street).toBe("123 Innovation Way");
    expect(Array.isArray(result.data.engineeringTeams)).toBeTruthy();
    expect(result.data.engineeringTeams.length).toBe(3);
  });

  test("honors schema descriptions", async () => {
    // Intentionally empty
    const input = "";
    const schema = {
      type: "object",
      properties: {
        word: { type: "string", description: "Must be the word 'inference'" },
      },
    };

    const { response, result } = await structured({ input, schema });

    expect(response.ok).toBeTruthy();
    expect(result.data.word).toBe("inference");
  });

  test("processes images correctly", async () => {
    const url =
      "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png";

    // Base64 encode
    const buffer = await fetch(url).then((response) => response.arrayBuffer());
    const input = Buffer.from(buffer).toString("base64");

    const schema = {
      type: "object",
      properties: {
        character: { type: "string" },
      },
    };

    const { response, result } = await structured({ input, schema });

    expect(response.ok).toBeTruthy();
    expect(result.data.character).toBe("Shrek");
  }, 10_000);

  test("rejects invalid input types", async () => {
    const url =
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

    // Base64 encode
    const buffer = await fetch(url).then((response) => response.arrayBuffer());
    const input = Buffer.from(buffer).toString("base64");

    const schema = {
      type: "object",
      properties: {
        character: { type: "string" },
      },
    };

    const { response, result } = await structured({ input, schema });

    expect(response.status).toBe(400);
    expect(result.message).toBe("Provided content has invalid mime type");
  });

  test.each([
    ["groq", "https://api.groq.com/openai/v1", "401 Invalid API Key", 401],
    [
      "openrouter",
      "https://openrouter.ai/api/v1",
      "401 No auth credentials found",
      401,
    ],
    [
      "openai",
      "https://api.openai.com/v1",
      "401 Incorrect API key provided: INVALID. You can find your API key at https://platform.openai.com/account/api-keys.",
      401,
    ],
    [
      "google",
      "https://generativelanguage.googleapis.com/v1beta",
      expect.stringContaining(
        "API key not valid. Please pass a valid API key."
      ),
      400,
    ],
  ])(
    "rejects invalid API key for %s provider",
    async (provider, url, expectedMessage, expectedStatus) => {
      const input = "abc123";
      const schema = {
        type: "object",
        properties: {
          character: { type: "string" },
        },
      };

      const customHeaders = {
        "x-provider-url": url,
        "x-provider-model": "INVALID",
        "x-provider-key": "INVALID",
      };

      const { response, result } = await structured({
        input,
        schema,
        customHeaders,
      });

      expect(response.status).toBe(expectedStatus);
      expect(result.message).toEqual(expectedMessage);
    }
  );

  test("rejects invalid schema", async () => {
    const input = "abc123";
    const schema = {
      type: "INVLAID",
    };

    const { response, result } = await structured({ input, schema });

    expect(response.status).toBe(400);
    expect(result.message).toBe("Provided JSON schema is invalid");
  });

  test("rejects non-compliant schema", async () => {
    const input = "abc123";
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 5,
          maxLength: 10,
        },
      },
    };

    const { response, result } = await structured({ input, schema });

    expect(response.status).toBe(400);
    expect(result.message).toBe(
      "Disallowed property 'minLength' found in schema"
    );
  });

  test("handles enum schema correctly", async () => {
    const input = "Fill in the most appropriate details.";
    const schema = {
      type: "object",
      properties: {
        skyColor: {
          type: "string",
          // Use ligthBlue rather than blue to ensure the model sees the enum
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

    const { response, result } = await structured({ input, schema });

    expect(response.ok).toBeTruthy();
    expect(result.data.skyColor).toBe("lightBlue");
    expect(result.data.grassColor).toBe("green");
  });

  test("processes instruction correctly", async () => {
    const instruction = "The word is haystack";
    const input = "Fill in the most appropriate details.";
    const schema = {
      type: "object",
      properties: {
        word: {
          type: "string",
        },
      },
    };

    const { response, result } = await structured({
      input,
      schema,
      instruction,
    });

    expect(response.ok).toBeTruthy();
    expect(result.data.word).toBe("haystack");
  });

  test("uses cache correctly", async () => {
    const input = `The Sky is blue. The current time is ${Date.now()}.`;
    const schema = {
      type: "object",
      properties: {
        skyColor: {
          type: "string",
        },
      },
    };

    const customHeaders = {
      "x-cache-ttl": "100",
    };

    const { response, result } = await structured({
      input,
      schema,
      customHeaders,
    });

    expect(response.ok).toBeTruthy();
    expect(result.data.skyColor).toBe("blue");
    expect(response.headers.has("x-cache")).toBeTruthy();
    expect(response.headers.get("x-cache")).toBe("MISS");

    const { response: secondResponse, result: secondResult } = await structured(
      { input, schema, customHeaders }
    );

    expect(secondResponse.ok).toBeTruthy();
    expect(secondResult.data.skyColor).toBe("blue");
    expect(secondResponse.headers.has("x-cache")).toBeTruthy();
    expect(secondResponse.headers.get("x-cache")).toBe("HIT");
  });
});
