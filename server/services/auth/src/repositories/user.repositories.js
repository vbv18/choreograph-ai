import { PLANS } from "../../../lib/constant.js";
import UserModel from "../models/user.model.js";

export async function findOneUser(firebaseUid, email = "") {
  const query = email ? { $or: [{ firebaseUid }, { email }] } : { firebaseUid };
  const user = await UserModel.findOne(query);

  return user;
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

export async function findOneAndUpdateUser(userId, planId) {
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
