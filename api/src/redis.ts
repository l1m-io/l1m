import crypto from "crypto";

import Redis from "ioredis";

export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      family: 6,
    })
  : null;

export const generateCacheKey = (input: string[]) => {
  const hash = crypto.createHash("sha256");
  input.forEach((text) => hash.update(text));
  return hash.digest("hex");
};
