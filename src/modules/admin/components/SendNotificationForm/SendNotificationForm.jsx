import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { notificationService } from '../../../../services/notificationService'
import UserPicker from '../UserPicker/UserPicker'
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
/* دسته‌ی اعلان — enum `NotificationType`. فقط در حالت متن آزاد لازم
   است؛ در حالت قالب، دسته از خودِ قالب می‌آید. */
const NOTIFICATION_TYPES = {
    system: 'سیستمی',
    kyc: 'احراز هویت',
    ticket: 'تیکت',
    order: 'سفارش',
    security: 'امنیتی',
}

export default function SendNotificationForm({ templates = [], onSent, onClose }) {
    /* ✅ اسپک ۲۱ ارسال بدون قالب را اضافه کرد.
       `mode` بین دو حالت سوئیچ می‌کند؛ اسپک صریح می‌گوید فیلدهای متن
       آزاد فقط وقتی معنا دارند که `template_key` نیامده باشد. */
    const [mode, setMode] = useState('template')
    const [templateKey, setTemplateKey] = useState('')
    const [free, setFree] = useState({
        type: 'system',
        title: '',
        body: '',
        sms_body: '',
        sms: false,
    })
    const [recipientIds, setRecipientIds] = useState([])
    const [broadcast, setBroadcast] = useState(false)
    const [confirmed, setConfirmed] = useState(false)
    const [values, setValues] = useState({})
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)

    const isTemplate = mode === 'template'
    const selected = templates.find((t) => t.key === templateKey)
    const variables = selected?.variables ?? []

    const pickTemplate = (key) => {
        setTemplateKey(key)
        setValues({})
        setError(null)
    }


    const submit = async (e) => {
        e.preventDefault()
        setError(null)

        if (isTemplate) {
            if (!templateKey) {
                setError('انتخاب قالب الزامی است')
                return
            }

            const missing = variables.filter((v) => !String(values[v] ?? '').trim())
            if (missing.length > 0) {
                setError(`مقدار این متغیرها لازم است: ${missing.join('، ')}`)
                return
            }
        } else {
            /* `body` در اسپک وقتی قالب نیامده **الزامی** است */
            if (!free.body.trim()) {
                setError('متن پیام الزامی است')
                return
            }
            if (free.sms && !free.sms_body.trim()) {
                setError('متن پیامک را بنویسید یا تیک پیامک را بردارید')
                return
            }
        }

        const ids = recipientIds
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
                recipient_ids: ids,
                broadcast,
                ...(isTemplate
                    ? { template_key: templateKey, payload: values }
                    : {
                          type: free.type,
                          title: free.title.trim() || null,
                          body: free.body.trim(),
                          sms_body: free.sms ? free.sms_body.trim() : null,
                          channels: free.sms ? ['in_app', 'sms'] : ['in_app'],
                      }),
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

            {/* انتخاب حالت — قالب در برابر متن آزاد */}
            <div className={styles.modeRow}>
                <button
                    type="button"
                    className={`${styles.modeBtn} ${isTemplate ? styles.modeBtnActive : ''}`}
                    onClick={() => { setMode('template'); setError(null) }}
                >
                    ارسال با قالب
                </button>
                <button
                    type="button"
                    className={`${styles.modeBtn} ${!isTemplate ? styles.modeBtnActive : ''}`}
                    onClick={() => { setMode('free'); setError(null) }}
                >
                    متن آزاد
                </button>
            </div>

            <div className={styles.topRow}>
                {isTemplate ? (
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
                ) : (
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>دسته‌ی اعلان</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={free.type}
                                onChange={(e) =>
                                    setFree((f) => ({ ...f, type: e.target.value }))
                                }
                            >
                                {Object.entries(NOTIFICATION_TYPES).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                )}

                <UserPicker
                    value={recipientIds}
                    onChange={setRecipientIds}
                    disabled={broadcast}
                    label="گیرندگان"
                />
            </div>

            {/* متغیرهای قالب — فقط اگر قالب انتخاب‌شده متغیر داشته باشد */}
            {/* فیلدهای متن آزاد — فقط در حالت بدون قالب */}
            {!isTemplate && (
                <div className={styles.freeBlock}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>عنوان (اختیاری)</span>
                        <input
                            className={styles.fieldInput}
                            value={free.title}
                            onChange={(e) =>
                                setFree((f) => ({ ...f, title: e.target.value }))
                            }
                            placeholder="به‌روزرسانی سامانه"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>متن پیام</span>
                        <textarea
                            className={styles.freeArea}
                            value={free.body}
                            onChange={(e) =>
                                setFree((f) => ({ ...f, body: e.target.value }))
                            }
                            rows={4}
                            placeholder="متنی که کاربر در اعلان‌هایش می‌بیند"
                        />
                    </label>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={free.sms}
                            onChange={(e) =>
                                setFree((f) => ({ ...f, sms: e.target.checked }))
                            }
                        />
                        <span>پیامک هم فرستاده شود</span>
                    </label>

                    {free.sms && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>
                                متن پیامک (کوتاه‌تر از متن اعلان)
                            </span>
                            <textarea
                                className={styles.freeArea}
                                value={free.sms_body}
                                onChange={(e) =>
                                    setFree((f) => ({ ...f, sms_body: e.target.value }))
                                }
                                rows={2}
                            />
                        </label>
                    )}
                </div>
            )}

            {isTemplate && variables.length > 0 && (
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
