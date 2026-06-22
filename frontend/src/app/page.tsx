import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import { getCategories, type Category } from '@/lib/api';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'מכבי סדנאות - לחיות חיים בריאים יותר',
  description: 'הכירו את מגוון הסדנאות של מכבי לאורח חיים בריא: תזונה, גמילה מעישון, קשר משפחתי, ניהול סוכרת וגיל שלישי',
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, documentId: '1', name: 'תזונה לחיים בריאים', slug: 'nutrition', icon_url: '/images/icons/meal.svg', sort_order: 1, createdAt: '', updatedAt: '' },
  { id: 2, documentId: '2', name: 'מפסיקים לעשן', slug: 'quit-smoking', icon_url: '/images/icons/smoking.svg', sort_order: 2, createdAt: '', updatedAt: '' },
  { id: 3, documentId: '3', name: 'קשר משפחתי', slug: 'family', icon_url: '/images/icons/family.svg', sort_order: 3, createdAt: '', updatedAt: '' },
  { id: 4, documentId: '4', name: 'לנהל את הסוכרת', slug: 'diabetes', icon_url: '/images/icons/heart.svg', sort_order: 4, createdAt: '', updatedAt: '' },
  { id: 5, documentId: '5', name: 'גיל שלישי', slug: 'seniors', icon_url: '/images/icons/seniors.svg', sort_order: 5, createdAt: '', updatedAt: '' },
];

export default async function HomePage() {
  let categories: Category[] = FALLBACK_CATEGORIES;
  try {
    const data = await getCategories();
    if (data.length > 0) categories = data;
  } catch {
    // CMS not yet connected — show fallback data
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={`${styles.heroSection} relative`}>
            <div className={`${styles.heroImage} absolute`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-woman.webp"
                alt=""
                width={400}
                height={320}
                className={styles.heroImg}
              />
            </div>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                לחיות חיים בריאים
                <br />
                יותר – זה הכול
              </h1>
              <p className={styles.heroSubtitle}>הכירו את מגוון הסדנאות שלנו לאורח חיים בריא:</p>
            </div>
          </div>

          <div className={styles.categoriesGrid}>
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
