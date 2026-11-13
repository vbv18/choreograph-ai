import crypto from "crypto";

export default async function internalMiddleware(req, res, next) {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

  if (!internalSecret) {
    console.error(
      "[Internal Middleware] Internal service secret is not configured",
    );

    return res.status(500).json({
      success: false,
      message: "Internal service authentication is not configured",
    });
  }

  const timestamp = req.headers["x-internal-timestamp"];
  const signature = req.headers["x-internal-signature"];

  if (!timestamp || !signature) {
    return res.status(401).json({
      success: false,
      message: "Missing internal authentication headers",
    });
  }

  const requestTime = Number(timestamp);

  if (
    !Number.isSafeInteger(requestTime) ||
    Math.abs(Date.now() - requestTime) > 10 * 1000
  ) {
    return res.status(401).json({
      success: false,
      message: "Request expired",
    });
  }

  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", internalSecret)
    .update(`${timestamp}|${payload}`)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid internal service signature",
    });
  }

  return next();
}
