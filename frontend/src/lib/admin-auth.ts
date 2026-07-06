// Web Crypto (SubtleCrypto) so this module is usable from both the Edge
// runtime (middleware) and the Node runtime (route handlers).

const COOKIE_NAME = 'admin_session';
const SESSION_PAYLOAD = 'maccabi-admin-v1';
const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_COOKIE_SECRET is missing or too short (min 16 chars)');
  }
  return secret;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getExpectedSessionToken(): Promise<string> {
  return hmacHex(getSecret(), SESSION_PAYLOAD);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSessionToken(candidate: string | undefined | null): Promise<boolean> {
  if (!candidate) return false;
  const expected = await getExpectedSessionToken();
  return constantTimeEquals(candidate, expected);
}

export function verifyAdminPassword(candidate: string | undefined | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!candidate || !expected) return false;
  return constantTimeEquals(candidate, expected);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
