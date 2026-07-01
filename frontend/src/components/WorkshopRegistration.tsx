'use client';

import { useState } from 'react';
import type { Workshop, WorkshopDate } from '@/lib/api';
import styles from './WorkshopRegistration.module.css';

const MAX_DATES = 8;

export default function WorkshopRegistration({ workshop }: { workshop: Workshop }) {
  const [activeType, setActiveType] = useState<'online' | 'inperson'>('online');
  const [selectedDate, setSelectedDate] = useState<WorkshopDate | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allDates = workshop.dates ?? [];
  const filtered = allDates.filter(d => d.type === activeType);
  const visible = showMore ? filtered : filtered.slice(0, MAX_DATES);

  const handleTypeSelect = (type: 'online' | 'inperson') => {
    setActiveType(type);
    setSelectedDate(null);
  };

  const handleRegister = () => {
    setShowForm(true);
    setSubmitted(false);
    setName(''); setPhone(''); setEmail(''); setConsent(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>איך נוח לך להשתתף?</h3>
      <div className={styles.typeRow}>
        <button
          type="button"
          className={`${styles.typeBtn} ${activeType === 'online' ? styles.typeBtnOn : ''}`}
          onClick={() => handleTypeSelect('online')}
          aria-pressed={activeType === 'online'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/icons/camera.svg" alt="" aria-hidden="true" className={styles.typeIcon} />
          <span>סדנה מקוונת</span>
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${activeType === 'inperson' ? styles.typeBtnOn : ''}`}
          onClick={() => handleTypeSelect('inperson')}
          aria-pressed={activeType === 'inperson'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/icons/house.svg" alt="" aria-hidden="true" className={styles.typeIcon} />
          <span>סדנה פרונטאלית</span>
        </button>
      </div>

      <h3 className={styles.heading}>מתי נוח לך?</h3>
      {filtered.length === 0 ? (
        <p className={styles.noDates}>אין מועדים זמינים כרגע.</p>
      ) : (
        <>
          <div className={styles.datesGrid}>
            {visible.map((d, i) => (
              <button
                key={d.id}
                type="button"
                aria-label={`${filtered.length} תוצאה ${i + 1} מתוך: ${d.dayName} ${d.date} ${d.timeEnd} - ${d.timeStart} עם ${d.instructor}`}
                className={`${styles.dateCard} ${selectedDate?.id === d.id ? styles.dateCardSelected : ''}`}
                onClick={() => setSelectedDate(d)}
              >
                <span className={styles.dateDayDate}>{d.dayName} {d.date}</span>
                <span className={styles.dateTime}>{d.timeEnd} - {d.timeStart}</span>
                <span className={styles.dateInst}>עם {d.instructor}</span>
              </button>
            ))}
          </div>
          {!showMore && filtered.length > MAX_DATES && (
            <button type="button" className={styles.moreBtn} onClick={() => setShowMore(true)}>
              מועדים נוספים
            </button>
          )}
        </>
      )}

      <button
        type="button"
        className={styles.registerBtn}
        disabled={!selectedDate}
        onClick={handleRegister}
      >
        <span>להרשמה לסדנה</span>
        <span aria-hidden="true" className={styles.arrow}> ›</span>
      </button>

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)} role="dialog" aria-modal="true" aria-label="טופס הרשמה">
          <div className={styles.panel} onClick={e => e.stopPropagation()}>
            <button type="button" className={styles.closeBtn} onClick={() => setShowForm(false)} aria-label="סגור">×</button>
            {submitted ? (
              <div className={styles.success}>
                <p className={styles.successIcon}>✓</p>
                <h2>הבקשה נשלחה בהצלחה!</h2>
                <p>נחזור אליך בהקדם עם פרטי ההרשמה לסדנה.</p>
              </div>
            ) : (
              <>
                <h2 className={styles.formTitle}>לשליחת בקשה להרשמה לסדנה<br />{workshop.title}</h2>
                <p className={styles.formNote}>כל השדות המסומנים ב-* הם שדות חובה</p>
                <form onSubmit={handleSubmit} className={styles.form}>
                  <input className={styles.input} type="text" placeholder="שם מלאי*" value={name} onChange={e => setName(e.target.value)} required />
                  <input className={styles.input} type="tel" placeholder="טלפון*" value={phone} onChange={e => setPhone(e.target.value)} required />
                  <input className={styles.input} type="email" placeholder="מייל*" value={email} onChange={e => setEmail(e.target.value)} required />
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required />
                    <span>אני מסכים/ה לקבל הרשמה מלאה שאלון באימייל/סמס</span>
                  </label>
                  <button type="submit" className={styles.submitBtn}>
                    <span>שליחה ›</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
