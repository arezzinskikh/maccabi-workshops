import 'server-only';

const STRAPI_URL = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN || '';

export interface RegistrationRow {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  consent: boolean;
  session_date: string | null;
  session_time: string | null;
  session_type: 'online' | 'inperson' | null;
  session_instructor: string | null;
  session_city: string | null;
  notes: string | null;
  createdAt: string;
  workshop: { id: number; title: string; category: string | null } | null;
}

interface StrapiEnvelope<T> {
  data: T;
  meta?: { pagination?: { total?: number } };
}

async function strapiGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Strapi GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function strapiPost<T>(path: string): Promise<{ ok: boolean; status: number; body: T }> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

export interface ExternalSourceRow {
  id: number;
  name: string;
  slug: string;
  url: string;
  enabled: boolean;
  auth_type: 'none' | 'bearer' | 'api_key' | 'basic';
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_count: number;
}

export interface SyncLogError {
  external_id: string | number | null;
  message: string;
}

export interface SyncLogRow {
  id: number;
  source_name: string;
  status: 'ok' | 'partial' | 'error';
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors: SyncLogError[];
  started_at: string;
  finished_at: string;
  duration_ms: number;
  fatal_error: string | null;
}

export async function fetchSyncLogs(limit = 20): Promise<SyncLogRow[]> {
  const res = await strapiGet<{ data: any[] }>('/sync-logs', {
    'sort': 'started_at:desc',
    'pagination[pageSize]': String(limit),
  });
  return (res.data ?? []).map((item) => {
    const a = item?.attributes ?? item ?? {};
    const rawErrors = Array.isArray(a.errors) ? a.errors : [];
    return {
      id: item.id,
      source_name: a.source_name ?? '',
      status: (a.status ?? 'ok') as SyncLogRow['status'],
      created_count: a.created_count ?? 0,
      updated_count: a.updated_count ?? 0,
      skipped_count: a.skipped_count ?? 0,
      error_count: a.error_count ?? 0,
      errors: rawErrors as SyncLogError[],
      started_at: a.started_at ?? '',
      finished_at: a.finished_at ?? '',
      duration_ms: a.duration_ms ?? 0,
      fatal_error: a.fatal_error ?? null,
    };
  });
}

export async function fetchExternalSources(): Promise<ExternalSourceRow[]> {
  const res = await strapiGet<{ data: any[] }>('/external-sources', {
    'sort': 'name:asc',
    'pagination[pageSize]': '100',
  });
  return (res.data ?? []).map((item) => {
    const a = item?.attributes ?? item ?? {};
    return {
      id: item.id,
      name: a.name ?? '',
      slug: a.slug ?? '',
      url: a.url ?? '',
      enabled: !!a.enabled,
      auth_type: a.auth_type ?? 'none',
      last_synced_at: a.last_synced_at ?? null,
      last_sync_status: a.last_sync_status ?? null,
      last_sync_count: a.last_sync_count ?? 0,
    };
  });
}

// Strapi v4 wraps relations as `{ data: null | {...} }`; v5 returns them flat.
// A relation that's unset/deleted in v4 is `{ data: null }`, which is truthy,
// so it must be unwrapped explicitly rather than via `?.data ?? x`.
function unwrapRelation(rel: any): any {
  if (rel && typeof rel === 'object' && 'data' in rel) return rel.data;
  return rel;
}

function flattenRegistration(item: any): RegistrationRow {
  const a = item?.attributes ?? item ?? {};
  const wsRaw = unwrapRelation(a.workshop);
  const wsAttrs = wsRaw?.attributes ?? wsRaw;
  const catRaw = unwrapRelation(wsAttrs?.category);
  const catAttrs = catRaw?.attributes ?? catRaw;
  return {
    id: item.id,
    full_name: a.full_name ?? '',
    phone: a.phone ?? '',
    email: a.email ?? '',
    consent: !!a.consent,
    session_date: a.session_date ?? null,
    session_time: a.session_time ?? null,
    session_type: a.session_type ?? null,
    session_instructor: a.session_instructor ?? null,
    session_city: a.session_city ?? null,
    notes: a.notes ?? null,
    createdAt: a.createdAt ?? '',
    workshop: wsRaw
      ? {
          id: wsRaw.id,
          title: wsAttrs?.title ?? '',
          category: catAttrs?.name ?? null,
        }
      : null,
  };
}

export async function fetchRegistrations(limit = 500): Promise<RegistrationRow[]> {
  const res = await strapiGet<StrapiEnvelope<any[]>>('/registrations', {
    'populate[workshop][populate][category]': 'true',
    'sort': 'createdAt:desc',
    'pagination[pageSize]': String(limit),
  });
  return (res.data ?? []).map(flattenRegistration);
}

export interface DashboardData {
  registrations: RegistrationRow[];
  kpis: {
    total: number;
    thisWeek: number;
    uniqueWorkshops: number;
    topCategory: string | null;
  };
  topWorkshops: { workshopId: number; title: string; category: string | null; count: number }[];
  dailyCounts: { date: string; count: number }[];
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function buildDashboardData(): Promise<DashboardData> {
  const registrations = await fetchRegistrations(500);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const thisWeek = registrations.filter((r) => r.createdAt && new Date(r.createdAt) >= weekAgo).length;

  const perWorkshop = new Map<number, { workshopId: number; title: string; category: string | null; count: number }>();
  const perCategory = new Map<string, number>();
  for (const r of registrations) {
    if (r.workshop) {
      const cur = perWorkshop.get(r.workshop.id);
      if (cur) cur.count += 1;
      else perWorkshop.set(r.workshop.id, { workshopId: r.workshop.id, title: r.workshop.title, category: r.workshop.category, count: 1 });
      if (r.workshop.category) {
        perCategory.set(r.workshop.category, (perCategory.get(r.workshop.category) ?? 0) + 1);
      }
    }
  }
  const topWorkshops = Array.from(perWorkshop.values()).sort((a, b) => b.count - a.count).slice(0, 10);

  let topCategory: string | null = null;
  let topCategoryCount = 0;
  perCategory.forEach((cnt, cat) => {
    if (cnt > topCategoryCount) {
      topCategoryCount = cnt;
      topCategory = cat;
    }
  });

  // Build a 30-day daily-count series (fills zero days so the chart is continuous).
  const bucket = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    bucket.set(isoDay(d), 0);
  }
  for (const r of registrations) {
    if (!r.createdAt) continue;
    const day = isoDay(new Date(r.createdAt));
    if (bucket.has(day)) bucket.set(day, (bucket.get(day) ?? 0) + 1);
  }
  const dailyCounts: { date: string; count: number }[] = [];
  bucket.forEach((count, date) => { dailyCounts.push({ date, count }); });

  return {
    registrations,
    kpis: {
      total: registrations.length,
      thisWeek,
      uniqueWorkshops: perWorkshop.size,
      topCategory,
    },
    topWorkshops,
    dailyCounts,
  };
}
