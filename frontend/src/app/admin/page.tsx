import type { Metadata } from 'next';
import { buildDashboardData } from '@/lib/admin-api';
import DailyChart from './DailyChart';
import LogoutButton from './LogoutButton';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ניהול סדנאות – לוח בקרה' };

function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminDashboardPage() {
  const data = await buildDashboardData();
  const { kpis, topWorkshops, dailyCounts, registrations } = data;
  const recent = registrations.slice(0, 20);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>לוח בקרה</h1>
          <p className={styles.subtitle}>סקירת הרשמות וניתוח סדנאות</p>
        </div>
        <LogoutButton />
      </header>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>סך הרשמות</p>
          <p className={styles.kpiValue}>{kpis.total}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>השבוע</p>
          <p className={styles.kpiValue}>{kpis.thisWeek}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>סדנאות שנרשמו אליהן</p>
          <p className={styles.kpiValue}>{kpis.uniqueWorkshops}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>קטגוריה מובילה</p>
          <p className={styles.kpiValue}>{kpis.topCategory ?? '—'}</p>
        </div>
      </div>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>הרשמות ב-30 הימים האחרונים</h2>
          {registrations.length === 0 ? (
            <p className={styles.empty}>אין נתונים להצגה עדיין.</p>
          ) : (
            <DailyChart data={dailyCounts} />
          )}
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>סדנאות מובילות</h2>
          {topWorkshops.length === 0 ? (
            <p className={styles.empty}>אין הרשמות עדיין.</p>
          ) : (
            <ul className={styles.topList}>
              {topWorkshops.map((w) => (
                <li key={w.workshopId} className={styles.topRow}>
                  <div>
                    <div className={styles.topTitle}>{w.title}</div>
                    {w.category && <div className={styles.topSub}>{w.category}</div>}
                  </div>
                  <span className={styles.topCount}>{w.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>הרשמות אחרונות</h2>
        {recent.length === 0 ? (
          <p className={styles.empty}>לא נשלחו הרשמות עדיין.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>טלפון</th>
                  <th>אימייל</th>
                  <th>סדנה</th>
                  <th>מועד</th>
                  <th>סוג</th>
                  <th>נשלח</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>{r.full_name}</td>
                    <td>{r.phone}</td>
                    <td>{r.email}</td>
                    <td>{r.workshop?.title ?? '—'}</td>
                    <td>{r.session_date ?? '—'}{r.session_time ? ` · ${r.session_time}` : ''}</td>
                    <td>
                      {r.session_type === 'online' && <span className={styles.badgeOnline}>מקוונת</span>}
                      {r.session_type === 'inperson' && <span className={styles.badgeInperson}>פרונטאלית</span>}
                      {!r.session_type && '—'}
                    </td>
                    <td>{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
