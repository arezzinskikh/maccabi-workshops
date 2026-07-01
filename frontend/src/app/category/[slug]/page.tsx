import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkshopCard from '@/components/WorkshopCard';
import { getCategories, getCategoryBySlug, getWorkshopsByCategory, FALLBACK_WORKSHOPS, type Category } from '@/lib/api';
import styles from './page.module.css';

interface Props {
  params: { slug: string };
}

const SECTION_TITLES: Record<string, string> = {
  'nutrition': 'סדנאות בנושא תזונה',
  'quit-smoking': 'סדנאות בנושא עישון',
  'family': 'סדנאות בנושא קשר משפחתי',
  'diabetes': 'סדנאות בנושא סוכרת',
  'seniors': 'סדנאות בנושא גיל שלישי',
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, documentId: '1', name: 'תזונה לחיים בריאים', slug: 'nutrition', icon_url: '/images/icons/meal.svg', sort_order: 1, createdAt: '', updatedAt: '' },
  { id: 2, documentId: '2', name: 'מפסיקים לעשן', slug: 'quit-smoking', icon_url: '/images/icons/smoking.svg', sort_order: 2, createdAt: '', updatedAt: '' },
  { id: 3, documentId: '3', name: 'קשר משפחתי', slug: 'family', icon_url: '/images/icons/family.svg', sort_order: 3, createdAt: '', updatedAt: '' },
  { id: 4, documentId: '4', name: 'לנהל את הסוכרת', slug: 'diabetes', icon_url: '/images/icons/heart.svg', sort_order: 4, createdAt: '', updatedAt: '' },
  { id: 5, documentId: '5', name: 'גיל שלישי', slug: 'seniors', icon_url: '/images/icons/seniors.svg', sort_order: 5, createdAt: '', updatedAt: '' },
];

export async function generateStaticParams() {
  return FALLBACK_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const category = await getCategoryBySlug(params.slug);
    if (category) {
      return {
        title: `${category.name} - מכבי סדנאות`,
        description: `סדנאות מכבי בנושא ${category.name}`,
      };
    }
  } catch {
    // ignore
  }
  const fallback = FALLBACK_CATEGORIES.find((c) => c.slug === params.slug);
  return { title: fallback ? `${fallback.name} - מכבי סדנאות` : 'מכבי סדנאות' };
}

export default async function CategoryPage({ params }: Props) {
  let categories = FALLBACK_CATEGORIES;
  let workshops = FALLBACK_WORKSHOPS[params.slug] ?? [];

  try {
    const [fetchedCategories, fetchedCategory] = await Promise.all([
      getCategories(),
      getCategoryBySlug(params.slug),
    ]);
    if (fetchedCategories.length > 0) categories = fetchedCategories;
    if (fetchedCategory) {
      const fetched = await getWorkshopsByCategory(params.slug).catch(() => []);
      if (fetched.length > 0) workshops = fetched;
    }
  } catch {
    // CMS not connected — use fallback data
  }

  const currentCategory = categories.find((c) => c.slug === params.slug);
  const displayName = currentCategory?.name || decodeURIComponent(params.slug);
  const sectionTitle = SECTION_TITLES[params.slug];

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.breadcrumbSection}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>עמוד הבית</Link>
            <span className={styles.breadcrumbSep}>&nbsp;&nbsp;&gt;&nbsp;&nbsp;</span>
            <p className={styles.breadcrumbCurrent}>{displayName}</p>
          </div>
        </div>

        <Link href="/" className={styles.backRow}>
          <span className={styles.backLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/back-arrow.svg" alt="" aria-hidden="true" className={styles.backArrowImg} />
            <span>חזרה</span>
          </span>
        </Link>

        <section className={styles.section}>
          <div className={styles.categoryTabs}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`${styles.categoryTab} ${cat.slug === params.slug ? styles.active : ''}`}
              >
                <p>{cat.name}</p>
              </Link>
            ))}
          </div>

          <div className={styles.workshopsArea}>
            {sectionTitle && (
              <h1 className={styles.sectionTitle}>
                <p>{sectionTitle}</p>
              </h1>
            )}
            {workshops.length === 0 ? (
              <p className={styles.empty}>אין סדנאות זמינות כרגע בקטגוריה זו.</p>
            ) : (
              <div className={styles.workshopsList}>
                {workshops.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
