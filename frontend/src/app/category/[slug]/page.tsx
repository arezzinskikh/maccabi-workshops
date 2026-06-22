import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkshopCard from '@/components/WorkshopCard';
import { getCategories, getCategoryBySlug, getWorkshopsByCategory } from '@/lib/api';
import styles from './page.module.css';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
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
  return { title: 'מכבי סדנאות' };
}

export default async function CategoryPage({ params }: Props) {
  const [categories, category] = await Promise.all([
    getCategories().catch(() => []),
    getCategoryBySlug(params.slug).catch(() => null),
  ]);

  const workshops = category
    ? await getWorkshopsByCategory(params.slug).catch(() => [])
    : [];

  const displayName = category?.name || decodeURIComponent(params.slug);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>עמוד הבית</Link>
          <span className={styles.breadcrumbSep}>&nbsp;&gt;&nbsp;</span>
          <span className={styles.breadcrumbCurrent}>{displayName}</span>
        </div>

        <div className={styles.layout}>
          <nav className={styles.sidebar} aria-label="קטגוריות">
            <Link href="/" className={styles.backLink}>
              <span className={styles.backArrow}>‹</span>
              <span>חזרה</span>
            </Link>
            <ul className={styles.categoryNav}>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className={`${styles.categoryNavLink} ${cat.slug === params.slug ? styles.active : ''}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className={styles.content}>
            <h1 className={styles.pageTitle}>סדנאות בנושא {displayName}</h1>
            {workshops.length === 0 ? (
              <p className={styles.empty}>אין סדנאות זמינות כרגע בקטגוריה זו.</p>
            ) : (
              <div className={styles.workshopsGrid}>
                {workshops.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
