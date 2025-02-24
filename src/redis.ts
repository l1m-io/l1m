import Redis from "ioredis";
import assert from "assert";

assert(process.env.REDIS_URL, "REDIS_URL is required");

export const redis = new Redis(process.env.REDIS_URL, {
  family: 6,
});
