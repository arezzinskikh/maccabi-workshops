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

function flattenRegistration(item: any): RegistrationRow {
  const a = item?.attributes ?? item ?? {};
  const wsRaw = a.workshop?.data ?? a.workshop;
  const wsAttrs = wsRaw?.attributes ?? wsRaw;
  const catRaw = wsAttrs?.category?.data ?? wsAttrs?.category;
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
