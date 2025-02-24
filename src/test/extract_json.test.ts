import assert from "assert";

(async function testExtractJson() {
  const testData = {
    raw: `{
      "userProfile": {
        "basicInfo": {
          "name": ["John"],
          "title": "Dr.",
          "age": 30,
          "nationality": "Canadian"
        },
        "contactDetails": {
          "email": "john.doe@example.com",
          "phone": {
            "home": "+1-555-0123",
            "mobile": "+1-555-0124"
          }
        }
      }
    }`,
    mimeType: "application/json",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
        phone: { type: "string" },
      },
      required: ["name", "age"],
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
  assert(result.data.name === "John", "Name should be extracted correctly");
  assert(result.data.age === 30, "Age should be extracted correctly");
  assert(
    result.data.email === "john.doe@example.com",
    "Email should be extracted correctly"
  );
  assert(
    result.data.phone === "+1-555-0124",
    "Phone should be extracted correctly"
  );
})().catch(console.error);
