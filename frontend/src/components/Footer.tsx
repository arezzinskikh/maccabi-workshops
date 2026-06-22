import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link href="/accessibility" className={styles.link}>הצהרת נגישות</Link>
        <Link href="/privacy" className={styles.link}>מדיניות פרטיות</Link>
      </div>
    </footer>
  );
}
