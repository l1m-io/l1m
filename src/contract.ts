import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const apiContract = c.router({
  health: {
    method: "GET",
    path: "/health",
    responses: {
      200: z.object({
        status: z.string(),
        timestamp: z.number(),
        uptime: z.number(),
      }),
    },
  },
  structured: {
    method: "POST",
    path: "/structured",
    body: z.object({
      raw: z.string().optional(),
      url: z.string().optional(),
      type: z.enum([
        "text/plain",
        "application/json",
        "image/jpeg",
        "image/png",
      ]).default("text/plain"),
      schema: z.record(z.any()),
    })
    .refine(
      (body) => (body.raw || body.url) && !((body.raw && body.url) || !(body.raw || body.url)),
      "Either raw or url must be provided"
    ),
    headers: z.object({
      "x-provider-model": z.string().optional(),
      "x-provider-url": z.string().optional(),
      "x-provider-key": z.string().optional(),
      "x-cache-key": z.string().optional(),
    })
    // If any "x-provider" header is set, then all "x-provider" headers must be set
    .refine(
      (headers) =>
        (!headers["x-provider-model"] && !headers["x-provider-url"] && !headers["x-provider-key"])
          || (headers["x-provider-model"] && headers["x-provider-url"] && headers["x-provider-key"]),
      "If any x-provider-* header is set, then all x-provider headers must be set"
    ),
    responses: {
      200: z.object({
        data: z.record(z.any()),
      }),
    },
  },
});
