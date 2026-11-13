export async function copyToClipboard(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable.");
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("[Clipboard Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    throw error;
  }
}
