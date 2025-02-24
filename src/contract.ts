import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const apiContract = c.router({
  extract: {
    method: "POST",
    path: "/extract",
    body: z.object({
      raw: z.string(),
      mimeType: z.enum(["application/json", "text/plain"]),
      schema: z.record(z.any()),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
        data: z.record(z.any()),
      }),
    },
  },
});
