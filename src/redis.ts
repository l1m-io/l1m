import Redis from "ioredis";

export const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  family: 6,
}) : null;
