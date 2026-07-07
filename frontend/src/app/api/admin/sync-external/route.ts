import { NextResponse, type NextRequest } from 'next/server';
import { strapiPost } from '@/lib/admin-api';

export const runtime = 'nodejs';

// Middleware already verified the admin_session cookie for /api/admin/* — this
// route just proxies to Strapi's custom sync endpoint using the server-side
// API token so the browser never sees it.
export async function POST(req: NextRequest) {
  let body: { source_id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const id = Number(body?.source_id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'source_id must be a positive integer' }, { status: 400 });
  }

  const result = await strapiPost<{ ok: boolean; results?: unknown; error?: string }>(
    `/external-sources/${id}/sync`,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.body?.error ?? 'sync failed', results: result.body?.results ?? null },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true, results: result.body?.results ?? null });
}
