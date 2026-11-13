import axios from "axios";
import crypto from "crypto";

export default async function refundCredits(
  userId,
  agent,
  humanMessage,
  aiMessage,
) {
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

  if (!userId) {
    throw new Error("User authentication required");
  }

  if (!internalSecret) {
    throw new Error("Internal service secret is not configured");
  }

  const timestamp = Date.now().toString();
  const payload = JSON.stringify({
    userId,
    agent,
    humanMessage,
    aiMessage,
  });

  const signature = crypto
    .createHmac("sha256", internalSecret)
    .update(`${timestamp}|${payload}`)
    .digest("hex");

  try {
    const response = await axios.patch(
      `${authServiceUrl}/internal/deduct-credits`,
      {
        userId,
        agent,
        humanMessage,
        aiMessage,
      },
      {
        headers: {
          "x-internal-timestamp": timestamp,
          "x-internal-signature": signature,
        },
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    console.error("[Deduct-Credits Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    throw error;
  }
}
