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
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className={styles.image}
          loading="lazy"
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{workshop.title}</h3>
        <p className={styles.description}>{workshop.description}</p>
        {workshop.registration_link && (
          <a
            href={workshop.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            למידע והרשמה
          </a>
        )}
      </div>
    </article>
  );
}
