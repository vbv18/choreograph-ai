export default function errorMiddleware(error, req, res, next) {
  const statusCode = error?.status || error?.statusCode || error?.response?.status || 500;
  const errorData = error?.data || error?.response?.data;
  const clientMessage = errorData?.message || error?.message || "Internal Server Error";

  console.error("[Agent-Controller Error]", {
    status: statusCode,
    message: error?.message,
    data: errorData,
  });

  return res.status(statusCode).json({
    status: false,
    message: clientMessage,
    ...(errorData && { data: errorData }),
  });
}
