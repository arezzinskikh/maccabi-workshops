import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} flex-center`}>
        <Link href="/" className={styles.logoLink} aria-label="לוגו מכבי">
          <Image
            src="/images/logo.svg"
            alt="מכבי"
            width={120}
            height={47}
            className={styles.logo}
            priority
          />
        </Link>
      </div>
    </header>
  );
}
