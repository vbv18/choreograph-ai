import redis from "../../../../shared/redis/redis.js";
import { SESSION_TTL } from "../../../lib/constant.js";

export async function setSession(userId, sessionId, user) {
  await Promise.all([
    redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        planId: user.planId,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt,
      }),
      "EX",
      SESSION_TTL,
    ),
    redis.set(
      `user-session-${userId}`,
      JSON.stringify({
        sessionId: sessionId,
      }),
    ),
  ]);
}

export async function deleteSession(sessionId) {
  await redis.del(`session-${sessionId}`);
}

export async function getSessionByUserId(userId) {
  const rawSessionData = await redis.get(`user-session-${userId}`);

  if (!rawSessionData) return null;

  const sessionData = JSON.parse(rawSessionData);

  return sessionData?.sessionId || null;
}
