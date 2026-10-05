import { useState } from 'react'
import { X, Plus, Trash2, Type, Image, LayoutGrid, MousePointerClick, FileText } from 'lucide-react'
import RichTextEditor from '../../../../components/ui/RichTextEditor/RichTextEditor'
import styles from './CmsBlockEditor.module.css'

/* آیکون هر نوع بلوک — `BlockType` پنج مقدار ثابت دارد. */
const BLOCK_ICON = {
    TEXT: Type,
    RICH_TEXT: FileText,
    IMAGE: Image,
    CARD_LIST: LayoutGrid,
    CTA: MousePointerClick,
}

/* برچسب فارسی نوع بلوک */
const BLOCK_LABEL = {
    TEXT: 'متن ساده',
    RICH_TEXT: 'متن غنی',
    IMAGE: 'تصویر',
    CARD_LIST: 'فهرست کارت',
    CTA: 'دکمه‌ی اقدام',
}

/* برچسب فارسی نام فیلد.

   بک‌اند نام فیلد را انگلیسی و ماشینی می‌دهد (`heading`, `og_image_url`).
   نمایش خامش به ادمین فارسی‌زبان بی‌معناست، ولی چون `kind` و نام‌ها
   enum ندارند و بک‌اند می‌تواند هر چیزی بفرستد، این جدول فقط یک
   «بهبود» است: نامی که نشناسیم، خودش نمایش داده می‌شود. */
const FIELD_LABEL = {
    heading: 'عنوان',
    subheading: 'زیرعنوان',
    title: 'عنوان',
    section_title: 'عنوان بخش',
    body: 'متن',
    description: 'توضیح',
    label: 'برچسب دکمه',
    url: 'نشانی',
    image_url: 'نشانی تصویر',
    icon_url: 'نشانی آیکون',
    alt: 'توضیح تصویر',
    variant: 'گونه',
}

const fieldLabel = (name) => FIELD_LABEL[name] ?? name

/**
 * یک فیلد — نوعِ ورودی از `kind` می‌آید.
 *
 * ⚠️ `kind` در اسپک enum **ندارد** و فقط `string` است، یعنی بک‌اند
 * می‌تواند مقداری بفرستد که نمی‌شناسیم. پس حالت پیش‌فرض یک input
 * ساده است: فیلد ناشناخته باید قابل ویرایش بماند، نه این‌که ناپدید
 * شود یا فرم را بشکند.
 */
function BlockField({ spec, value, onChange, disabled, error }) {
    const label = fieldLabel(spec.name)
    const kind = String(spec.kind ?? '').toLowerCase()

    /* متن غنی ویرایشگر کامل می‌گیرد */
    if (kind === 'rich_text' || kind === 'html') {
        return (
            <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>
                    {label}
                    {spec.required && <span className={styles.req}>*</span>}
                </span>
                <RichTextEditor
                    value={value ?? ''}
                    onChange={onChange}
                    disabled={disabled}
                    error={Boolean(error)}
                    placeholder={`${label} را بنویسید…`}
                />
                {error && <span className={styles.fieldError}>{error}</span>}
            </div>
        )
    }

    const isTextarea = kind === 'textarea' || kind === 'long_text'
    /* نشانی همیشه چپ‌به‌راست است، حتی در صفحه‌ی راست‌به‌چپ */
    const isUrl = kind === 'url' || kind === 'image' || spec.name.endsWith('_url')

    return (
        <label className={`${styles.field} ${error ? styles.fieldInvalid : ''}`}>
            <span className={styles.label}>
                {label}
                {spec.required && <span className={styles.req}>*</span>}
                {spec.max_length && (
                    <span className={styles.counter}>
                        {(value ?? '').length.toLocaleString('fa-IR')}/
                        {spec.max_length.toLocaleString('fa-IR')}
                    </span>
                )}
            </span>

            {isTextarea ? (
                <textarea
                    className={styles.textarea}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    maxLength={spec.max_length ?? undefined}
                    rows={3}
                />
            ) : (
                <input
                    className={styles.input}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    maxLength={spec.max_length ?? undefined}
                    dir={isUrl ? 'ltr' : undefined}
                    placeholder={isUrl ? 'https://…' : undefined}
                />
            )}

            {error && <span className={styles.fieldError}>{error}</span>}

            {/* اندازه‌های مجاز تصویر — راهنما، نه محدودیت اجباری */}
            {spec.allowed_sizes?.length > 0 && (
                <span className={styles.hint}>
                    اندازه‌ی پیشنهادی:{' '}
                    {spec.allowed_sizes.map((n) => n.toLocaleString('fa-IR')).join(' · ')}{' '}
                    پیکسل
                </span>
            )}
        </label>
    )
}

