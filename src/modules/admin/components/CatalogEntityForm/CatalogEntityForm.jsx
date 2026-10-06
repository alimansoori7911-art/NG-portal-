import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import styles from './CatalogEntityForm.module.css'

/* نوع مقدار ویژگی — `CreateFeature.value_type` در اسپک enum ندارد و
   فقط `string` است، پس این فهرست یک **پیشنهاد** است نه محدودیت.
   مقداری که بک‌اند بفرستد و اینجا نباشد هم نمایش داده می‌شود. */
const VALUE_TYPES = {
    boolean: 'بله / خیر',
    number: 'عدد',
    text: 'متن',
}

/* فیلدهای هر موجودیت.

   ⚠️ عنوان دسته‌بندی `title` است ولی محصول و ویژگی `name` دارند —
   اسپک این‌طور است و یکی‌کردنشان در فرانت یعنی ۴۲۲ گرفتن. */
const SHAPES = {
    product: {
        title: 'محصول',
        required: ['code', 'slug', 'name'],
    },
    category: {
        title: 'دسته‌بندی',
        required: ['code', 'title'],
    },
    feature: {
        title: 'ویژگی',
        required: ['code', 'name', 'value_type'],
    },
    version: {
        title: 'نسخه',
        required: ['version'],
    },
}

const emptyFor = (kind, entity) => {
    if (kind === 'product') {
        return {
            code: entity?.code ?? '',
            slug: entity?.slug ?? '',
            name: entity?.name ?? '',
            description: entity?.description ?? '',
            category_id: entity?.category_id != null ? String(entity.category_id) : '',
            is_active: entity?.is_active ?? true,
            is_public: entity?.is_public ?? true,
            sort_order: String(entity?.sort_order ?? 0),
        }
    }
    if (kind === 'category') {
        return {
            code: entity?.code ?? '',
            title: entity?.title ?? '',
            description: entity?.description ?? '',
            is_active: entity?.is_active ?? true,
            sort_order: String(entity?.sort_order ?? 0),
        }
    }
    if (kind === 'feature') {
        return {
            code: entity?.code ?? '',
            name: entity?.name ?? '',
            description: entity?.description ?? '',
            value_type: entity?.value_type ?? 'boolean',
            is_active: entity?.is_active ?? true,
            sort_order: String(entity?.sort_order ?? 0),
        }
    }
    return {
        version: entity?.version ?? '',
        release_date: entity?.release_date ?? '',
        changelog: entity?.changelog ?? '',
        is_release: entity?.is_release ?? true,
    }
}

/**
 * فرم مشترک محصول، دسته‌بندی، ویژگی و نسخه.
 *
 * یکی‌بودنشان عمدی است: هر چهار موجودیت همان ساختار را دارند
 * (کد + عنوان + توضیح + فعال/غیرفعال + ترتیب) و چهار فرم جدا یعنی
 * چهار جا برای از هم دور افتادن.
 *
 * `kind`: product | category | feature | version
 */
