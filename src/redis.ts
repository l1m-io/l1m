import { Redis } from "@upstash/redis";
import assert from "assert";

assert(process.env.UPSTASH_REDIS_URL, "UPSTASH_REDIS_URL is required");
assert(process.env.UPSTASH_REDIS_TOKEN, "UPSTASH_REDIS_TOKEN is required");

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
