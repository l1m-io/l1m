import assert from "assert";

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    console.log(`Running test: ${name}`);
    await fn();
    console.log(`✅ ${name} passed`);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    process.exitCode = 1;
  }
}

assert(process.env.TEST_PROVIDER_MODEL, "TEST_PROVIDER_MODEL must be set");
assert(process.env.TEST_PROVIDER_URL, "TEST_PROVIDER_URL must be set");
assert(process.env.TEST_PROVIDER_KEY, "TEST_PROVIDER_KEY must be set");

async function testJsonObject() {
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
          }
        },
        engineeringTeams: { type: "array" },
        departments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              employees: { type: "number" },
            }
          },
        },
      },
      required: ["companyName", "headquarters", "engineeringTeams"],
    },
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        "x-provider-url": process.env.TEST_PROVIDER_URL!,
        "x-provider-key": process.env.TEST_PROVIDER_KEY!,
        "x-provider-model": process.env.TEST_PROVIDER_MODEL!
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  console.log("Result", {
    result,
    status: response.status
  });

  assert(response.ok, "Response should be successful");

  assert(
    result.data.companyName === "Tech Innovations Inc.",
    "Company name should be extracted correctly"
  );
  assert(
    result.data.foundedYear === 2010,
    "Founded year should be extracted correctly"
  );
  assert(
    typeof result.data.address === "object",
    "Address should be extracted as an object"
  )
  assert(
    result.data.address.street === "123 Innovation Way",
  );
  assert(
    Array.isArray(result.data.engineeringTeams) &&
    result.data.engineeringTeams.length === 3,
    "Engineering teams should be extracted as an array of length 3"
  );
}

async function testBase64JsonObject() {
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

  const testData = {
    input,
    schema: {
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
          }
        },
        engineeringTeams: { type: "array" },
        departments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              employees: { type: "number" },
            }
          },
        },
      },
      required: ["companyName", "headquarters", "engineeringTeams"],
    },
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        "x-provider-url": process.env.TEST_PROVIDER_URL!,
        "x-provider-key": process.env.TEST_PROVIDER_KEY!,
        "x-provider-model": process.env.TEST_PROVIDER_MODEL!
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  console.log("Result", {
    result,
    status: response.status
  });

  assert(response.ok, "Response should be successful");

  assert(
    result.data.companyName === "Tech Innovations Inc.",
    "Company name should be extracted correctly"
  );
  assert(
    result.data.foundedYear === 2010,
    "Founded year should be extracted correctly"
  );
  assert(
    typeof result.data.address === "object",
    "Address should be extracted as an object"
  )
  assert(
    result.data.address.street === "123 Innovation Way",
  );
  assert(
    Array.isArray(result.data.engineeringTeams) &&
    result.data.engineeringTeams.length === 3,
    "Engineering teams should be extracted as an array of length 3"
  );
}

async function testImage() {
  const url = "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png";

  // Base64 encode
  const buffer =  await fetch(url).then((response) => response.arrayBuffer());
  const input = Buffer.from(buffer).toString("base64");

  const testData = {
    input,
    schema: {
      type: "object",
      properties: {
        character: { type: "string" },
      },
    },
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        "x-provider-url": process.env.TEST_PROVIDER_URL!,
        "x-provider-key": process.env.TEST_PROVIDER_KEY!,
        "x-provider-model": process.env.TEST_PROVIDER_MODEL!
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  console.log("Result", {
    result,
    status: response.status
  });

  assert(response.ok, "Response should be successful");

  assert(
    result.data.character === "Shrek",
    "Character should be extracted correctly"
  );
}

async function testInvalidInputType() {
  const url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // Base64 encode
  const buffer =  await fetch(url).then((response) => response.arrayBuffer());
  const input = Buffer.from(buffer).toString("base64");

  const testData = {
    input,
    schema: {
      type: "object",
      properties: {
        character: { type: "string" },
      },
    },
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        "x-provider-url": process.env.TEST_PROVIDER_URL!,
        "x-provider-key": process.env.TEST_PROVIDER_KEY!,
        "x-provider-model": process.env.TEST_PROVIDER_MODEL!
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  console.log("Result", {
    result,
    status: response.status
  });

  assert(response.status === 400);
  assert(result.message === "Provided content has invalid mime type");
}

async function testInvalidApiKey(provider: "openrouter" | "groq") {
  const testData = {
    input: "abc123",
    schema: {
      type: "object",
      properties: {
        character: { type: "string" },
      },
    },
  };

  const providerMap = {
    openrouter: "https://openrouter.ai/api/v1",
    groq: "https://api.groq.com/openai/v1",
  };

  const providerMessageMap = {
    openrouter: "No auth credentials found",
    groq: "Invalid API Key"
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        "x-provider-url": providerMap[provider],
        "x-provider-model": "INVALID",
        "x-provider-key": "INVALID"
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  console.log("Result", {
    result: JSON.stringify(result),
    status: response.status
  });

  assert(response.status === 401, "Status code should be forwarded from provider");
  assert(result.message === "Failed to call provider");
  assert(result.providerResponse.error.message === providerMessageMap[provider], "Error message should be forwarded from provider");
}

// Main test runner - executes all tests
(async function runAllTests() { console.log("Starting tests...");
  console.log("Testing with provider", {
    url: process.env.TEST_PROVIDER_URL,
    model: process.env.TEST_PROVIDER_MODEL
  });

  //await runTest("General", testJsonObject);
  await runTest("General (base64)", testBase64JsonObject);

  // await runTest("Image", testImage);
  // await runTest("Invalid type", testInvalidInputType);
  //
  // await runTest("Provider: Invalid groq API Key", () => testInvalidApiKey("groq"));
  // await runTest("Provider: Invalid openRouter API Key", () => testInvalidApiKey("openrouter"));

  console.log("All tests completed");
})().catch(console.error);
