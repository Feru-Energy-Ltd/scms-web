type JwtPayload = Record<string, unknown>;

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  // Pad to correct length for base64 decoding.
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const b64 = normalized + pad;
  const decoded =
    typeof window !== "undefined"
      ? window.atob(b64)
      : Buffer.from(b64, "base64").toString("utf-8");
  return decoded;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadRaw = base64UrlDecode(parts[1]);
    return JSON.parse(payloadRaw) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * True when the token cannot be decoded or its `exp` (seconds since epoch) is in the past.
 * If there is no `exp` claim, returns false (treat as non-expiring for guard purposes).
 */
export function isAccessTokenExpired(token: string): boolean {
  const p = decodeJwtPayload(token);
  if (!p) return true;
  if (typeof p.exp !== "number") return false;
  return Date.now() / 1000 >= p.exp;
}

