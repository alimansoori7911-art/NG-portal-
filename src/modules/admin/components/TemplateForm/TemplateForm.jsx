import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import {
    NOTIFICATION_TYPE,
    NOTIFICATION_CHANNEL,
} from '../../../../services/notificationService'
import styles from './TemplateForm.module.css'

/* کلید قالب باید snake_case باشد — الگوی خود اسپک:
   ^[a-z][a-z0-9_]*$ */
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/

/* نام متغیرهای `{...}` داخل متن.

   بک‌اند `variables` را جدا می‌خواهد و موقع ارسال چک می‌کند که همه‌ی
   آن‌ها در payload باشند. استخراج خودکار از متن یعنی ادمین لازم نیست
   دوباره دستی بنویسدشان و جا انداختن یکی باعث خطای ارسال نشود. */
function extractVariables(...texts) {
    const found = new Set()
    for (const t of texts) {
        for (const m of String(t ?? '').matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g)) {
            found.add(m[1])
        }
    }
    return [...found]
}

/**
 * ساخت و ویرایش قالب اعلان.
 *
 * `template` که داده شود یعنی حالت ویرایش؛ خالی یعنی ساخت.
 *
 * ⚠️ `key` فقط موقع ساخت قابل تنظیم است: `NotificationTemplateUpdate`
 * آن را نمی‌پذیرد چون اعلان‌های موجود با همان کلید به قالب وصل‌اند.
 */
export default function TemplateForm({
    template = null,
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const editing = Boolean(template)

    const [form, setForm] = useState({
        key: template?.key ?? '',
        type: template?.type ?? 'system',
        title: template?.title ?? '',
        body: template?.body ?? '',
        sms_body: template?.sms_body ?? '',
        channels: template?.default_channels ?? ['in_app'],
        is_active: template?.is_active ?? true,
    })
    const [fieldErrors, setFieldErrors] = useState({})

    const set = (key) => (e) => {
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm((prev) => ({ ...prev, [key]: value }))
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }

    const toggleChannel = (channel) => {
        setForm((prev) => ({
            ...prev,
            channels: prev.channels.includes(channel)
                ? prev.channels.filter((c) => c !== channel)
                : [...prev.channels, channel],
        }))
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next.channels
            return next
        })
    }

    const variables = extractVariables(form.title, form.body, form.sms_body)

    const submit = (e) => {
        e.preventDefault()

        const errs = {}
        if (!editing) {
            if (!form.key.trim()) errs.key = true
            else if (!KEY_PATTERN.test(form.key.trim())) errs.key = true
        }
        if (!form.title.trim()) errs.title = true
        if (!form.body.trim()) errs.body = true
        if (form.channels.length === 0) errs.channels = true
        /* کانال پیامک بدون متن پیامک یعنی اعلانی که هیچ‌وقت نمی‌رسد */
        if (form.channels.includes('sms') && !form.sms_body.trim()) {
            errs.sms_body = true
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        const payload = {
            type: form.type,
            title: form.title.trim(),
            body: form.body.trim(),
            sms_body: form.sms_body.trim() || null,
            default_channels: form.channels,
            variables,
            is_active: form.is_active,
        }

        /* کلید فقط هنگام ساخت فرستاده می‌شود */
        if (!editing) payload.key = form.key.trim()

        onSubmit?.(payload)
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

            <h2 className={styles.title}>
                {editing ? 'ویرایش قالب اعلان' : 'ساخت قالب اعلان'}
            </h2>

            <div className={styles.body}>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.key ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            کلید قالب {editing && '(قابل تغییر نیست)'}
                        </span>
                        <input
                            className={styles.input}
                            value={form.key}
                            onChange={set('key')}
                            disabled={editing}
                            placeholder="order_confirmed"
                            dir="ltr"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>نوع اعلان</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.type}
                                onChange={set('type')}
                            >
                                {Object.entries(NOTIFICATION_TYPE).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                <label
                    className={`${styles.field} ${
                        fieldErrors.title ? styles.fieldError : ''
                    }`}
                >
                    <span className={styles.label}>عنوان</span>
                    <input
                        className={styles.input}
                        value={form.title}
                        onChange={set('title')}
                        placeholder="سفارش شما ثبت شد"
                    />
                </label>

                <label
                    className={`${styles.field} ${
                        fieldErrors.body ? styles.fieldError : ''
                    }`}
                >
                    <span className={styles.label}>متن اعلان</span>
                    <textarea
                        className={styles.textarea}
                        value={form.body}
                        onChange={set('body')}
                        placeholder="سفارش {order_number} با موفقیت ثبت شد."
                    />
                </label>

                <label
                    className={`${styles.field} ${
                        fieldErrors.sms_body ? styles.fieldError : ''
                    }`}
                >
                    <span className={styles.label}>
                        متن پیامک {form.channels.includes('sms') && '(الزامی)'}
                    </span>
                    <textarea
                        className={styles.textarea}
                        value={form.sms_body}
                        onChange={set('sms_body')}
                        placeholder="سفارش {order_number} ثبت شد."
                    />
                </label>

                <div
                    className={`${styles.channels} ${
                        fieldErrors.channels ? styles.fieldError : ''
                    }`}
                >
                    {Object.entries(NOTIFICATION_CHANNEL).map(([value, label]) => (
                        <label key={value} className={styles.checkRow}>
                            <input
                                type="checkbox"
                                checked={form.channels.includes(value)}
                                onChange={() => toggleChannel(value)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={set('is_active')}
                        />
                        <span>فعال</span>
                    </label>
                </div>

                <p className={styles.hint}>
                    متغیرها را داخل آکولاد بنویسید، مثل{' '}
                    <span className={styles.hintCode}>{'{order_number}'}</span> —
                    هنگام ارسال مقدارشان پرسیده می‌شود.
                    {variables.length > 0 && (
                        <>
                            {' '}
                            متغیرهای این قالب:{' '}
                            {variables.map((v) => (
                                <span key={v} className={styles.hintCode}>
                                    {v}
                                </span>
                            ))}
                        </>
                    )}
                </p>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className={styles.submit}
                        disabled={busy}
                    >
                        {busy
                            ? 'در حال ذخیره…'
                            : editing
                              ? 'ذخیره تغییرات'
                              : 'ساخت قالب'}
                    </button>

                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={onClose}
                        disabled={busy}
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </form>
    )
}
