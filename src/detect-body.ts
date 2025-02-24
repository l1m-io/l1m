export function detectBody(body: unknown): "json" | "text" {
  let type = "text" as "json" | "text";

  if (typeof body === "string") {
    try {
      JSON.parse(body);
      type = "json";
    } catch (error) {
      type = "text";
    }
  }

  return type;
}