export default function CatalogEntityForm({
    kind,
    entity = null,
    categories = [],
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const editing = Boolean(entity)
    const shape = SHAPES[kind]

    const [form, setForm] = useState(() => emptyFor(kind, entity))
    const [fieldErrors, setFieldErrors] = useState({})

    const set = (key) => (e) => {
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm((p) => ({ ...p, [key]: value }))
        setFieldErrors((p) => {
            const n = { ...p }
            delete n[key]
            return n
        })
    }

    const submit = (e) => {
        e.preventDefault()

        const errs = {}
        for (const k of shape.required) {
            if (!String(form[k] ?? '').trim()) errs[k] = true
        }

        /* ترتیب باید عدد باشد؛ متن آزاد ۴۲۲ می‌گیرد */
        if ('sort_order' in form && form.sort_order.trim()) {
            const n = Number(form.sort_order)
            if (!Number.isInteger(n) || n < 0) errs.sort_order = true
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        const trimOrNull = (v) => (String(v ?? '').trim() ? String(v).trim() : null)
        const payload = {}

        for (const [k, v] of Object.entries(form)) {
            if (typeof v === 'boolean') payload[k] = v
            else if (k === 'sort_order') payload[k] = Number(v || 0)
            else if (k === 'category_id') {
                /* خالی یعنی «بدون دسته»، که در اسپک `null` است نه '' */
                payload[k] = v ? Number(v) : null
            } else if (shape.required.includes(k)) payload[k] = String(v).trim()
            else payload[k] = trimOrNull(v)
        }

        onSubmit?.(payload)
    }

    const field = (key, label, extra = {}) => (
        <label
            className={`${styles.field} ${fieldErrors[key] ? styles.fieldError : ''}`}
        >
            <span className={styles.label}>{label}</span>
            <input
                className={styles.input}
                value={form[key] ?? ''}
                onChange={set(key)}
                {...extra}
            />
        </label>
    )

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
                {editing ? `ویرایش ${shape.title}` : `ساخت ${shape.title}`}
            </h2>

            <div className={styles.body}>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                {kind === 'version' ? (
                    <>
                        <div className={styles.row}>
                            {field('version', 'شماره نسخه', {
                                placeholder: '2.4.0',
                                dir: 'ltr',
                            })}
                            {field('release_date', 'تاریخ انتشار (۲۰۲۶-۱۰-۰۱)', {
                                placeholder: '2026-10-01',
                                dir: 'ltr',
                            })}
                        </div>

                        <label className={styles.field}>
                            <span className={styles.label}>شرح تغییرات</span>
                            <textarea
                                className={styles.textarea}
                                value={form.changelog}
                                onChange={set('changelog')}
                                rows={4}
                                placeholder="چه چیزی در این نسخه عوض شده است؟"
                            />
                        </label>

                        <div className={styles.checkBox}>
                            <label className={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={form.is_release}
                                    onChange={set('is_release')}
                                />
                                <span>نسخه‌ی نهایی است (نه آزمایشی)</span>
                            </label>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.row}>
                            {field('code', 'کد', {
                                placeholder: kind === 'product' ? 'NGC' : 'erp',
                                dir: 'ltr',
                            })}

                            {kind === 'category'
                                ? field('title', 'عنوان', { placeholder: 'زیرساخت' })
                                : field('name', 'نام', { placeholder: 'NG Corion' })}
                        </div>

                        {kind === 'product' && (
                            <div className={styles.row}>
                                {field('slug', 'نشانی (slug)', {
                                    placeholder: 'ng-corion',
                                    dir: 'ltr',
                                })}

                                <label className={styles.field}>
                                    <span className={styles.label}>دسته‌بندی</span>
                                    <div className={styles.selectRow}>
                                        <select
                                            className={styles.select}
                                            value={form.category_id}
                                            onChange={set('category_id')}
                                        >
                                            <option value="">بدون دسته</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.title}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={18}
                                            className={styles.selectIcon}
                                        />
                                    </div>
                                </label>
                            </div>
                        )}

                        {kind === 'feature' && (
                            <label className={styles.field}>
                                <span className={styles.label}>نوع مقدار</span>
                                <div className={styles.selectRow}>
                                    <select
                                        className={styles.select}
                                        value={form.value_type}
                                        onChange={set('value_type')}
                                    >
                                        {Object.entries(VALUE_TYPES).map(([v, l]) => (
                                            <option key={v} value={v}>
                                                {l}
                                            </option>
                                        ))}
                                        {/* مقداری که بک‌اند داده و در فهرست
                                            ما نیست نباید گم شود */}
                                        {!VALUE_TYPES[form.value_type] && (
                                            <option value={form.value_type}>
                                                {form.value_type}
                                            </option>
                                        )}
                                    </select>
                                    <ChevronDown size={18} className={styles.selectIcon} />
                                </div>
                            </label>
                        )}

                        <label className={styles.field}>
                            <span className={styles.label}>توضیح (اختیاری)</span>
                            <input
                                className={styles.input}
                                value={form.description}
                                onChange={set('description')}
                            />
                        </label>

                        <div className={styles.row}>
                            {field('sort_order', 'ترتیب نمایش', {
                                inputMode: 'numeric',
                                dir: 'ltr',
                            })}

                            <div className={styles.checkBox}>
                                <label className={styles.checkRow}>
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={set('is_active')}
                                    />
                                    <span>فعال</span>
                                </label>

                                {kind === 'product' && (
                                    <label className={styles.checkRow}>
                                        <input
                                            type="checkbox"
                                            checked={form.is_public}
                                            onChange={set('is_public')}
                                        />
                                        <span>در سایت دیده شود</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {editing && (kind === 'product' || kind === 'category') && (
                    <p className={styles.hint}>
                        ⚠️ تغییر کد{kind === 'product' ? ' یا نشانی' : ''} ممکن است
                        ارجاع‌های بیرونی را بشکند. فقط وقتی عوضش کنید که مطمئن
                        باشید جایی به آن وابسته نیست.
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="submit" className={styles.submit} disabled={busy}>
                        {busy
                            ? 'در حال ذخیره…'
                            : editing
                              ? 'ذخیره تغییرات'
                              : `ساخت ${shape.title}`}
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
