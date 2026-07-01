import Link from 'next/link';
import type { Workshop } from '@/lib/api';
import { getStrapiImageUrl } from '@/lib/api';
import styles from './WorkshopCard.module.css';

interface Props {
  workshop: Workshop;
}

export default function WorkshopCard({ workshop }: Props) {
  const imageUrl = workshop.image ? getStrapiImageUrl(workshop.image.url) : '/images/workshop-placeholder.svg';
  const imageAlt = workshop.image?.alternativeText || workshop.title;

  return (
    <Link href={`/workshops/${encodeURIComponent(workshop.slug)}`} className={styles.card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.image} src={imageUrl} alt={imageAlt} aria-hidden="true" />
      <h3 className={styles.title}>{workshop.title}</h3>
      <div className={styles.hr} />
      <div className={styles.descWrap}>
        <p className={styles.description}>{workshop.description}</p>
      </div>
      <div className={styles.cta}>
        <span className={styles.ctaText}>למידע והרשמה</span>
        <span className={styles.ctaArrow} />
      </div>
    </Link>
  );
}
