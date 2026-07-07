'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ExternalSourceRow } from '@/lib/admin-api';
import styles from './page.module.css';

interface SyncOutcome {
  ok: boolean;
  message: string;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ExternalSources({ sources }: { sources: ExternalSourceRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, SyncOutcome>>({});

  async function sync(source: ExternalSourceRow) {
    setBusyId(source.id);
    setOutcomes((o) => ({ ...o, [source.id]: { ok: true, message: 'מסנכרן…' } }));
    try {
      const res = await fetch('/api/admin/sync-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: source.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOutcomes((o) => ({ ...o, [source.id]: { ok: false, message: body?.error || `שגיאה (HTTP ${res.status})` } }));
        return;
      }
      const r = body?.results as { created?: number; updated?: number; skipped?: number; errors?: unknown[] } | undefined;
      const msg = r
        ? `נוצרו ${r.created ?? 0}, עודכנו ${r.updated ?? 0}, דולגו ${r.skipped ?? 0}${r.errors?.length ? `, שגיאות ${r.errors.length}` : ''}`
        : 'הסנכרון הסתיים';
      setOutcomes((o) => ({ ...o, [source.id]: { ok: true, message: msg } }));
      router.refresh();
    } catch {
      setOutcomes((o) => ({ ...o, [source.id]: { ok: false, message: 'שגיאת רשת' } }));
    } finally {
      setBusyId(null);
    }
  }

  if (sources.length === 0) {
    return <p className={styles.empty}>לא הוגדרו מקורות חיצוניים. פתחו את Strapi ← External Sources כדי להוסיף.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>שם</th>
            <th>כתובת</th>
            <th>סוג אימות</th>
            <th>סטטוס אחרון</th>
            <th>סנכרון אחרון</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => {
            const outcome = outcomes[s.id];
            return (
              <tr key={s.id}>
                <td>
                  <div className={styles.topTitle}>{s.name}</div>
                  <div className={styles.topSub}>{s.slug}{!s.enabled ? ' · מושבת' : ''}</div>
                </td>
                <td className={styles.urlCell}>{s.url}</td>
                <td>{s.auth_type}</td>
                <td>
                  <div>{s.last_sync_status ?? '—'}</div>
                  {outcome && (
                    <div className={`${styles.outcome} ${outcome.ok ? styles.outcomeOk : styles.outcomeErr}`}>
                      {outcome.message}
                    </div>
                  )}
                </td>
                <td>{formatDateTime(s.last_synced_at)}</td>
                <td>
                  <button
                    type="button"
                    className={styles.logout}
                    onClick={() => sync(s)}
                    disabled={!s.enabled || busyId === s.id}
                  >
                    {busyId === s.id ? 'מסנכרן…' : 'סנכרן עכשיו'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
