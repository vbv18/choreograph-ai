export function isSafeUrl(href) {
  if (!href) return false;

  try {
    const url = new URL(href, window.location.origin);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeImageUrl(src) {
  if (typeof src !== "string" || !src.trim()) {
    return null;
  }

  try {
    const url = new URL(src, window.location.origin);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}
