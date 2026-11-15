export default function errorMiddleware(error, req, res, next) {
    console.error("[Agent-Controller Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
    });

    const statusCode = error?.response?.status || 500;

    const clientMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Internal Server Error";

    return res.status(statusCode).json({
        status: false,
        message: clientMessage,
    });
}
