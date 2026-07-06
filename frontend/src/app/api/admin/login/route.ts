import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, getExpectedSessionToken, verifyAdminPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let password = '';
  const contentType = req.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = await req.json();
      password = typeof body?.password === 'string' ? body.password : '';
    } else {
      const form = await req.formData();
      const raw = form.get('password');
      password = typeof raw === 'string' ? raw : '';
    }
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'invalid password' }, { status: 401 });
  }

  const token = await getExpectedSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
