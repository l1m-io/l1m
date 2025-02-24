import assert from "assert";

(async function testExtractText() {
  const testData = {
    raw: `John Smith is 30 years old and works as a software engineer at Tech Corp.
He can be reached at john.smith@example.com or (555) 123-4567.
He started his role on January 15, 2023 and has 8 years of experience in Python and JavaScript.`,
    mimeType: "text/plain",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
        occupation: { type: "string" },
      },
      required: ["name", "age", "occupation"],
    },
  };

  const response = await fetch(
    process.env.TEST_SERVER ?? "http://localhost:3000/extract",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    }
  );

  assert(response.ok, "Response should be successful");

  const result = await response.json();

  assert(result.success === true, "Response should indicate success");
  assert(
    result.data.name === "John Smith",
    "Name should be extracted correctly"
  );
  assert(result.data.age === 30, "Age should be extracted correctly");
  assert(
    result.data.email === "john.smith@example.com",
    "Email should be extracted correctly"
  );
  assert(
    result.data.occupation === "software engineer",
    "Occupation should be extracted correctly"
  );
})().catch(console.error);
