export function getCurrentUser(req, res) {
  try {
    res.set("Cache-Control", "no-store");

    return res.status(200).json(req.user);
  } catch (error) {
    console.error("[Get-Current-User Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
