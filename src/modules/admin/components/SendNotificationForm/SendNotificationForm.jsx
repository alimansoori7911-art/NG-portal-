import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { notificationService } from '../../../../services/notificationService'
import styles from './SendNotificationForm.module.css'

/**
 * فرم ارسال نوتیفیکیشن — مطابق چیدمان فیگما (tab11).
 *
 * برخلاف طرح اولیه که یک فیلد متن آزاد داشت، بک‌اند متن را از
 * «قالب» می‌سازد: ادمین قالب را انتخاب می‌کند و اگر آن قالب
 * متغیر داشته باشد ({first_name} و مانند آن) مقدارشان را پر می‌کند.
 *
 * گیرنده‌ها یا فهرست شناسه‌های کاربر است یا ارسال همگانی.
 * ارسال همگانی چون برگشت‌پذیر نیست، تأیید جداگانه می‌خواهد.
 */
export default function SendNotificationForm({ templates = [], onSent, onClose }) {
    const [templateKey, setTemplateKey] = useState('')
    const [recipients, setRecipients] = useState('')
    const [broadcast, setBroadcast] = useState(false)
    const [confirmed, setConfirmed] = useState(false)
    const [values, setValues] = useState({})
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)

    const selected = templates.find((t) => t.key === templateKey)
    const variables = selected?.variables ?? []

    const pickTemplate = (key) => {
        setTemplateKey(key)
        setValues({})
        setError(null)
    }

    /* شناسه‌ها با کاما یا فاصله جدا می‌شوند */
    const parseRecipients = () =>
        recipients
            .split(/[\s,،]+/)
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isInteger(n) && n > 0)

    const submit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!templateKey) {
            setError('انتخاب قالب الزامی است')
            return
        }

        const missing = variables.filter((v) => !String(values[v] ?? '').trim())
        if (missing.length > 0) {
            setError(`مقدار این متغیرها لازم است: ${missing.join('، ')}`)
            return
        }

        const ids = parseRecipients()
        if (!broadcast && ids.length === 0) {
            setError('حداقل یک شناسه‌ی کاربر وارد کنید یا ارسال همگانی را بزنید')
            return
        }

        if (broadcast && !confirmed) {
            setError('برای ارسال همگانی، تیک تأیید را بزنید')
            return
        }

        setSending(true)
        try {
            await notificationService.send({
                template_key: templateKey,
                recipient_ids: ids,
                broadcast,
                payload: values,
            })
            onSent?.()
        } catch (err) {
            setError(err?.message || 'ارسال اعلان ناموفق بود')
        } finally {
            setSending(false)
        }
    }

    return (
        <form className={styles.wrapper} onSubmit={submit} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>ارسال نوتیفیکیشن</h2>

            <div className={styles.topRow}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>قالب پیام</span>
                    <div className={styles.selectRow}>
                        <select
                            className={styles.select}
                            value={templateKey}
                            onChange={(e) => pickTemplate(e.target.value)}
                        >
                            <option value="">انتخاب کنید</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.key}>
                                    {t.title} ({t.key})
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={18} className={styles.selectIcon} />
                    </div>
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        شناسه کاربران (با کاما جدا کنید)
                    </span>
                    <input
                        className={styles.fieldInput}
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        disabled={broadcast}
                        placeholder="مثال: 42, 43, 44"
                        dir="ltr"
                    />
                </label>
            </div>

            {/* متغیرهای قالب — فقط اگر قالب انتخاب‌شده متغیر داشته باشد */}
            {variables.length > 0 && (
                <div className={styles.variables}>
                    <span className={styles.fieldLabel}>مقدار متغیرهای قالب</span>
                    <div className={styles.variableGrid}>
                        {variables.map((v) => (
                            <label key={v} className={styles.field}>
                                <span className={styles.fieldLabel}>{`{${v}}`}</span>
                                <input
                                    className={styles.fieldInput}
                                    value={values[v] ?? ''}
                                    onChange={(e) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            [v]: e.target.value,
                                        }))
                                    }
                                />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* پیش‌نمایش متن قالب تا ادمین بداند چه چیزی ارسال می‌شود */}
            {selected && (
                <div className={styles.preview}>
                    <span className={styles.fieldLabel}>پیش‌نمایش</span>
                    <p className={styles.previewText}>{selected.title}</p>
                    <p className={styles.previewChannel}>کانال: {selected.channel}</p>
                </div>
            )}

            <label className={styles.checkRow}>
                <input
                    type="checkbox"
                    checked={broadcast}
                    onChange={(e) => {
                        setBroadcast(e.target.checked)
                        setConfirmed(false)
                    }}
                />
                <span>ارسال به همه‌ی کاربران</span>
            </label>

            {broadcast && (
                <label className={`${styles.checkRow} ${styles.confirmRow}`}>
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span>
                        تأیید می‌کنم این پیام برای <strong>همه‌ی کاربران</strong> ارسال
                        شود. این کار برگشت‌پذیر نیست.
                    </span>
                </label>
            )}

            {error && (
                <p className={styles.errorText} role="alert">
                    {error}
                </p>
            )}

            <div className={styles.actions}>
                <button type="submit" className={styles.actionBtn} disabled={sending}>
                    {sending ? 'در حال ارسال…' : 'انتشار و ارسال نوتیفیکیشن'}
                </button>
            </div>
        </form>
    )
}
