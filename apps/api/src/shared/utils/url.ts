const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);
const IMAGE_PATH_REGEX = /\.(jpg|jpeg|png|webp|gif)$/i;
const IMGUR_HOST_SUFFIX = ".imgur.com";

function parseUrlOrNull(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Accepts only absolute http(s) URLs. Rejects dangerous schemes such as
 * javascript:, data: or file: that the bare URL constructor would otherwise allow.
 */
export function isSafeHttpUrl(value: string): boolean {
  const parsed = parseUrlOrNull(value);
  return parsed !== null && SAFE_URL_PROTOCOLS.has(parsed.protocol);
}

/**
 * Safe http(s) URL that points to an image: either a direct image path
 * (jpg/jpeg/png/webp/gif) or an Imgur host. Protocol is validated first so a
 * crafted value like `javascript:fetch('imgur.com')` can never pass.
 */
export function isSafeImageUrl(value: string): boolean {
  const parsed = parseUrlOrNull(value);

  if (parsed === null || !SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  const isImgurHost = host === "imgur.com" || host.endsWith(IMGUR_HOST_SUFFIX);

  return IMAGE_PATH_REGEX.test(parsed.pathname) || isImgurHost;
}
