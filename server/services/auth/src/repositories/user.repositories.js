import { PLANS } from "../../../lib/constant.js";
import UserModel from "../models/user.model.js";

export async function findOneUser({
  userId = "",
  firebaseUid = "",
  email = "",
}) {
  const query = {};

  if (userId) query._id = userId;
  if (firebaseUid) query.firebaseUid = firebaseUid;
  if (email) query.email = email;

  if (Object.keys(query).length === 0) {
    return null;
  }

  return await UserModel.findOne(query);
}

export async function createUser({ firebaseUid, name, email, avatar }) {
  const user = await UserModel.create({
    firebaseUid,
    name,
    email,
    avatar,
  });

  return user;
}

export async function findUserAndUpdatePlan(userId, planId) {
  const plan = PLANS[planId];

  if (!plan) {
    throw new Error("Invalid plan");
  }

  return await UserModel.findOneAndUpdate(
    {
      _id: userId,
    },
    {
      $set: {
        planId,
        planExpiresAt: new Date(
          Date.now() + (plan.validity ?? 30) * 24 * 60 * 60 * 1000,
        ),
      },
      $inc: {
        credits: plan.credits,
        totalCredits: plan.credits,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
}

export async function updateUserCredits(userId, requiredCredits) {
  return await UserModel.findOneAndUpdate(
    {
      _id: userId,
      credits: { $gte: requiredCredits },
    },
    {
      $inc: {
        credits: -requiredCredits,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
}

export async function refundUserCredits(userId, credits) {
  return await UserModel.findByIdAndUpdate(
    userId,
    {
      $inc: {
        credits,
      },
    },
    {
      returnDocument: "after",
    },
  );
}
