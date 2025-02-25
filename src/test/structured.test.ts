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

// When these vars are set, we will test with a custom model provider
const testCustomProvider = process.env.TEST_PROVIDER_MODEL && process.env.TEST_PROVIDER_URL && process.env.TEST_PROVIDER_KEY;

async function testJsonObject() {
  const testData = {
    raw: `{
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
        ...(testCustomProvider ? {
          "x-provider-url": process.env.TEST_PROVIDER_URL,
          "x-provider-key": process.env.TEST_PROVIDER_KEY,
          "x-provider-model": process.env.TEST_PROVIDER_MODEL } : {})
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  console.log(result);

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

async function testImageRaw() {
  const url = "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png";
  const image = await fetch(url);
  const buffer = await image.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const testData = {
    raw: base64,
    type: "image/png",
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
        ...(testCustomProvider ? {
          "x-provider-url": process.env.TEST_PROVIDER_URL,
          "x-provider-key": process.env.TEST_PROVIDER_KEY,
          "x-provider-model": process.env.TEST_PROVIDER_MODEL } : {})
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  assert(response.ok, "Response should be successful");

  assert(
    result.data.character === "Shrek",
    "Character should be extracted correctly"
  );
}

async function testImageUrl() {
  const url = "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png";

  const testData = {
    url,
    type: "image/png",
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
        ...(testCustomProvider ? {
          "x-provider-url": process.env.TEST_PROVIDER_URL,
          "x-provider-key": process.env.TEST_PROVIDER_KEY,
          "x-provider-model": process.env.TEST_PROVIDER_MODEL } : {})
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  assert(response.ok, "Response should be successful");

  assert(
    result.data.character === "Shrek",
    "Character should be extracted correctly"
  );
}

async function testInvalidInputUrl() {
  const testData = {
    url: "INVALID",
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
        ...(testCustomProvider ? {
          "x-provider-url": process.env.TEST_PROVIDER_URL,
          "x-provider-key": process.env.TEST_PROVIDER_KEY,
          "x-provider-model": process.env.TEST_PROVIDER_MODEL } : {})
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  assert(response.status === 400);
  assert(result.message === "Failed to fetch url contents");
}

async function testInvalidInputUrlType() {
  const testData = {
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    schema: {
      type: "object",
    },
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        ...(testCustomProvider ? {
          "x-provider-url": process.env.TEST_PROVIDER_URL,
          "x-provider-key": process.env.TEST_PROVIDER_KEY,
          "x-provider-model": process.env.TEST_PROVIDER_MODEL } : {})
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();
  assert(response.status === 400);
  assert(result.message === "Invalid mime type");
}

async function testInvalidApiKey() {
  const testData = {
    raw: "abc123",
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
        "x-provider-url": "https://api.groq.com/openai/v1",
        "x-provider-model": "INVALID",
        "x-provider-key": "INVALID"
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();

  assert(response.status === 401, "Status code should be forwarded from provider");
  assert(result.message === "Failed to call provider");
  assert(result.providerResponse.error.message === "Invalid API Key", "Error message should be forwarded from provider");
}


async function testPartialProviderDetails() {
  const testData = {
    raw: "abc123",
    schema: {},
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/structured",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cache-key": Math.random().toString(),
        "x-provider-model": "llama-3.2-11b-vision-preview",
      },
      body: JSON.stringify(testData),
    }
  );

  const result = await response.json();

  assert(response.status === 400);
  assert(result.headerErrors.issues[0].message === "If any x-provider-* header is set, then all x-provider headers must be set");
}

// Main test runner - executes all tests
(async function runAllTests() { console.log("Starting tests...");
  if (testCustomProvider) {
    console.log("Testing custom provider", {
      url: process.env.TEST_PROVIDER_URL,
      model: process.env.TEST_PROVIDER_MODEL
    });
  }

  await runTest("General", testJsonObject);
  await runTest("Image: Raw", testImageRaw);
  await runTest("Image: URL", testImageUrl);

  await runTest("Input URL: Invalid URL", testInvalidInputUrl);
  await runTest("Input URL: Invalid type", testInvalidInputUrlType);

  await runTest("Provider: Invalid API Key", testInvalidApiKey);
  await runTest("Provider: Partial details", testPartialProviderDetails);

  console.log("All tests completed");
})().catch(console.error);
