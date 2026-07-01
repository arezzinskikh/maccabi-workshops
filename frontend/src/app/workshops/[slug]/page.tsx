import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FALLBACK_WORKSHOPS, getWorkshopBySlug, type Category } from '@/lib/api';
import styles from './page.module.css';

interface Props {
  params: { slug: string };
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, documentId: '1', name: 'תזונה לחיים בריאים', slug: 'nutrition', icon_url: null, sort_order: 1, createdAt: '', updatedAt: '' },
  { id: 2, documentId: '2', name: 'מפסיקים לעשן', slug: 'quit-smoking', icon_url: null, sort_order: 2, createdAt: '', updatedAt: '' },
  { id: 3, documentId: '3', name: 'קשר משפחתי', slug: 'family', icon_url: null, sort_order: 3, createdAt: '', updatedAt: '' },
  { id: 4, documentId: '4', name: 'לנהל את הסוכרת', slug: 'diabetes', icon_url: null, sort_order: 4, createdAt: '', updatedAt: '' },
  { id: 5, documentId: '5', name: 'גיל שלישי', slug: 'seniors', icon_url: null, sort_order: 5, createdAt: '', updatedAt: '' },
];

function getCategoryForWorkshop(workshopSlug: string): Category | undefined {
  for (const [catSlug, workshops] of Object.entries(FALLBACK_WORKSHOPS)) {
    if (workshops.some((w) => w.slug === workshopSlug)) {
      return FALLBACK_CATEGORIES.find((c) => c.slug === catSlug);
    }
  }
  return undefined;
}

export async function generateStaticParams() {
  return Object.values(FALLBACK_WORKSHOPS)
    .flat()
    .map((w) => ({ slug: encodeURIComponent(w.slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const workshop = getWorkshopBySlug(slug);
  if (workshop) {
    return {
      title: `${workshop.title} - מכבי סדנאות`,
      description: workshop.description,
    };
  }
  return { title: 'מכבי סדנאות' };
}

export default function WorkshopPage({ params }: Props) {
  const slug = decodeURIComponent(params.slug);
  const workshop = getWorkshopBySlug(slug);
  const category = getCategoryForWorkshop(slug);

  if (!workshop) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <p className={styles.notFound}>הסדנה לא נמצאה.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const imageUrl = workshop.image?.url || '/images/workshop-placeholder.svg';

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.breadcrumbSection}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>עמוד הבית</Link>
            <span className={styles.breadcrumbSep}>&nbsp;&nbsp;&gt;&nbsp;&nbsp;</span>
            {category && (
              <>
                <Link href={`/category/${category.slug}`} className={styles.breadcrumbLink}>{category.name}</Link>
                <span className={styles.breadcrumbSep}>&nbsp;&nbsp;&gt;&nbsp;&nbsp;</span>
              </>
            )}
            <p className={styles.breadcrumbCurrent}>{workshop.title}</p>
          </div>
        </div>

        <Link href={category ? `/category/${category.slug}` : '/'} className={styles.backRow}>
          <span className={styles.backLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/back-arrow.svg" alt="" aria-hidden="true" className={styles.backArrowImg} />
            <span>חזרה</span>
          </span>
        </Link>

        <section className={styles.section}>
          <div className={styles.workshopTop}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.workshopImage}
              src={imageUrl}
              alt=""
              aria-hidden="true"
            />
            <div className={styles.workshopTxtContainer}>
              <h1>{workshop.title}</h1>
              <div className={styles.workshopP}>
                <p>{workshop.description}</p>
              </div>
              <div className={styles.workshopPDetails}>
                <p>
                  <span className={styles.boldTxt}>מחיר:</span>
                  {' '}
                  <span>ללא תשלום</span>
                </p>
                <p>
                  <span className={styles.boldTxt}>למי זה מתאים:</span>
                  {' '}
                  <span>למשתתפים מגיל 18 ומעלה</span>
                </p>
              </div>
            </div>
          </div>

          <div className={styles.hrWorkshop} />

          <div className={styles.workshopContainerAct}>
            <h3>איך נוח לך להשתתף?</h3>
            <div className={styles.workshopTypeContainer}>
              <button className={styles.workshopTypeBtn} type="button">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/icons/camera.svg" alt="" aria-hidden="true" className={styles.typeIcon} />
                <span>סדנה מקוונת</span>
              </button>
              <button className={styles.workshopTypeBtn} type="button">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/icons/house.svg" alt="" aria-hidden="true" className={styles.typeIcon} />
                <span>סדנה פרונטאלית</span>
              </button>
            </div>

            <div className={styles.registrationArea}>
              <p className={styles.registrationNote}>
                לצפייה במועדי הסדנאות ולהרשמה, עברו לאתר מכבי סדנאות:
              </p>
              <a
                href={workshop.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registrationBtn}
              >
                למידע והרשמה
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
