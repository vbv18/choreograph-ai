import { getAuth } from "firebase-admin/auth";

import { app } from "../config/firebase.js";
import {
  findOneUser,
  createUser,
  findOneAndUpdateUser,
} from "../repositories/user.repositories.js";
import {
  deleteSession,
  getSessionByUserId,
  setSession,
} from "../repositories/session.repositories.js";
import { SESSION_TTL, COOKIE_OPTIONS } from "../../../lib/constant.js";

export async function login(req, res) {
  try {
    const { token } = req.body;

    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await findOneUser(decoded.uid, decoded.email);

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
    console.error("[Login Error]", error);

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
    console.error("[Logout Error]", error);

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

    const user = await findOneAndUpdateUser(userId, planId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const rawSessionData = await getSessionByUserId(user._id);
    const sessionData = rawSessionData ? JSON.parse(rawSessionData) : null;
    const sessionId = sessionData?.sessionId;

    await setSession(user._id, sessionId, user);

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("[Update-User-Payment Error]", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
