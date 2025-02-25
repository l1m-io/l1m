import assert from "assert";
import L1M from "..";

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

async function testCallStructured() {
  const l1m = new L1M({
    baseUrl: "http://localhost:3000",
  });

  const result = await l1m.structured({
    url: "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png",
    schema: {
      type: "object",
      properties: {
        character: { type: "string" },
      },
    },
  }, {
    provider: {
      model: process.env.TEST_PROVIDER_MODEL!,
      key: process.env.TEST_PROVIDER_KEY!,
      url: process.env.TEST_PROVIDER_URL!,
    }
  })

  console.log("Result", {
    result,
  });

  assert.strictEqual((result as any).data.character, "Shrek");
}

// Main test runner - executes all tests
(async function runAllTests() { console.log("Starting tests...");
  await runTest("structured", testCallStructured);

  console.log("All tests completed");
})().catch(console.error);
