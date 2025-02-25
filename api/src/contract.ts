import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const hasDefaultProvider = !!process.env.DEFAULT_BEDROCK_MODEL;

export const apiContract = c.router({
  home: {
    method: "GET",
    path: "/",
    responses: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
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
    body: z
      .object({
        raw: z.string().optional(),
        url: z.string().optional(),
        schema: z.record(z.any()),
      })
      .refine(
        (body) =>
          (body.raw || body.url) &&
          !((body.raw && body.url) || !(body.raw || body.url)),
        "Either raw or url must be provided"
      ),
    headers: z
      .object({
        ...(hasDefaultProvider
          ? {
              "x-provider-model": z.string().optional(),
              "x-provider-url": z.string().optional(),
              "x-provider-key": z.string().optional(),
            }
          : {
              "x-provider-model": z.string(),
              "x-provider-url": z.string(),
              "x-provider-key": z.string(),
            }),
        "x-cache-key": z.string().optional(),
      })
      // If any "x-provider" header is set, then all "x-provider" headers must be set
      .refine(
        (headers) =>
          (!headers["x-provider-model"] &&
            !headers["x-provider-url"] &&
            !headers["x-provider-key"]) ||
          (headers["x-provider-model"] &&
            headers["x-provider-url"] &&
            headers["x-provider-key"]),
        "If any x-provider-* header is set, then all x-provider headers must be set"
      ),
    responses: {
      200: z.object({
        data: z.record(z.any()),
      }),
    },
  },
});
