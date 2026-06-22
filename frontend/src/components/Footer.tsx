import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <a href="https://www.maccabi4u.co.il/new/31276/23554/accessibility/access_services/" className={styles.link} target="_blank" rel="noopener noreferrer">הצהרת נגישות</a>
        <a href="https://www.maccabi4u.co.il/new/23085/policies_and_procedures/privacy_protection/" className={styles.link} target="_blank" rel="noopener noreferrer">מדיניות פרטיות</a>
      </div>
    </footer>
  );
}
