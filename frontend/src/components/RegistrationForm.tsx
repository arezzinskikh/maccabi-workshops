'use client';

import { useState } from 'react';
import styles from './RegistrationForm.module.css';

interface Props {
  workshopTitle: string;
}

export default function RegistrationForm({ workshopTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ fullname: '', mobile: '', email: '', accept: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openForm() {
    setOpen(true);
    setClosing(false);
    setSubmitted(false);
  }

  function closeForm() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 600);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.fullname.trim()) errs.fullname = 'שם מלא בבקשה';
    if (!/^0\d{9}$/.test(form.mobile.replace(/\s/g, ''))) errs.mobile = 'אופסי, נראה לנו שהתבלבלת';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'המייל תקין?';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
    }
  }

  return (
    <>
      <button className={styles.registerBtn} type="button" onClick={openForm}>
        <span className={styles.registerBtnText}>למידע והרשמה</span>
        <span className={styles.registerBtnArrow} />
      </button>

      {open && (
        <div className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`} onClick={closeForm} aria-hidden="true" />
      )}

      {open && (
        <div
          className={`${styles.formContent} ${closing ? styles.formContentClosing : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="טופס הרשמה לסדנה"
        >
          <div className={styles.wrapperForm}>
            <button className={styles.closeBtn} type="button" onClick={closeForm} aria-label="סגירת טופס">
              <span />
              <span />
            </button>

            <a className={styles.logoHref} href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.logoImg} src="/images/logo.svg" alt="לוגו מכבי" />
            </a>

            {submitted ? (
              <div className={styles.successMsg}>
                <h3>תודה על הרשמתך!</h3>
                <p>בקשתך התקבלה. נחזור אליך בהקדם.</p>
                <button className={styles.closeSuccessBtn} type="button" onClick={closeForm}>סגירה</button>
              </div>
            ) : (
              <form className={styles.containerForm} onSubmit={handleSubmit} noValidate>
                <h3>לשליחת בקשה להרשמה לסדנה {workshopTitle}</h3>
                <p className={styles.must}>כל השדות המסומנים ב-* הינם שדות חובה</p>

                <div className={styles.fieldsSection}>
                  <div className={`${styles.field} ${errors.fullname ? styles.fieldError : ''}`}>
                    <span className={styles.fieldPlaceholder}>שם מלא*</span>
                    <input
                      id="name"
                      type="text"
                      name="fullname"
                      autoComplete="off"
                      maxLength={20}
                      required
                      value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                      className={styles.fieldInput}
                      placeholder="שם מלא"
                    />
                    {errors.fullname && <span className={styles.errorMsg}>{errors.fullname}</span>}
                  </div>

                  <div className={`${styles.field} ${errors.mobile ? styles.fieldError : ''}`}>
                    <span className={styles.fieldPlaceholder}>טלפון*</span>
                    <input
                      id="phone"
                      type="tel"
                      name="mobile"
                      autoComplete="off"
                      maxLength={10}
                      required
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      className={styles.fieldInput}
                      placeholder="טלפון"
                    />
                    {errors.mobile && <span className={styles.errorMsg}>{errors.mobile}</span>}
                  </div>

                  <div className={`${styles.field} ${errors.email ? styles.fieldError : ''}`}>
                    <span className={styles.fieldPlaceholder}>מייל*</span>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="off"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={styles.fieldInput}
                      placeholder="מייל"
                    />
                    {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                  </div>

                  <div className={styles.fieldCheckbox}>
                    <label className={styles.checkboxLabel} htmlFor="accept">
                      <input
                        type="checkbox"
                        id="accept"
                        name="accept"
                        checked={form.accept}
                        onChange={(e) => setForm({ ...form, accept: e.target.checked })}
                        className={styles.checkboxInput}
                      />
                      <span className={styles.checkboxCustom} />
                      <span className={styles.checkboxTitle}>
                        אני מסכים/ה לקבל הודעות מידע ושיווק במייל/סמס
                      </span>
                    </label>
                  </div>

                  <div className={styles.sendBtn}>
                    <button className={styles.submitBtn} type="submit">
                      <span className={styles.submitBtnText}>שליחה</span>
                      <span className={styles.submitBtnArrow} />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
