import assert from "assert";
import L1M from "..";
import { z } from "zod";

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

async function testCallStructuredZod() {
  const l1m = new L1M({
    baseUrl: "http://localhost:3000",
    provider: {
      model: process.env.TEST_PROVIDER_MODEL!,
      key: process.env.TEST_PROVIDER_KEY!,
      url: process.env.TEST_PROVIDER_URL!,
    }
  });

  const url = "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png";
  const buffer =  await fetch(url).then((response) => response.arrayBuffer());
  const input = Buffer.from(buffer).toString("base64");

  const result = await l1m.structured({
    input,
    schema: z.object({
      character: z.string(),
    })
  })

  console.log("Result", {
    result,
  });

  assert.strictEqual((result as any).data.character, "Shrek");
}

// Main test runner - executes all tests
(async function runAllTests() { console.log("Starting tests...");
  await runTest("structured (zod)", testCallStructuredZod);

  console.log("All tests completed");
})().catch(console.error);
