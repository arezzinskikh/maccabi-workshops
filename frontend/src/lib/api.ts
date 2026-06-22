const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  icon_url: string | null;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Workshop {
  id: number;
  documentId: string;
  title: string;
  description: string;
  registration_link: string;
  sort_order: number;
  image: {
    url: string;
    alternativeText: string | null;
    width: number;
    height: number;
  } | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

async function fetchStrapi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Strapi fetch failed: ${res.status} ${path}`);
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetchStrapi<StrapiResponse<Category[]>>('/categories', {
    'sort': 'sort_order:asc',
    'pagination[pageSize]': '25',
  });
  return res.data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const res = await fetchStrapi<StrapiResponse<Category[]>>('/categories', {
    'filters[slug][$eq]': slug,
  });
  return res.data[0] || null;
}

export async function getWorkshopsByCategory(categorySlug: string): Promise<Workshop[]> {
  const res = await fetchStrapi<StrapiResponse<Workshop[]>>('/workshops', {
    'filters[category][slug][$eq]': categorySlug,
    'populate': 'image,category',
    'sort': 'sort_order:asc',
    'pagination[pageSize]': '50',
  });
  return res.data;
}

export function getStrapiImageUrl(url: string | null | undefined): string {
  if (!url) return '/images/workshop-placeholder.svg';
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
