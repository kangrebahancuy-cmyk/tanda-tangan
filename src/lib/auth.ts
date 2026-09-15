import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = process.env.SESSION_SECRET;
if (!secret) throw new Error('SESSION_SECRET is required');
const key = new TextEncoder().encode(secret);
const COOKIE = 'santri_admin_session';

export async function verifyPassword(password: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  return !!hash && bcrypt.compare(password, hash);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setSubject('admin').setIssuedAt().setExpirationTime('8h').sign(key);
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
}

export async function isAdmin() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, key);
    return payload.role === 'admin' && payload.sub === 'admin';
  } catch { return false; }
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('UNAUTHORIZED');
}

export async function logoutAdmin() {
  (await cookies()).delete(COOKIE);
}
