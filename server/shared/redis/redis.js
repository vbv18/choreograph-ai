import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

if (!redisUrl) {
  throw new Error("REDIS_URL is not configured");
}

const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log("redis connected");
});

redis.on("error", (error) => {
  console.error("[Redis Error]", error.message);
});

export default redis;
