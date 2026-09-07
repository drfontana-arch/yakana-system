import crypto from "node:crypto";

// TiendaNube signs every webhook body with HMAC-SHA256 using the app's
// client secret, sent in the x-linkedstore-hmac-sha256 header.
export function verifyTiendaNubeSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.TIENDANUBE_CLIENT_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return false;

  try {
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}
