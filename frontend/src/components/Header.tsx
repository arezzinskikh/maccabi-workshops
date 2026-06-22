import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} flex-center`}>
        <Link href="/" className={styles.logoLink} aria-label="לוגו מכבי">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.svg"
            alt="מכבי"
            width={120}
            height={47}
            className={styles.logo}
          />
        </Link>
      </div>
    </header>
  );
}
