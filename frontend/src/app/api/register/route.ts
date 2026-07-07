import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const STRAPI_URL = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN || '';

interface RegistrationBody {
  full_name?: string;
  phone?: string;
  email?: string;
  consent?: boolean;
  workshop_id?: number;
  session_date?: string;
  session_time?: string;
  session_type?: 'online' | 'inperson';
  session_instructor?: string;
  session_city?: string;
  notes?: string;
}

function str(v: unknown, max = 500): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function POST(req: NextRequest) {
  let body: RegistrationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const full_name = str(body.full_name, 200);
  const phone = str(body.phone, 30);
  const email = str(body.email, 200);
  const consent = body.consent === true;

  if (!full_name || !phone || !email || !consent) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    full_name,
    phone,
    email,
    consent,
    session_date: str(body.session_date, 40),
    session_time: str(body.session_time, 40),
    session_instructor: str(body.session_instructor, 200),
    session_city: str(body.session_city, 100),
    notes: str(body.notes, 2000),
  };
  if (body.session_type === 'online' || body.session_type === 'inperson') {
    payload.session_type = body.session_type;
  }
  if (typeof body.workshop_id === 'number' && Number.isInteger(body.workshop_id)) {
    payload.workshop = body.workshop_id;
  }

  const res = await fetch(`${STRAPI_URL}/api/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify({ data: payload }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[register] Strapi rejected create', res.status, text);
    return NextResponse.json({ error: 'could not save registration' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
