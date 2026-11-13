import { getSession } from "../repositories/session.repositories.js";

export default async function authMiddleware(req, res, next) {
  try {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
      return res.status(401).json({
        message: "Authentication required: Session not found",
      });
    }

    const session = await getSession(sessionId);

    if (!session) {
      return res.status(401).json({
        message: "Authentication expired: Please log in again",
      });
    }

    req.user = typeof session === "string" ? JSON.parse(session) : session;

    return next();
  } catch (error) {
    console.error("[Auth-Middleware Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
