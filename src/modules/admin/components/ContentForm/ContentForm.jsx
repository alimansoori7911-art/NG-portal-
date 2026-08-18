import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import styles from './ContentForm.module.css'

/**
 * فرم مشترک ارسال نوتیفیکیشن و ساخت ریلیز نوت.
 *
 * هر دو در فیگما ساختار یکسانی دارند (tab11 و tab33):
 *   عنوان در y=292
 *   فیلد «متن» ۴۲۳×۶۳ در x=608.5 y=378.5
 *   ناحیه‌ی «متن پیام» ۸۸۳×۱۹۳ در x=153.5 y=483.5
 *   دکمه‌ها در y=724
 *
 * تفاوتشان:
 *   • نوتیفیکیشن یک select «نوع کانال» کنار فیلد متن دارد
 *   • ریلیز نوت به‌جای آن چیزی ندارد و سه دکمه دارد
 */
export default function ContentForm({
    title,
    channels,
    actions = [],
    saving = false,
    fieldErrors = {},
    onSubmit,
    onClose,
    onFieldChange,
}) {
    const [form, setForm] = useState({ subject: '', channel: '', body: '' })

    const change = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }))
        if (fieldErrors[key]) onFieldChange?.(key)
    }

    /* هر دکمه action خودش را می‌فرستد تا صفحه بداند کدام زده شده
       (مثلاً «ذخیره» در برابر «انتشار»). */
    const submit = (action) => (e) => {
        e.preventDefault()
        onSubmit?.(form, action)
    }

    return (
        <form className={styles.wrapper} onSubmit={submit(actions[0]?.id)} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>{title}</h2>

            {/* ردیف بالا: فیلد متن و — در حالت نوتیفیکیشن — انتخاب کانال */}
            <div className={`${styles.topRow} ${channels ? '' : styles.topRowSingle}`}>
                <label
                    className={`${styles.field} ${fieldErrors.subject ? styles.fieldError : ''}`}
                >
                    <span className={styles.fieldLabel}>متن</span>
                    <input
                        className={styles.fieldInput}
                        value={form.subject}
                        onChange={change('subject')}
                        aria-invalid={Boolean(fieldErrors.subject)}
                    />
                </label>

                {channels && (
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>نوع کانال</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.channel}
                                onChange={change('channel')}
                            >
                                <option value="">انتخاب کنید</option>
                                {channels.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                )}
            </div>

            {fieldErrors.subject && (
                <p className={styles.errorText} role="alert">
                    {fieldErrors.subject}
                </p>
            )}

            {/* ناحیه‌ی متن پیام — ۸۸۳×۱۹۳ */}
            <label className={styles.textareaWrapper}>
                <span className={styles.fieldLabel}>متن پیام</span>
                <textarea
                    className={styles.textarea}
                    value={form.body}
                    onChange={change('body')}
                    rows={6}
                />
            </label>

            {/* در RTL اولین فرزند سمت راست می‌نشیند */}
            <div className={styles.actions}>
                {actions.map((action) => (
                    <button
                        key={action.id}
                        type="button"
                        className={styles.actionBtn}
                        onClick={submit(action.id)}
                        disabled={saving}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </form>
    )
}
