import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/lib/api';
import styles from './CategoryCard.module.css';

interface Props {
  category: Category;
}

export default function CategoryCard({ category }: Props) {
  return (
    <Link href={`/category/${category.slug}`} className={styles.card}>
      <div className={`${styles.iconWrap} flex-center`}>
        {category.icon_url ? (
          <Image src={category.icon_url} alt="" className={styles.icon} width={60} height={60} unoptimized />
        ) : (
          <DefaultIcon className={styles.icon} />
        )}
      </div>
      <h3 className={styles.name}>{category.name}</h3>
      <div className={styles.cta}>
        <span>לפירוט הסדנאות</span>
        <span className={styles.arrow}>›</span>
      </div>
    </Link>
  );
}

function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="30" cy="30" r="28" stroke="#1E3C95" strokeWidth="2" />
      <path d="M20 30h20M30 20v20" stroke="#1E3C95" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
