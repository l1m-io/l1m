import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

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
      "x-provider-model": z.string(),
      "x-provider-url": z.string(),
      "x-provider-key": z.string(),
      "x-cache-key": z.string().optional(),
      }),
    responses: {
      200: z.object({
        data: z.record(z.any()),
      }),
    },
  },
});
