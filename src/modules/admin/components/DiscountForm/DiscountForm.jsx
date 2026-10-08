import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import {
    DISCOUNT_TYPE,
    DISCOUNT_TARGET,
} from '../../../../services/discountService'
import UserPicker from '../UserPicker/UserPicker'
import { jalaliToISO, formatJalaliDateTime } from '../../../../utils/datetime'
import styles from './DiscountForm.module.css'

/**
 * ساخت و ویرایش کد تخفیف.
 *
 * `discount` که داده شود یعنی ویرایش؛ خالی یعنی ساخت.
 *
 * ⚠️ در حالت ویرایش، `code` و `discount_type` غیرفعال‌اند:
 * `DiscountUpdate` آن‌ها را نمی‌پذیرد، چون کد ممکن است دست کاربر
 * باشد و عوض کردنش یعنی کدی که قبلاً داده شده دیگر کار نکند.
 */
export default function DiscountForm({
    discount = null,
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const editing = Boolean(discount)

    const [form, setForm] = useState({
        code: discount?.code ?? '',
        discount_type: discount?.discount_type ?? 'PERCENT',
        value: discount?.value != null ? String(discount.value) : '',
        /* تاریخ شمسی نشان داده می‌شود و موقع ارسال به ISO تبدیل می‌شود */
        valid_until: discount?.valid_until
            ? formatJalaliDateTime(discount.valid_until).date
            : '',
        max_usage: discount?.max_usage != null ? String(discount.max_usage) : '',
        target_type: discount?.target_type ?? 'ALL',
        comment: discount?.comment ?? '',
        send_notification: false,
    })
    const [targetUserIds, setTargetUserIds] = useState([])
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

    const isPercent = form.discount_type === 'PERCENT'
    const needsUsers = form.target_type === 'USER'

    const submit = (e) => {
        e.preventDefault()

        const errs = {}
        if (!editing && !form.code.trim()) errs.code = true

        const value = Number(form.value)
        if (!form.value.trim() || !Number.isFinite(value) || value <= 0) {
            errs.value = true
        } else if (isPercent && value > 100) {
            /* درصد بیش از صد یعنی تخفیف بزرگ‌تر از خود مبلغ */
            errs.value = true
        }

        const validUntilIso = jalaliToISO(form.valid_until)
        if (!validUntilIso) errs.valid_until = true

        if (form.max_usage.trim()) {
            const n = Number(form.max_usage)
            if (!Number.isInteger(n) || n < 1) errs.max_usage = true
        }

        /* دامنه‌ی «کاربران مشخص» بدون کاربر یعنی کدی که به هیچ‌کس
           نمی‌رسد — بک‌اند خطا نمی‌دهد ولی نتیجه بی‌معناست. */
        const targetIds = targetUserIds
        if (needsUsers && targetIds.length === 0) errs.target = true

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        const payload = {
            value,
            valid_until: validUntilIso,
            max_usage: form.max_usage.trim() ? Number(form.max_usage) : null,
            target_type: form.target_type,
            target_user_public_ids: needsUsers ? targetIds : null,
            comment: form.comment.trim() || null,
        }

        /* کد و نوع فقط هنگام ساخت فرستاده می‌شوند */
        if (!editing) {
            payload.code = form.code.trim().toUpperCase()
            payload.discount_type = form.discount_type
            payload.send_notification = form.send_notification
        }

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
                {editing ? 'ویرایش کد تخفیف' : 'صدور کد تخفیف'}
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
                            fieldErrors.code ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            کد تخفیف {editing && '(قابل تغییر نیست)'}
                        </span>
                        <input
                            className={styles.input}
                            value={form.code}
                            onChange={set('code')}
                            disabled={editing}
                            placeholder="NOWRUZ1405"
                            dir="ltr"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>
                            نوع تخفیف {editing && '(قابل تغییر نیست)'}
                        </span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.discount_type}
                                onChange={set('discount_type')}
                                disabled={editing}
                            >
                                {Object.entries(DISCOUNT_TYPE).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.value ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            {isPercent ? 'درصد تخفیف (۱ تا ۱۰۰)' : 'مبلغ تخفیف (تومان)'}
                        </span>
                        <input
                            className={styles.input}
                            value={form.value}
                            onChange={set('value')}
                            inputMode="numeric"
                            placeholder={isPercent ? '۲۰' : '۱۰۰۰۰۰'}
                            dir="ltr"
                        />
                    </label>

                    <label
                        className={`${styles.field} ${
                            fieldErrors.valid_until ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            معتبر تا (۱۴۰۵/۰۶/۳۱)
                        </span>
                        <input
                            className={styles.input}
                            value={form.valid_until}
                            onChange={set('valid_until')}
                            placeholder="۱۴۰۵/۰۶/۳۱"
                            dir="ltr"
                        />
                    </label>
                </div>

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.max_usage ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            حداکثر دفعات استفاده (خالی = نامحدود)
                        </span>
                        <input
                            className={styles.input}
                            value={form.max_usage}
                            onChange={set('max_usage')}
                            inputMode="numeric"
                            placeholder="۱۰۰"
                            dir="ltr"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>برای چه کسانی</span>
                        <div className={styles.selectRow}>
                            <select
                                className={styles.select}
                                value={form.target_type}
                                onChange={set('target_type')}
                            >
                                {Object.entries(DISCOUNT_TARGET).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className={styles.selectIcon} />
                        </div>
                    </label>
                </div>

                {/* ✅ اسپک ۲۱ `public_id` را به فهرست کاربران اضافه کرد،
                    پس دیگر لازم نیست ادمین UUID را دستی رونویسی کند.
                    `idField` به انتخابگر می‌گوید به‌جای `id` عددی،
                    همان `public_id` را برگرداند — چیزی که
                    `DiscountCreate.target_user_public_ids` می‌خواهد. */}
                {needsUsers && (
                    <div
                        className={fieldErrors.target ? styles.pickerError : undefined}
                    >
                        <UserPicker
                            value={targetUserIds}
                            onChange={(ids) => {
                                setTargetUserIds(ids)
                                setFieldErrors((prev) => {
                                    const next = { ...prev }
                                    delete next.target
                                    return next
                                })
                            }}
                            idField="public_id"
                            label="کاربران هدف"
                            placeholder="نام یا ایمیل کاربر را بنویسید…"
                        />
                    </div>
                )}

                <label className={styles.field}>
                    <span className={styles.label}>
                        نام یا دلیل تخفیف (اختیاری)
                    </span>
                    <input
                        className={styles.input}
                        value={form.comment}
                        onChange={set('comment')}
                        placeholder="جشنواره نوروز"
                    />
                </label>

                {!editing && (
                    <div className={styles.checkBox}>
                        <label className={styles.checkRow}>
                            <input
                                type="checkbox"
                                checked={form.send_notification}
                                onChange={set('send_notification')}
                            />
                            <span>اعلان صدور کد به گیرندگان فرستاده شود</span>
                        </label>
                    </div>
                )}

                <p className={styles.hint}>
                    کد با حروف بزرگ ذخیره می‌شود. پس از صدور، خودِ کد و نوع
                    تخفیف قابل تغییر نیستند چون ممکن است در دست کاربران باشد.
                </p>

                <div className={styles.actions}>
                    <button type="submit" className={styles.submit} disabled={busy}>
                        {busy
                            ? 'در حال ذخیره…'
                            : editing
                              ? 'ذخیره تغییرات'
                              : 'صدور کد'}
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
