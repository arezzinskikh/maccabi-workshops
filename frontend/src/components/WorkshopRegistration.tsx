'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Workshop, WorkshopDate } from '@/lib/api';
import styles from './WorkshopRegistration.module.css';

const MAX_DATES = 8;

type Step = 'city' | 'date';

export default function WorkshopRegistration({ workshop }: { workshop: Workshop }) {
  const [activeType, setActiveType] = useState<'online' | 'inperson'>('online');
  const [step, setStep] = useState<Step>('date');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<WorkshopDate | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cityDropdownRef = useRef<HTMLDivElement | null>(null);

  const allDates = workshop.dates ?? [];
  const typeFiltered = useMemo(() => allDates.filter((d) => d.type === activeType), [allDates, activeType]);

  const availableCities = useMemo(() => {
    if (activeType !== 'inperson') return [];
    const set = new Set<string>();
    for (const d of typeFiltered) if (d.city) set.add(d.city);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
  }, [typeFiltered, activeType]);

  const inpersonWizard = activeType === 'inperson' && availableCities.length > 0;

  const dateFiltered = useMemo(() => {
    if (!inpersonWizard || selectedCities.length === 0) return typeFiltered;
    return typeFiltered.filter((d) => d.city && selectedCities.includes(d.city));
  }, [typeFiltered, inpersonWizard, selectedCities]);

  const visible = showMore ? dateFiltered : dateFiltered.slice(0, MAX_DATES);

  const handleTypeSelect = (type: 'online' | 'inperson') => {
    setActiveType(type);
    setSelectedDate(null);
    setSelectedCities([]);
    setCityDropdownOpen(false);
    setStep(type === 'inperson' ? 'city' : 'date');
    setShowMore(false);
  };

  // Reset to city step when landing on in-person and cities exist (e.g. first
  // render where activeType defaults to 'online' → user switches to inperson).
  useEffect(() => {
    if (activeType === 'inperson' && availableCities.length > 0) {
      // Only reset step if no city has been selected yet.
      if (selectedCities.length === 0 && step !== 'city') setStep('city');
    } else {
      if (step !== 'date') setStep('date');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, availableCities.length]);

  // Close city dropdown on outside click.
  useEffect(() => {
    if (!cityDropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [cityDropdownOpen]);

  const toggleCity = (name: string) => {
    setSelectedCities((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
    setSelectedDate(null);
  };

  const goToDateStep = () => {
    setStep('date');
    setCityDropdownOpen(false);
  };
  const goToCityStep = () => {
    setStep('city');
    setSelectedDate(null);
  };

  const handleRegister = () => {
    setShowForm(true);
    setSubmitted(false);
    setName(''); setPhone(''); setEmail(''); setConsent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          phone,
          email,
          consent,
          workshop_id: workshop.id,
          session_date: selectedDate?.date,
          session_time: selectedDate ? `${selectedDate.timeStart} - ${selectedDate.timeEnd}` : undefined,
          session_type: selectedDate?.type,
          session_instructor: selectedDate?.instructor,
          session_city: selectedDate?.city ?? undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body?.error ? `שגיאה: ${body.error}` : 'לא הצלחנו לשלוח את הבקשה, נסו שוב.');
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('לא הצלחנו לשלוח את הבקשה, נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  const cityTriggerLabel =
    selectedCities.length === 0
      ? 'עיר'
      : selectedCities.length === 1
      ? selectedCities[0]
      : `${selectedCities.length} ערים נבחרו`;

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

      {inpersonWizard && (
        <ol className={styles.steps} aria-label="שלבי הרשמה">
          <li className={`${styles.stepItem} ${step === 'city' ? styles.stepItemActive : styles.stepItemDone}`}>
            <button type="button" className={styles.stepBtn} onClick={goToCityStep} aria-current={step === 'city'}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepLabel}>בחירת עיר</span>
            </button>
          </li>
          <span className={styles.stepSep} aria-hidden="true" />
          <li className={`${styles.stepItem} ${step === 'date' ? styles.stepItemActive : ''}`}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={goToDateStep}
              disabled={selectedCities.length === 0}
              aria-current={step === 'date'}
            >
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepLabel}>בחירת מועד</span>
            </button>
          </li>
        </ol>
      )}

      {inpersonWizard && step === 'city' && (
        <div className={styles.cityStep}>
          <p className={styles.cityHint}>ניתן לבחור מס&#39; ערים</p>
          <div className={styles.citySelect} ref={cityDropdownRef}>
            <button
              type="button"
              className={styles.cityTrigger}
              onClick={() => setCityDropdownOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={cityDropdownOpen}
            >
              <span className={selectedCities.length === 0 ? styles.cityTriggerPlaceholder : undefined}>{cityTriggerLabel}</span>
              <span className={styles.cityChevron} aria-hidden="true">▾</span>
            </button>
            {cityDropdownOpen && (
              <ul className={styles.cityList}>
                {availableCities.map((c) => (
                  <li key={c} className={styles.cityListItem}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(c)}
                        onChange={() => toggleCity(c)}
                      />
                      <span>{c}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className={styles.registerBtn}
            disabled={selectedCities.length === 0}
            onClick={goToDateStep}
          >
            <span>המשך</span>
            <span aria-hidden="true" className={styles.arrow}> ›</span>
          </button>
        </div>
      )}

      {(!inpersonWizard || step === 'date') && (
        <>
          <h3 className={styles.heading}>מתי נוח לך?</h3>
          {dateFiltered.length === 0 ? (
            <p className={styles.noDates}>אין מועדים זמינים כרגע.</p>
          ) : (
            <>
              <div className={styles.datesGrid}>
                {visible.map((d, i) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-label={`${dateFiltered.length} תוצאה ${i + 1} מתוך: ${d.dayName} ${d.date} ${d.timeEnd} - ${d.timeStart} עם ${d.instructor}${d.city ? ' ב' + d.city : ''}`}
                    className={`${styles.dateCard} ${selectedDate?.id === d.id ? styles.dateCardSelected : ''}`}
                    onClick={() => setSelectedDate(d)}
                  >
                    <span className={styles.dateDayDate}>{d.dayName} {d.date}</span>
                    <span className={styles.dateTime}>{d.timeEnd} - {d.timeStart}</span>
                    <span className={styles.dateInst}>עם {d.instructor}</span>
                    {d.city && <span className={styles.dateCity}>{d.city}</span>}
                  </button>
                ))}
              </div>
              {!showMore && dateFiltered.length > MAX_DATES && (
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
        </>
      )}

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
                  {submitError && <p className={styles.submitError}>{submitError}</p>}
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    <span>{submitting ? 'שולח…' : 'שליחה ›'}</span>
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
