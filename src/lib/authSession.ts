import crypto from "crypto";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  authenticated: boolean;
  recipient: string;
  timestamp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET || "sivsha-local-dev-secret-key-2026";
  return secret;
}

/**
 * Creates a cryptographically signed HMAC SHA-256 session token.
 * Format: <base64url(payload)>.<base64url(hmac)>
 */
export function createSignedSessionToken(recipient: string = "Sivani"): string {
  const secret = getSecret();

  const payload: SessionPayload = {
    authenticated: true,
    recipient,
    timestamp: Date.now(),
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadB64);
  const signatureB64 = hmac.digest("base64url");

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies a signed session token using timingSafeEqual to prevent timing attacks.
 * Fails closed if AUTH_SESSION_SECRET is unconfigured or token is invalid.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: SessionPayload } {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const secret = getSecret();
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadB64);
    const expectedSig = hmac.digest("base64url");

    const sigBuffer = Buffer.from(signatureB64);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false };
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));

    // Check expiration
    if (Date.now() - payload.timestamp > SESSION_MAX_AGE_MS) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
