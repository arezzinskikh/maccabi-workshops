"use strict";

/**
 * Seed script — run once after Strapi first launch:
 *   node src/seed.js
 *
 * Creates the 5 workshop categories and sample workshops matching the
 * original Maccabi workshops site.
 *
 * Requires the Strapi REST API to be accessible on http://localhost:1337
 * and a valid API token set in STRAPI_API_TOKEN env var, or run as admin.
 */

const BASE_URL = process.env.STRAPI_URL || "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function post(path, data) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

const CATEGORIES = [
  { name: "תזונה לחיים בריאים", slug: "nutrition", sort_order: 1 },
  { name: "מפסיקים לעשן", slug: "quit-smoking", sort_order: 2 },
  { name: "קשר משפחתי", slug: "family", sort_order: 3 },
  { name: "לנהל את הסוכרת", slug: "diabetes", sort_order: 4 },
  { name: "גיל שלישי", slug: "seniors", sort_order: 5 },
];

const WORKSHOPS = [
  {
    categorySlug: "nutrition",
    title: "מכבי קל 10",
    description:
      "קבוצה לירידה במשקל, שינוי הרגלי אכילה ואורח חיים בליווי דיאטנית",
    registration_link: "#",
    sort_order: 1,
  },
  {
    categorySlug: "nutrition",
    title: "מכבי קל – המשך",
    description:
      "קבוצת המשך לקבוצת מכבי קל לשמירה על משקל תקין, הרגלי אכילה ואורח חיים בריא",
    registration_link: "#",
    sort_order: 2,
  },
  {
    categorySlug: "nutrition",
    title: "מכבי אקטיבי – ילדים ומתבגרים",
    description:
      "תכנית לשיפור אורח חיים בריא אצל ילדים ונוער בעלי עודף משקל בליווי צוות מקצועי",
    registration_link: "#",
    sort_order: 3,
  },
  {
    categorySlug: "nutrition",
    title: "בטן מלאה באהבה – תזונה בהריון",
    description:
      "תוכנית ייחודית של 4 מפגשים לנשים בהריון: תזונה נכונה בהריון, ויטמינים, מינרלים ותוספים",
    registration_link: "#",
    sort_order: 4,
  },
  {
    categorySlug: "quit-smoking",
    title: "גמילה מעישון – קבוצת תמיכה",
    description:
      "קבוצת תמיכה לגמילה מעישון בליווי מקצועי. מפגשים שבועיים, כלים מעשיים, וסביבה תומכת",
    registration_link: "#",
    sort_order: 1,
  },
  {
    categorySlug: "quit-smoking",
    title: "גמילה מעישון – טיפול פרטני",
    description:
      "פגישות אישיות עם מומחה לגמילה מעישון, תוכנית מותאמת אישית לפי צרכים וקצב האדם",
    registration_link: "#",
    sort_order: 2,
  },
  {
    categorySlug: "family",
    title: "זוגיות בריאה",
    description:
      "סדנה לחיזוק הקשר הזוגי ושיפור התקשורת בין בני הזוג, בהנחיית מטפל זוגי",
    registration_link: "#",
    sort_order: 1,
  },
  {
    categorySlug: "family",
    title: "הורות מיטיבה",
    description: "סדנה להורים לחיזוק הקשר עם ילדים ופיתוח כישורי הורות בריאים",
    registration_link: "#",
    sort_order: 2,
  },
  {
    categorySlug: "diabetes",
    title: "חיים עם סוכרת סוג 2",
    description:
      "תוכנית 8 מפגשים לניהול סוכרת סוג 2: תזונה, פעילות גופנית, ניטור ועוד",
    registration_link: "#",
    sort_order: 1,
  },
  {
    categorySlug: "diabetes",
    title: "מניעת סוכרת",
    description:
      "סדנה לאנשים בסיכון גבוה לסוכרת. למידה על שינוי אורח חיים למניעת המחלה",
    registration_link: "#",
    sort_order: 2,
  },
  {
    categorySlug: "seniors",
    title: "פעילות גופנית בגיל השלישי",
    description:
      "תכנית פעילות גופנית מותאמת לגיל השלישי: חיזוק שרירים, שיווי משקל וגמישות",
    registration_link: "#",
    sort_order: 1,
  },
  {
    categorySlug: "seniors",
    title: "חיים בריאים בגיל השלישי",
    description:
      "סדנת אורח חיים בריא לגיל הזהב: תזונה, פעילות גופנית ורווחה נפשית",
    registration_link: "#",
    sort_order: 2,
  },
];

async function seed() {
  console.log("Seeding Strapi with Maccabi workshop data...");

  const categoryMap = {};

  for (const cat of CATEGORIES) {
    console.log(`Creating category: ${cat.name}`);
    const res = await post("/categories", cat);
    categoryMap[cat.slug] = res.data.id;
  }

  for (const workshop of WORKSHOPS) {
    const { categorySlug, ...data } = workshop;
    const categoryId = categoryMap[categorySlug];
    console.log(`Creating workshop: ${data.title}`);
    await post("/workshops", { ...data, category: categoryId });
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
