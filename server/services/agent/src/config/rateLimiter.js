import redis from "../../../../shared/redis/redis.js";
import { AGENT_LIMIT } from "../../../lib/constant.js";

export default async function rateLimiter(userId, agent) {
  const maxLimit = AGENT_LIMIT[agent] || AGENT_LIMIT["chat"];

  const redisKey = `rate:${userId}:${agent}`;
  const limitCount = await redis.incr(redisKey);

  if (limitCount == 1) {
    await redis.expire(redisKey, 60);
  }

  const ttl = await redis.ttl(redisKey);

  if (limitCount > maxLimit) {
    const minutes = Math.floor(ttl / 60);
    const seconds = ttl % 60;

    const time = minutes > 0 ? `${minutes}m : ${seconds}s` : `${seconds}s`;

    const error = new Error(`Rate limit exceeded for ${agent} agent.`);
    error.status = 429;
    error.data = {
      success: false,
      agent,
      limit: maxLimit,
      remainigTime: ttl,
      retryAfter: time,
      message: `You have reached the ${agent} limit (${maxLimit} requests/minute). Try again in ${time}.`,
    };

    throw error;
  }

  return {
    remaining: maxLimit - limitCount,
    limit: maxLimit,
  };
}
