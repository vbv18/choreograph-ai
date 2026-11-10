export function getCurrentUser(req, res) {
  try {
    res.set("Cache-Control", "no-store");

    return res.status(200).json(req.user);
  } catch (error) {
    console.error("[Get-Current-User Error]", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
