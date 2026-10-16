import { useMemo, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import styles from './InvoiceForm.module.css'

/**
 * فرم صدور فاکتور — مطابق `InvoiceAdminCreate` در اسپک ۲۲.
 *
 * ⚠️ فرم قبلی از فیگما آمده بود (شماره سریال، نوع پلن، شناسه پرداخت،
 * شماره MK) ولی **هیچ‌کدام از آن فیلدها در اسکمای بک‌اند نیستند**.
 * سریال و شناسه‌ی پرداخت را خود سرور می‌سازد. اگر همان فرم را وصل
 * می‌کردیم، هر بار ۴۲۲ می‌گرفت.
 *
 * چیزی که بک‌اند واقعاً می‌خواهد: کاربر، نوع فاکتور، و دست‌کم یک قلم.
 *
 * مبالغ عمداً محاسبه می‌شوند نه دستی: `subtotal` جمع اقلام است و
 * `total = subtotal - discount + tax`. اگر کاربر این‌ها را دستی وارد
 * کند، فاکتوری صادر می‌شود که جمعش با اقلامش نمی‌خواند.
 */
const INVOICE_TYPES = [
    { value: 'proforma', label: 'پیش‌فاکتور' },
    { value: 'invoice', label: 'فاکتور' },
]

const emptyItem = () => ({ title: '', quantity: '1', unit_price: '' })

/* ورودی از `useAdminUsers` می‌آید که ردیفِ تبدیل‌شده می‌دهد
   (نه `UserResponseSchema` خام)، پس `username` و `email` از قبل
   استخراج شده‌اند. مقدار تهی در آن ردیف '—' است نه رشته‌ی خالی. */
const real = (v) => (v && v !== '—' ? v : '')

const userLabel = (u) =>
    real(u.username) || real(u.email) || `کاربر ${u.id}`

/* ورودی کاربر ممکن است رقم فارسی باشد */
const toLatinDigits = (s) =>
    String(s ?? '')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

const num = (v) => {
    const n = Number(toLatinDigits(v).replace(/[,٬\s]/g, ''))
    return Number.isFinite(n) ? n : 0
}

export default function InvoiceForm({
    users = [],
    usersLoading = false,
    saving = false,
    fieldErrors = {},
    onSubmit,
    onClose,
    onFieldChange,
}) {
    const [form, setForm] = useState({
        user_id: '',
        invoice_type: 'proforma',
        note: '',
        discount_amount: '',
        tax_amount: '',
    })
    const [items, setItems] = useState([emptyItem()])

    const change = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }))
        if (fieldErrors[key]) onFieldChange?.(key)
    }

    const changeItem = (i, key) => (e) => {
        const v = e.target.value
        setItems((prev) => prev.map((it, n) => (n === i ? { ...it, [key]: v } : it)))
        if (fieldErrors.items) onFieldChange?.('items')
    }

    const addItem = () => setItems((prev) => [...prev, emptyItem()])
    const removeItem = (i) =>
        setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, n) => n !== i)))

    const totals = useMemo(() => {
        const subtotal = items.reduce(
            (sum, it) => sum + num(it.quantity) * num(it.unit_price),
            0
        )
        const discount = num(form.discount_amount)
        const tax = num(form.tax_amount)
        return { subtotal, discount, tax, total: subtotal - discount + tax }
    }, [items, form.discount_amount, form.tax_amount])

    const submit = (e) => {
        e.preventDefault()
        onSubmit?.({
            user_id: Number(toLatinDigits(form.user_id)),
            invoice_type: form.invoice_type,
            note: form.note.trim() || null,
            items: items.map((it) => ({
                title: it.title.trim(),
                quantity: num(it.quantity),
                unit_price: num(it.unit_price),
            })),
            subtotal_amount: totals.subtotal,
            discount_amount: totals.discount,
            tax_amount: totals.tax,
            total_amount: totals.total,
        })
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

            <h2 className={styles.title}>صدور فاکتور</h2>

            <div className={styles.grid}>
                <div className={styles.fieldWrapper}>
                    <label
                        className={`${styles.field} ${
                            fieldErrors.user_id ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.fieldLabel}>کاربر</span>
                        <select
                            className={styles.fieldInput}
                            value={form.user_id}
                            onChange={change('user_id')}
                            aria-invalid={Boolean(fieldErrors.user_id)}
                        >
                            <option value="">
                                {usersLoading ? 'در حال دریافت…' : 'انتخاب کنید'}
                            </option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {userLabel(u)}
                                </option>
                            ))}
                        </select>
                    </label>
                    {fieldErrors.user_id && (
                        <p className={styles.errorText} role="alert">
                            {fieldErrors.user_id}
                        </p>
                    )}
                </div>

                <div className={styles.fieldWrapper}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>نوع فاکتور</span>
                        <select
                            className={styles.fieldInput}
                            value={form.invoice_type}
                            onChange={change('invoice_type')}
                        >
                            {INVOICE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {/* اقلام فاکتور */}
            <div className={styles.itemsHead}>
                <span className={styles.itemsTitle}>اقلام فاکتور</span>
                <button type="button" className={styles.addBtn} onClick={addItem}>
                    <Plus size={14} />
                    افزودن قلم
                </button>
            </div>

            {fieldErrors.items && (
                <p className={styles.errorText} role="alert">
                    {fieldErrors.items}
                </p>
            )}

            <ul className={styles.items}>
                {items.map((it, i) => (
                    <li key={i} className={styles.item}>
                        <label className={styles.itemField}>
                            <span className={styles.fieldLabel}>عنوان</span>
                            <input
                                className={styles.fieldInput}
                                value={it.title}
                                onChange={changeItem(i, 'title')}
                            />
                        </label>

                        <label className={styles.itemQty}>
                            <span className={styles.fieldLabel}>تعداد</span>
                            <input
                                className={styles.fieldInput}
                                value={it.quantity}
                                onChange={changeItem(i, 'quantity')}
                                dir="ltr"
                                inputMode="numeric"
                            />
                        </label>

                        <label className={styles.itemPrice}>
                            <span className={styles.fieldLabel}>قیمت واحد (ریال)</span>
                            <input
                                className={styles.fieldInput}
                                value={it.unit_price}
                                onChange={changeItem(i, 'unit_price')}
                                dir="ltr"
                                inputMode="numeric"
                            />
                        </label>

                        <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                            aria-label="حذف قلم"
                        >
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
            </ul>

            <div className={styles.grid}>
                <div className={styles.fieldWrapper}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>تخفیف (ریال)</span>
                        <input
                            className={styles.fieldInput}
                            value={form.discount_amount}
                            onChange={change('discount_amount')}
                            dir="ltr"
                            inputMode="numeric"
                        />
                    </label>
                </div>

                <div className={styles.fieldWrapper}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>مالیات (ریال)</span>
                        <input
                            className={styles.fieldInput}
                            value={form.tax_amount}
                            onChange={change('tax_amount')}
                            dir="ltr"
                            inputMode="numeric"
                        />
                    </label>
                </div>
            </div>

            <div className={styles.fieldWrapper}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>یادداشت (اختیاری)</span>
                    <input
                        className={styles.fieldInput}
                        value={form.note}
                        onChange={change('note')}
                    />
                </label>
            </div>

            {/* جمع‌ها محاسبه‌شده‌اند، نه ورودی */}
            <dl className={styles.totals}>
                <div className={styles.totalRow}>
                    <dt>جمع اقلام</dt>
                    <dd>{totals.subtotal.toLocaleString('fa-IR')} ریال</dd>
                </div>
                <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                    <dt>مبلغ نهایی</dt>
                    <dd>{totals.total.toLocaleString('fa-IR')} ریال</dd>
                </div>
            </dl>

            <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'در حال صدور…' : 'صدور فاکتور الکترونیکی'}
            </button>
        </form>
    )
}