/**
 * ویرایشگر بلوک‌های صفحه‌ی ساختاریافته.
 *
 * فرم **از روی قالبی که بک‌اند می‌دهد ساخته می‌شود**، نه از روی یک
 * ساختار ثابت در فرانت. توضیح خود اسپک برای `structured-schemas` همین
 * است: «تا ویرایشگر فرم درست را بسازد و فیلدی که بک‌اند قبول نمی‌کند
 * پیشنهاد ندهد.» یعنی اگر بک‌اند فردا بلوکی اضافه کند، این صفحه
 * بدون تغییر کد نشانش می‌دهد.
 *
 * ⚠️ بلوکی که `editable: false` باشد فقط خوانده می‌شود — ورودی‌هایش
 * غیرفعالند و در ذخیره هم فرستاده نمی‌شوند.
 */
export default function CmsBlockEditor({
    page,
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    /* حالت اولیه از مقادیر ذخیره‌شده‌ای که همراه قالب آمده‌اند */
    const [blocks, setBlocks] = useState(() =>
        (page.editable_blocks ?? []).map((b) => ({
            key: b.key,
            fields: Object.fromEntries(
                (b.fields ?? []).map((f) => [f.name, f.value ?? ''])
            ),
            items: (b.items?.values ?? []).map((it) => ({ ...it })),
        }))
    )
    const [fieldErrors, setFieldErrors] = useState({})

    const specOf = (key) =>
        (page.editable_blocks ?? []).find((b) => b.key === key)

    const setField = (blockKey, name, value) => {
        setBlocks((prev) =>
            prev.map((b) =>
                b.key === blockKey
                    ? { ...b, fields: { ...b.fields, [name]: value } }
                    : b
            )
        )
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[`${blockKey}.${name}`]
            return next
        })
    }

    const setItemField = (blockKey, index, name, value) => {
        setBlocks((prev) =>
            prev.map((b) =>
                b.key === blockKey
                    ? {
                          ...b,
                          items: b.items.map((it, i) =>
                              i === index ? { ...it, [name]: value } : it
                          ),
                      }
                    : b
            )
        )
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[`${blockKey}.items.${index}.${name}`]
            return next
        })
    }

    const addItem = (blockKey) => {
        const spec = specOf(blockKey)
        setBlocks((prev) =>
            prev.map((b) => {
                if (b.key !== blockKey) return b
                /* سقف از قالب می‌آید؛ بیشتر از آن را بک‌اند رد می‌کند */
                if (b.items.length >= (spec?.items?.max_items ?? Infinity)) return b

                const blank = Object.fromEntries(
                    (spec?.items?.fields ?? []).map((f) => [f.name, ''])
                )
                return { ...b, items: [...b.items, blank] }
            })
        )
    }

    const removeItem = (blockKey, index) => {
        setBlocks((prev) =>
            prev.map((b) =>
                b.key === blockKey
                    ? { ...b, items: b.items.filter((_, i) => i !== index) }
                    : b
            )
        )
        /* خطاهای همان ردیف باید پاک شوند، وگرنه به ردیف بعدی می‌چسبند */
        setFieldErrors((prev) =>
            Object.fromEntries(
                Object.entries(prev).filter(
                    ([k]) => !k.startsWith(`${blockKey}.items.${index}.`)
                )
            )
        )
    }

    const submit = (e) => {
        e.preventDefault()

        const errs = {}

        for (const block of blocks) {
            const spec = specOf(block.key)
            if (!spec?.editable) continue

            for (const f of spec.fields ?? []) {
                if (f.required && !String(block.fields[f.name] ?? '').trim()) {
                    errs[`${block.key}.${f.name}`] = 'این فیلد الزامی است'
                }
            }

            block.items.forEach((item, i) => {
                for (const f of spec.items?.fields ?? []) {
                    if (f.required && !String(item[f.name] ?? '').trim()) {
                        errs[`${block.key}.items.${i}.${f.name}`] =
                            'این فیلد الزامی است'
                    }
                }
            })
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        /* `CmsBlockIn` فقط `key` و `fields` و `items` می‌گیرد، نه
           `type` و نه `version`.

           ⚠️ بلوک‌های **غیرقابل‌ویرایش هم فرستاده می‌شوند** — با همان
           مقدار دست‌نخورده. اسپک نمی‌گوید `PUT` آرایه‌ی بلوک‌ها را
           ادغام می‌کند یا جایگزین؛ اگر جایگزین کند و ما بلوک قفل‌شده
           را نفرستیم، محتوایش **پاک می‌شود**. فرستادنِ بدون‌تغییرش در
           هر دو حالت بی‌خطر است. */
        const payload = blocks.map((b) => ({
            key: b.key,
            fields: b.fields,
            /* `items` برای بلوک غیرتکرارشونده باید null بماند */
            items: specOf(b.key)?.items
                ? b.items.map((fields) => ({ fields }))
                : null,
        }))

        onSubmit?.({ blocks: payload })
    }

    return (
        <form className={styles.wrapper} onSubmit={submit} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن ویرایشگر"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>ویرایش «{page.title}»</h2>

            <div className={styles.body}>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <p className={styles.intro}>
                    این صفحه قالب ثابت دارد: فقط فیلدهای زیر قابل تغییرند و
                    چیدمانشان سمت سایت مشخص شده است.
                </p>

                {(page.editable_blocks ?? []).map((spec) => {
                    const block = blocks.find((b) => b.key === spec.key)
                    if (!block) return null

                    const Icon = BLOCK_ICON[spec.type] ?? Type
                    const locked = !spec.editable
                    const maxItems = spec.items?.max_items ?? 0
                    const atMax = block.items.length >= maxItems

                    return (
                        <section key={spec.key} className={styles.block}>
                            <header className={styles.blockHead}>
                                <span className={styles.blockName}>
                                    <Icon size={15} aria-hidden="true" />
                                    {spec.key}
                                </span>

                                <span className={styles.blockType}>
                                    {BLOCK_LABEL[spec.type] ?? spec.type}
                                </span>

                                {locked && (
                                    <span className={styles.lockTag}>فقط خواندنی</span>
                                )}
                            </header>

                            <div className={styles.fields}>
                                {(spec.fields ?? []).map((f) => (
                                    <BlockField
                                        key={f.name}
                                        spec={f}
                                        value={block.fields[f.name]}
                                        disabled={locked || busy}
                                        error={fieldErrors[`${spec.key}.${f.name}`]}
                                        onChange={(v) => setField(spec.key, f.name, v)}
                                    />
                                ))}
                            </div>

                            {/* ── ردیف‌های تکرارشونده ── */}
                            {spec.items && (
                                <div className={styles.items}>
                                    <div className={styles.itemsHead}>
                                        <span className={styles.itemsTitle}>
                                            ردیف‌ها
                                        </span>
                                        <span className={styles.itemsCount}>
                                            {block.items.length.toLocaleString('fa-IR')}{' '}
                                            از {maxItems.toLocaleString('fa-IR')}
                                        </span>
                                    </div>

                                    {block.items.length === 0 && (
                                        <p className={styles.itemsEmpty}>
                                            هنوز ردیفی اضافه نشده است.
                                        </p>
                                    )}

                                    {block.items.map((item, i) => (
                                        <div key={i} className={styles.item}>
                                            <div className={styles.itemHead}>
                                                <span className={styles.itemIndex}>
                                                    ردیف {(i + 1).toLocaleString('fa-IR')}
                                                </span>

                                                {!locked && (
                                                    <button
                                                        type="button"
                                                        className={styles.itemRemove}
                                                        onClick={() =>
                                                            removeItem(spec.key, i)
                                                        }
                                                        disabled={busy}
                                                        aria-label={`حذف ردیف ${i + 1}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className={styles.fields}>
                                                {(spec.items.fields ?? []).map((f) => (
                                                    <BlockField
                                                        key={f.name}
                                                        spec={f}
                                                        value={item[f.name]}
                                                        disabled={locked || busy}
                                                        error={
                                                            fieldErrors[
                                                                `${spec.key}.items.${i}.${f.name}`
                                                            ]
                                                        }
                                                        onChange={(v) =>
                                                            setItemField(
                                                                spec.key,
                                                                i,
                                                                f.name,
                                                                v
                                                            )
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {!locked && (
                                        <button
                                            type="button"
                                            className={styles.addItem}
                                            onClick={() => addItem(spec.key)}
                                            disabled={busy || atMax}
                                            title={
                                                atMax
                                                    ? 'به سقف تعداد ردیف رسیدید'
                                                    : undefined
                                            }
                                        >
                                            <Plus size={15} aria-hidden="true" />
                                            {atMax ? 'سقف ردیف‌ها پر است' : 'افزودن ردیف'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>
                    )
                })}

                <p className={styles.hintBox}>
                    ذخیره، صفحه را <strong>منتشر نمی‌کند</strong>؛ یک نسخه‌ی تازه
                    می‌سازد. برای دیده شدن روی سایت، از فهرست دکمه‌ی «انتشار» را
                    بزنید.
                </p>

                <div className={styles.actions}>
                    <button type="submit" className={styles.submit} disabled={busy}>
                        {busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
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
