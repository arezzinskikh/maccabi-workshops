'use client';

import { Fragment, useState } from 'react';
import type { SyncLogRow } from '@/lib/admin-api';
import styles from './page.module.css';

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function statusBadgeClass(status: SyncLogRow['status']): string {
  if (status === 'ok') return styles.badgeOk;
  if (status === 'partial') return styles.badgePartial;
  return styles.badgeErr;
}

function statusLabel(status: SyncLogRow['status']): string {
  if (status === 'ok') return 'הצלחה';
  if (status === 'partial') return 'חלקי';
  return 'כשל';
}

const MAX_INLINE_ERRORS = 50;

export default function SyncLogs({ logs }: { logs: SyncLogRow[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (logs.length === 0) {
    return <p className={styles.empty}>לא נרשמו סנכרונים עדיין.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>מקור</th>
            <th>סטטוס</th>
            <th>נוצרו</th>
            <th>עודכנו</th>
            <th>דולגו</th>
            <th>שגיאות</th>
            <th>משך</th>
            <th>התחיל</th>
            <th><span className={styles.srOnly}>פעולות</span></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isOpen = !!expanded[log.id];
            const hasDetails = log.errors.length > 0 || !!log.fatal_error;
            return (
              <Fragment key={log.id}>
                <tr>
                  <td>{log.source_name}</td>
                  <td>
                    <span className={`${styles.badge} ${statusBadgeClass(log.status)}`}>{statusLabel(log.status)}</span>
                  </td>
                  <td>{log.created_count}</td>
                  <td>{log.updated_count}</td>
                  <td>{log.skipped_count}</td>
                  <td>{log.error_count}</td>
                  <td>{log.duration_ms} ms</td>
                  <td>{formatDateTime(log.started_at)}</td>
                  <td>
                    {hasDetails ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setExpanded((e) => ({ ...e, [log.id]: !e[log.id] }))}
                      >
                        {isOpen ? 'הסתר' : 'פרטים'}
                      </button>
                    ) : (
                      <span className={styles.topSub}>—</span>
                    )}
                  </td>
                </tr>
                {isOpen && hasDetails && (
                  <tr>
                    <td colSpan={9} className={styles.detailsCell}>
                      {log.fatal_error && (
                        <div className={styles.fatalBox}>
                          <div className={styles.detailsHeading}>שגיאה חמורה</div>
                          <pre className={styles.pre}>{log.fatal_error}</pre>
                        </div>
                      )}
                      {log.errors.length > 0 && (
                        <div>
                          <div className={styles.detailsHeading}>
                            שגיאות פריטים ({log.errors.length}
                            {log.errors.length > MAX_INLINE_ERRORS ? ` — מציג ${MAX_INLINE_ERRORS} ראשונים` : ''})
                          </div>
                          <ul className={styles.errorList}>
                            {log.errors.slice(0, MAX_INLINE_ERRORS).map((err, i) => (
                              <li key={i} className={styles.errorItem}>
                                <span className={styles.errorId}>#{err.external_id ?? '—'}</span>
                                <span className={styles.errorMsg}>{err.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
