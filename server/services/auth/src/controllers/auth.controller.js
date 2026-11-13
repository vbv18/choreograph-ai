import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import {
  findOneUser,
  createUser,
  findUserAndUpdatePlan,
  updateUserCredits,
  refundUserCredits,
} from "../repositories/user.repositories.js";
import {
  deleteSession,
  getSessionByUserId,
  setSession,
} from "../repositories/session.repositories.js";
import {
  AGENT_COST,
  COOKIE_OPTIONS,
  SESSION_TTL,
} from "../../../lib/constant.js";

export async function login(req, res) {
  try {
    const { token } = req.body;
    console.log(req.user);

    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await findOneUser({
      firebaseUid: decoded.uid,
      email: decoded.email,
    });

    if (!user) {
      user = await createUser({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    } else {
      let updated = false;
      if (!user.firebaseUid && decoded.uid) {
        user.firebaseUid = decoded.uid;
        updated = true;
      }
      if (decoded.picture && user.avatar !== decoded.picture) {
        user.avatar = decoded.picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const sessionId = crypto.randomUUID();

    await setSession(user._id, sessionId, user);

    res.cookie("session", sessionId, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_TTL * 1000,
    });

    return res.status(200).json({
      message: "Logged In Successfuly",
      user,
    });
  } catch (error) {
    console.error("[Login Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function logout(req, res) {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    res.clearCookie("session", COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Logged Out Successfuly",
    });
  } catch (error) {
    console.error("[Logout Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function updateUserPayment(req, res) {
  try {
    const { userId, planId } = req.body;

    const isValidPlan = ["starter", "pro"].includes(planId);

    if (!isValidPlan) {
      return res.status(404).json({
        message: "Invalid plan",
      });
    }

    const user = await findUserAndUpdatePlan(userId, planId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid User",
      });
    }

    const sessionId = await getSessionByUserId(user._id);

    if (!sessionId) {
      return res.status(404).json({
        success: false,
        message: "Invalid Session",
      });
    }

    await setSession(user._id, sessionId, user);

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("[Update-User-Payment Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function deductCredits(req, res) {
  try {
    const { userId, agent, HumanMessage, AIMessage } = req.body;

    if (!userId || !agent) {
      return res.status(400).json({
        success: false,
        message: "userId and agent are required",
      });
    }

    let user = await findOneUser({
      userId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid User",
      });
    }

    const requiredCredits = AGENT_COST[agent] || 1;

    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: "Not enough credits",
      });
    }

    // Atomically deduct credits and get updated user
    user = await updateUserCredits(userId, requiredCredits);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Not enough credits",
      });
    }

    // Redis session is optional; MongoDB is the source of truth.
    try {
      const sessionId = await getSessionByUserId(user._id);

      if (sessionId) {
        await setSession(user._id, sessionId, user);
      }
    } catch (redisError) {
      console.error("[Redis Session Update Error]", redisError);
    }

    return res.status(200).json({
      success: true,
      message: `${requiredCredits} credits deducted successfully for using '${agent}' agent`,
      credits: user.credits,
    });
  } catch (error) {
    console.error("[Deduct-Credits Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function refundCredits(req, res) {
  try {
    const { userId, credits, HumanMessage, AIMessage } = req.body;

    if (!userId || !Number.isInteger(credits) || credits <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund request",
      });
    }

    const user = await refundUserCredits(userId, credits);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid User",
      });
    }

    return res.status(200).json({
      success: true,
      credits: user.credits,
    });
  } catch (error) {
    console.error("[Refund Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Refund failed",
    });
  }
}
