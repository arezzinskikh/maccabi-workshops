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
  slug: string;
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

// Strapi v4 nests entity fields under `attributes` and relations/media under
// `.data`; v5 returns them flat. Normalize both shapes to our flat interfaces.
function flattenCategory(item: any): Category {
  const a = item?.attributes ?? item ?? {};
  return {
    id: item.id,
    documentId: item.documentId ?? String(item.id),
    name: a.name,
    slug: a.slug,
    icon_url: a.icon_url ?? null,
    sort_order: a.sort_order,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function flattenWorkshop(item: any): Workshop {
  const a = item?.attributes ?? item ?? {};
  const imgData = a.image?.data ?? a.image;
  const img = imgData?.attributes ?? imgData;
  const catData = a.category?.data ?? a.category;
  return {
    id: item.id,
    documentId: item.documentId ?? String(item.id),
    title: a.title,
    slug: a.slug ?? '',
    description: a.description,
    registration_link: a.registration_link,
    sort_order: a.sort_order,
    image: img?.url
      ? {
          url: img.url,
          alternativeText: img.alternativeText ?? null,
          width: img.width,
          height: img.height,
        }
      : null,
    category: catData ? flattenCategory(catData) : null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
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
  return res.data.map(flattenCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const res = await fetchStrapi<StrapiResponse<Category[]>>('/categories', {
    'filters[slug][$eq]': slug,
  });
  return res.data[0] ? flattenCategory(res.data[0]) : null;
}

export async function getWorkshopsByCategory(categorySlug: string): Promise<Workshop[]> {
  const res = await fetchStrapi<StrapiResponse<Workshop[]>>('/workshops', {
    'filters[category][slug][$eq]': categorySlug,
    'populate': 'image,category',
    'sort': 'sort_order:asc',
    'pagination[pageSize]': '50',
  });
  return res.data.map(flattenWorkshop);
}

export function getStrapiImageUrl(url: string | null | undefined): string {
  if (!url) return '/images/workshop-placeholder.svg';
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}

const BASE = 'https://workshops.maccabi4u.co.il/wp-content/uploads';

const makeWorkshop = (id: number, slug: string, title: string, description: string, categorySlug: string, imageUrl?: string): Workshop => ({
  id,
  documentId: String(id),
  title,
  slug,
  description,
  registration_link: `https://workshops.maccabi4u.co.il/workshops/${encodeURIComponent(slug)}/`,
  sort_order: id,
  image: imageUrl ? { url: imageUrl, alternativeText: title, width: 400, height: 200 } : null,
  category: null,
  createdAt: '',
  updatedAt: '',
});

export const FALLBACK_WORKSHOPS: Record<string, Workshop[]> = {
  'nutrition': [
    makeWorkshop(1, 'מכבי-קל-10', 'מכבי קל 10', 'קבוצה לירידה במשקל, שינוי הרגלי אכילה ואורח חיים בליווי דיאטנית', 'nutrition', `${BASE}/2024/07/image-1-1.webp`),
    makeWorkshop(2, 'מכבי-קל-המשך', 'מכבי קל – המשך', 'קבוצת המשך לקבוצת מכבי קל לשמירה על משקל תקין, הרגלי אכילה ואורח חיים בריא', 'nutrition', `${BASE}/2024/07/sport.webp`),
    makeWorkshop(3, 'מכבי-קל-קיצור-קיבה-בריאטריה', 'מכבי קל – קיצור קיבה בריאטריה', 'קבוצה לשימור אורח חיים בריא למטופלים שעברו ניתוח קיצור קיבה', 'nutrition', `${BASE}/2024/07/ICON-2.webp`),
    makeWorkshop(4, 'מכבי-קל-קיצור-קיבה-המשך', 'מכבי קל – קיצור קיבה המשך', 'קבוצת המשך למטופלים שעברו ניתוח קיצור קיבה, לשימור אורח חיים בריא', 'nutrition', `${BASE}/2024/07/ICON-5.webp`),
    makeWorkshop(5, 'מכבי-אקטיבי-ילדים-ומתבגרים', 'מכבי אקטיבי – ילדים ומתבגרים', 'תכנית לשיפור אורח חיים בריא אצל ילדים ונוער בעלי עודף משקל בליווי צוות מקצועי', 'nutrition', `${BASE}/2024/07/ICON-4-1.webp`),
    makeWorkshop(6, 'הרצאה-טרום-ניתוח-בריאטרי', 'הרצאה טרום ניתוח בריאטרי', 'הרצאה בת שעה וחצי, שמטרתה מתן מידע למתעניינים בניתוח בריאטרי לקראת הניתוח. ההרצאה כוללת מידע בנושאים: משמעות הניתוח, סוגי הניתוחים השונים וההבדלים בינהם, מי זכאי לבצע הניתוח, סיבוכים אפשריים, תהליך ההכנה לקראת הניתוח, שינויים תזונתיים ורגשיים לאחר הניתוח ואפשרויות המעקב בצוות רב מקצועי במכבי.', 'nutrition', `${BASE}/2024/10/shutterstock_1915529911-scaled.jpg`),
    makeWorkshop(7, 'משפחה-בסגנון-בריא', 'משפחה בסגנון בריא', 'קבוצה להורים לילדים עם עודף משקל, המסייעת להם ביצירת אורח חיים בריא', 'nutrition', `${BASE}/2024/08/%D7%9E%D7%A9%D7%A4%D7%97%D7%94-%D7%91%D7%A1%D7%92%D7%A0%D7%95%D7%9F-%D7%91%D7%A8%D7%99%D7%90-%D7%9E%D7%95%D7%91%D7%99%D7%99%D7%9C.webp`),
    makeWorkshop(8, 'משפחה-בסגנון-בריא-טיפול-תרופתי', 'משפחה בסגנון בריא – בליווי טיפול תרופתי להשמנה במתבגרים', 'קבוצת הדרכה להורים למתבגרים (12-18 שנים), אשר ילדיהם עומדים בכל תנאי הזכאות לקבלת טיפול תרופתי לירידה במשקל, כמפורט בזכאות באתר מכבי.', 'nutrition', `${BASE}/2025/01/shutterstock_2413033271-scaled.jpg`),
    makeWorkshop(9, 'בטן-מלאה-באהבה', 'בטן מלאה באהבה – תזונה בהריון', 'תוכנית ייחודית של 4 מפגשים לנשים בהריון: תזונה נכונה בהריון, ויטמינים, מינרלים ותוספים, בטיחות מזון, עליה במשקל והשפעתה, סימפטומים של הריון והמלצות תזונתיות להקלה, פעילות גופנית בהריון, הנקה, דיכאון לאחר לידה ועוד.', 'nutrition', `${BASE}/2025/04/pregnant.webp`),
  ],
  'quit-smoking': [
    makeWorkshop(10, 'גמילה-מעישון', 'גמילה מעישון', 'סדנה לגמילה מעישון במסגרת קבוצתית תומכת, בהנחיית מומחה מטעם מכבי', 'quit-smoking', `${BASE}/2024/08/%D7%92%D7%9E%D7%99%D7%9C%D7%94-%D7%9E%D7%A2%D7%99%D7%A9%D7%95%D7%9F-%D7%93%D7%A1%D7%A7%D7%98%D7%95%D7%A4.webp`),
  ],
  'family': [
    makeWorkshop(11, 'הכנה-ללידה', 'הכנה ללידה', 'סדנת הכנה לקראת הלידה, עם כל הטיפים והמידע שצריך לדעת לפני הלידה', 'family', `${BASE}/2024/08/%D7%94%D7%9B%D7%A0%D7%94-%D7%9C%D7%9C%D7%99%D7%93%D7%94-%D7%9E%D7%95%D7%91%D7%99%D7%99%D7%9C.webp`),
    makeWorkshop(12, 'מהביס-הראשון', 'מהביס הראשון', 'סדנת טעימות ראשונות להורים לתינוקות עד גיל שנתיים, בהנחיית דיאטנית ממכבי', 'family', `${BASE}/2024/08/%D7%9E%D7%94%D7%91%D7%99%D7%A1-%D7%94%D7%A8%D7%90%D7%A9%D7%95%D7%9F-%D7%9E%D7%95%D7%91%D7%99%D7%99%D7%9C.webp`),
    makeWorkshop(13, 'החייאה-תינוקות-וילדים', 'החייאה תינוקות וילדים', 'סדנת החייאה ועזרה ראשונה להורים לילדים בהדרכת איש מקצוע מטעם מגן דוד אדום', 'family', `${BASE}/2024/08/%D7%94%D7%97%D7%99%D7%99%D7%90%D7%AA-%D7%AA%D7%99%D7%A0%D7%95%D7%A7%D7%95%D7%AA-%D7%9E%D7%95%D7%91%D7%99%D7%99%D7%9C.webp`),
    makeWorkshop(14, 'נגיעה-בהורות-עיסוי-תינוקות', 'נגיעה בהורות – עיסוי תינוקות', 'סדנה להורים לעיסוי תינוקות וחיזוק הקשר בין ההורה לתינוק ע"י מגע', 'family', `${BASE}/2024/08/%D7%A0%D7%92%D7%99%D7%A2%D7%94-%D7%91%D7%94%D7%95%D7%A8%D7%95%D7%AA-%D7%9E%D7%95%D7%91%D7%99%D7%99%D7%9C.webp`),
  ],
  'diabetes': [
    makeWorkshop(15, 'אורח-חיים-בריא-בסוכרת', 'אורח חיים בריא בסוכרת', 'בואו ללמוד איך לסגל אורח חיים בריא עם הסוכרת. בסדנה תקבלו כלים מעשיים לניהול הסוכרת, אימוץ אורח חיים בריא ויצירת מסגרת חיים מטיבה ותומכת. הסדנה בהנחיית אנשי מקצוע מומחים לסוכרת.', 'diabetes', `${BASE}/2024/08/%D7%90%D7%95%D7%A8%D7%97-%D7%97%D7%99%D7%99%D7%9D-%D7%91%D7%A8%D7%99%D7%90-%D7%A2%D7%9D-%D7%A1%D7%95%D7%9B%D7%A8%D7%AA-%D7%93%D7%A1%D7%A7%D7%98%D7%95%D7%A4.webp`),
    makeWorkshop(16, 'אורח-חיים-בריא-בסוכרת-מפות-שיח', 'אורח חיים בריא בסוכרת – בשיטת מפות שיח', 'סדנה ייחודית להקניית ידע וכלים להתמודדות עם מחלת הסוכרת ע"י שיח פתוח בקבוצה קטנה', 'diabetes', `${BASE}/2024/08/%D7%A1%D7%95%D7%9B%D7%A8%D7%AA-2-%D7%9E%D7%95%D7%91%D7%99%D7%99%D7%9C_1.webp`),
  ],
  'seniors': [
    makeWorkshop(17, 'שיפור-ושימור-הזיכרון', 'שיפור ושימור הזיכרון ואורח חיים בריא בגיל השלישי', 'סדנה בת 7 מפגשים להקניית ידע וכלים מעשיים לשיפור ולשימור הזיכרון ולקיום אורח חיים בריא בגיל השלישי', 'seniors', `${BASE}/2025/01/shutterstock_1354254773-scaled.jpg`),
    makeWorkshop(18, 'ניהול-הבריאות-בגיל-השלישי', 'ניהול הבריאות בגיל השלישי', 'סדנה בת 7 מפגשים להקניית ידע וכלים מעשיים לניהול הבריאות בגיל השלישי, לפיתוח אוריינות בריאותית ואורח חיים בריא ופעיל', 'seniors', `${BASE}/2025/01/shutterstock_1185179020-scaled.jpg`),
  ],
};

export function getWorkshopBySlug(slug: string): Workshop | undefined {
  return Object.values(FALLBACK_WORKSHOPS).flat().find((w) => w.slug === slug);
}
