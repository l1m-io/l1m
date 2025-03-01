import { inferType } from "./base64";

describe("inferType", () => {
  test("should infer base64 type", async () => {
    const url =
      "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png";

    // Base64 encode
    const buffer = await fetch(url).then((response) => response.arrayBuffer());
    const input = Buffer.from(buffer).toString("base64");

    const type = await inferType(input);
    expect(type).toBe("image/png");
  });
});
