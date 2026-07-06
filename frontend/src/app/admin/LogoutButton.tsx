'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }
  return (
    <button type="button" className={styles.logout} onClick={onClick} disabled={busy}>
      {busy ? 'יוצא…' : 'יציאה'}
    </button>
  );
}
