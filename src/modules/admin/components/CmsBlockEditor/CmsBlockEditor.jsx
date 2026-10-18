import { useEffect, useMemo, useRef, useState } from 'react'
import { cmsService } from '../../../../services/cmsService'
import { fileService } from '../../../../services/fileService'
import {
    X,
    Plus,
    Trash2,
    Type,
    Image,
    LayoutGrid,
    MousePointerClick,
    FileText,
    ArrowUp,
    ArrowDown,
    MapPin,
    Upload,
} from 'lucide-react'
import RichTextEditor from '../../../../components/ui/RichTextEditor/RichTextEditor'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges'
import { useFileUrl } from '../../../../hooks/useFileUrl'
import { ICON_CHOICES, resolveIcon } from '../../../../utils/iconMap'
import NamedIcon from '../../../../components/ui/icons/NamedIcon'
import {
    BLOCK_TYPE_LABEL,
    blockHint,
    blockName,
    fieldLabel,
} from '../../constants/cmsLabels'
import styles from './CmsBlockEditor.module.css'

/* آیکون هر نوع بلوک — `BlockType` پنج مقدار ثابت دارد. */
const BLOCK_ICON = {
    TEXT: Type,
    RICH_TEXT: FileText,
    IMAGE: Image,
    CARD_LIST: LayoutGrid,
    CTA: MousePointerClick,
}

/* `BlockFieldKind` بک‌اند فقط `TEXT` دارد و «متن بلند» جدا نیست (نوع
   `textarea` فقط در مک بود). پس متن بلند از روی سقف طول یا نام فیلد
   تشخیص داده می‌شود، وگرنه «متن» و «توضیح» یک ورودی یک‌خطی می‌شدند. */
const LONG_TEXT_NAMES = ['body', 'description', 'address', 'subheading']
const LONG_TEXT_MIN = 160

const isLongText = (spec, kind) =>
    kind === 'textarea' ||
    kind === 'long_text' ||
    ((kind === 'text' || kind === '') &&
        (spec.max_length
            ? spec.max_length > LONG_TEXT_MIN
            : LONG_TEXT_NAMES.includes(spec.name)))

/* متن غنیِ «خالی» معمولاً `<p><br></p>` است؛ نباید فیلد الزامی را
   پرشده حساب کند. */
const isBlank = (v) =>
    !String(v ?? '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()

/* نشانی لینک: مسیر داخلی سایت یا نشانی کامل. هر چیز دیگری (مثلاً
   `www.x.com` بدون https) در سایت لینک شکسته می‌سازد. */
const isValidLink = (v) => /^(https?:\/\/|\/|mailto:|tel:|#)/i.test(v.trim())
const isValidImage = (v) => /^(https?:\/\/|\/)/i.test(v.trim())

/* تصویرهای CMS روی سایت عمومی نشان داده می‌شوند؛ SVG عمداً نیست
   چون می‌تواند اسکریپت داشته باشد. سقف حجم مثل رسید پرداخت. */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/* دکمه‌ی آپلود کنار فیلد تصویر.

   ✅ اسپک تازه `POST /admin/cms/pages/{id}/upload-token` را داد: توکن
   یک‌بارمصرف می‌گیریم، فایل را به `/dl/upload` می‌فرستیم و نشانی
   `/dl/{file_id}` را در فیلد می‌گذاریم — همان قالبی که بک‌اند گفت. */
function ImageUpload({ upload, onDone, disabled }) {
    const inputRef = useRef(null)
    const [state, setState] = useState({ busy: false, progress: 0, error: null })

    const pick = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!IMAGE_TYPES.includes(file.type)) {
            setState({ busy: false, progress: 0, error: 'فقط تصویر PNG، JPG یا WebP' })
            return
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setState({ busy: false, progress: 0, error: 'حجم تصویر باید کمتر از ۵ مگابایت باشد' })
            return
        }

        setState({ busy: true, progress: 0, error: null })
        try {
            const url = await upload(file, (progress) =>
                setState((s) => ({ ...s, progress }))
            )
            setState({ busy: false, progress: 0, error: null })
            onDone(url)
        } catch (err) {
            setState({
                busy: false,
                progress: 0,
                error: err?.message || 'آپلود تصویر ناموفق بود',
            })
        }
    }

    return (
        <span className={styles.upload}>
            <input
                ref={inputRef}
                type="file"
                accept={IMAGE_TYPES.join(',')}
                onChange={pick}
                hidden
            />
            <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => inputRef.current?.click()}
                disabled={disabled || state.busy}
            >
                <Upload size={14} aria-hidden="true" />
                {state.busy
                    ? `در حال آپلود… ${state.progress ? `${state.progress.toLocaleString('fa-IR')}٪` : ''}`
                    : 'آپلود تصویر'}
            </button>
            {state.error && <span className={styles.fieldError}>{state.error}</span>}
        </span>
    )
}

/* هر ردیف شناسه‌ی محلی می‌گیرد تا جابه‌جایی ردیف‌ها ویرایشگر متن غنیِ
   ردیف دیگری را جای خودش نشان ندهد. در ذخیره حذف می‌شود. */
let uidSeq = 0
const withUid = (it) => ({ ...it, _uid: ++uidSeq })
const withoutUid = (it) => {
    const { _uid, ...rest } = it
    void _uid
    return rest
}

const snapshot = (blocks) =>
    JSON.stringify(blocks.map((b) => ({ ...b, items: b.items.map(withoutUid) })))

/* ── انتخابگر آیکون ──
   اسم آیکون قبلاً دستی تایپ می‌شد و ادمین نمی‌دانست چه بنویسد. */
function IconPicker({ value, onChange, disabled }) {
    const [open, setOpen] = useState(false)
    const Current = resolveIcon(value)
    const unknown = Boolean(value) && !Current

    return (
        <div className={styles.iconPicker}>
            <div className={styles.iconCurrent}>
                <span className={styles.iconPreview} aria-hidden="true">
                    {Current ? <NamedIcon name={value} size={20} /> : '—'}
                </span>
                <span className={styles.iconName}>
                    {unknown
                        ? `«${value}» شناخته نمی‌شود؛ روی سایت آیکون پیش‌فرض می‌آید`
                        : Current
                          ? ICON_CHOICES.find((c) => c.Icon === Current)?.label ?? value
                          : 'بدون آیکون (آیکون پیش‌فرض همان ردیف)'}
                </span>
                <button
                    type="button"
                    className={styles.iconToggle}
                    onClick={() => setOpen((o) => !o)}
                    disabled={disabled}
                    aria-expanded={open}
                >
                    {open ? 'بستن' : 'انتخاب آیکون'}
                </button>
            </div>

            {open && (
                <div className={styles.iconGrid} role="listbox" aria-label="آیکون‌ها">
                    {ICON_CHOICES.map(({ name, label, Icon }) => {
                        const active = Current === Icon
                        return (
                            <button
                                key={name}
                                type="button"
                                role="option"
                                aria-selected={active}
                                className={`${styles.iconOption} ${
                                    active ? styles.iconOptionActive : ''
                                }`}
                                title={label}
                                aria-label={label}
                                onClick={() => {
                                    onChange(name)
                                    setOpen(false)
                                }}
                            >
                                <Icon size={18} />
                            </button>
                        )
                    })}
                    {value && (
                        <button
                            type="button"
                            className={styles.iconClear}
                            onClick={() => {
                                onChange('')
                                setOpen(false)
                            }}
                        >
                            بدون آیکون
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * یک فیلد — نوعِ ورودی از `kind` می‌آید.
 *
 * فیلد با `kind` ناشناخته یک input ساده می‌گیرد: باید قابل ویرایش
 * بماند، نه این‌که ناپدید شود یا فرم را بشکند.
 */
function BlockField({ spec, blockType, value, onChange, disabled, error, uploadImage }) {
    const label = fieldLabel(spec.name, blockType)
    const kind = String(spec.kind ?? '').toLowerCase()
    const invalid = Boolean(error)

    /* متن غنی ویرایشگر کامل می‌گیرد */
    if (kind === 'rich_text' || kind === 'html') {
        return (
            <div className={styles.fieldBlock} data-invalid={invalid || undefined}>
                <span className={styles.fieldLabel}>
                    {label}
                    {spec.required && <span className={styles.req}>*</span>}
                </span>
                <RichTextEditor
                    value={value ?? ''}
                    onChange={onChange}
                    disabled={disabled}
                    error={invalid}
                    placeholder={`${label} را بنویسید…`}
                />
                {error && <span className={styles.fieldError}>{error}</span>}
            </div>
        )
    }

    if (kind === 'icon' || spec.name === 'icon') {
        return (
            <div className={styles.fieldBlock} data-invalid={invalid || undefined}>
                <span className={styles.fieldLabel}>
                    {label}
                    {spec.required && <span className={styles.req}>*</span>}
                </span>
                <IconPicker value={value ?? ''} onChange={onChange} disabled={disabled} />
                {error && <span className={styles.fieldError}>{error}</span>}
            </div>
        )
    }

    const isImage = kind === 'image' || spec.name === 'image_url'
    /* نشانی همیشه چپ‌به‌راست است، حتی در صفحه‌ی راست‌به‌چپ */
    const isUrl = kind === 'url' || isImage || spec.name.endsWith('_url')
    const isNumber = kind === 'number'
    const isTextarea = !isUrl && !isNumber && isLongText(spec, kind)
    const text = String(value ?? '')

    return (
        <label
            className={`${styles.field} ${isTextarea ? styles.fieldWide : ''} ${
                invalid ? styles.fieldInvalid : ''
            }`}
            data-invalid={invalid || undefined}
        >
            <span className={styles.label}>
                {label}
                {spec.required && <span className={styles.req}>*</span>}
                {spec.max_length && (
                    <span className={styles.counter}>
                        {text.length.toLocaleString('fa-IR')}/
                        {spec.max_length.toLocaleString('fa-IR')}
                    </span>
                )}
            </span>

            {isTextarea ? (
                <textarea
                    className={styles.textarea}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    maxLength={spec.max_length ?? undefined}
                    rows={3}
                />
            ) : (
                <input
                    className={styles.input}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    maxLength={spec.max_length ?? undefined}
                    dir={isUrl || isNumber ? 'ltr' : undefined}
                    inputMode={isNumber ? 'numeric' : undefined}
                    placeholder={
                        isImage
                            ? '/dl/… یا https://…/image.png'
                            : isUrl
                              ? '/contact یا https://…'
                              : undefined
                    }
                />
            )}

            {error && <span className={styles.fieldError}>{error}</span>}

            {isImage && uploadImage && (
                <ImageUpload upload={uploadImage} onDone={onChange} disabled={disabled} />
            )}

            {isImage && (
                <span className={styles.hint}>
                    تصویر را آپلود کنید (PNG، JPG یا WebP تا ۵ مگابایت)، یا نشانی
                    کامل آن را با https:// بنویسید.
                    {spec.allowed_sizes?.length > 0 &&
                        ` اندازه‌ی پیشنهادی: ${spec.allowed_sizes
                            .map((n) => n.toLocaleString('fa-IR'))
                            .join(' · ')} پیکسل.`}
                </span>
            )}

            {isImage && isValidImage(text) && (
                /* key با نشانی عوض می‌شود تا تصویر تازه، خطای تصویر قبلی
                   را به ارث نبرد. */
                <ImagePreview key={text} src={text.trim()} />
            )}
        </label>
    )
}

function ImagePreview({ src: raw }) {
    /* `/dl/{file_id}` (نشانی نسبی بک‌اند) اول به لینک موقت تبدیل می‌شود */
    const image = useFileUrl(raw)
    const [failed, setFailed] = useState(false)
    const src = image.url
    if (image.loading) return null
    return failed || image.failed || !src ? (
        <span className={styles.fieldError}>
            تصویر از این نشانی باز نشد؛ نشانی را بررسی کنید.
        </span>
    ) : (
        <img
            src={src}
            alt=""
            className={styles.imagePreview}
            onError={() => setFailed(true)}
        />
    )
}

/**
 * ویرایشگر بلوک‌های صفحه‌ی ساختاریافته.
 *
 * فرم **از روی قالبی که بک‌اند می‌دهد ساخته می‌شود**، نه از روی یک
 * ساختار ثابت در فرانت. اگر بک‌اند فردا بلوکی اضافه کند، این صفحه
 * بدون تغییر کد نشانش می‌دهد.
 *
 * ⚠️ بلوکی که `editable: false` باشد فقط خوانده می‌شود — ورودی‌هایش
 * غیرفعالند ولی در ذخیره دست‌نخورده فرستاده می‌شوند.
 *
 * `onSubmit(payload, { publish })` — با «ذخیره و انتشار» `publish`
 * درست است. `onDirtyChange` به صفحه‌ی بالا می‌گوید فرم تغییر
 * ذخیره‌نشده دارد تا عوض کردن تب را بپرسد.
 */
export default function CmsBlockEditor({
    page,
    busy = false,
    error = null,
    onSubmit,
    onClose,
    onDirtyChange,
}) {
    /* حالت اولیه از مقادیر ذخیره‌شده‌ای که همراه قالب آمده‌اند */
    const initialBlocks = useMemo(
        () =>
            (page.editable_blocks ?? []).map((b) => ({
                key: b.key,
                fields: Object.fromEntries(
                    (b.fields ?? []).map((f) => [f.name, f.value ?? ''])
                ),
                items: (b.items?.values ?? []).map(withUid),
            })),
        [page]
    )
    const [blocks, setBlocks] = useState(initialBlocks)
    const [initial] = useState(() => snapshot(initialBlocks))
    const [fieldErrors, setFieldErrors] = useState({})
    const [confirmClose, setConfirmClose] = useState(false)
    const formRef = useRef(null)

    const dirty = snapshot(blocks) !== initial
    useUnsavedChanges(dirty)
    useEffect(() => {
        onDirtyChange?.(dirty)
    }, [dirty, onDirtyChange])

    /* بعد از ذخیره‌ی ناموفق، اولین فیلد نامعتبر را نشان بده. در یک فرم
       بلند، خطای کنار فیلدی که بیرون از دید است یعنی «هیچ اتفاقی
       نیفتاد». */
    const errorCount = Object.keys(fieldErrors).length
    useEffect(() => {
        if (errorCount === 0) return
        formRef.current
            ?.querySelector('[data-invalid="true"]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [errorCount])

    /* آپلود تصویر برای همین صفحه — توکن هر بار تازه گرفته می‌شود چون
       یک‌بارمصرف است. */
    const uploadImage = async (file, onProgress) => {
        const { upload_token } = await cmsService.getUploadToken(page.id)
        const res = await fileService.upload(file, upload_token, { onProgress })
        if (!res?.file_id) throw new Error('سرور شناسه‌ی فایل را برنگرداند')
        return `/dl/${res.file_id}`
    }

    const specOf = (key) =>
        (page.editable_blocks ?? []).find((b) => b.key === key)

    const clearErrors = (prefix) =>
        setFieldErrors((prev) =>
            Object.fromEntries(
                Object.entries(prev).filter(([k]) => !k.startsWith(prefix))
            )
        )

    const setField = (blockKey, name, value) => {
        setBlocks((prev) =>
            prev.map((b) =>
                b.key === blockKey
                    ? { ...b, fields: { ...b.fields, [name]: value } }
                    : b
            )
        )
        clearErrors(`${blockKey}.${name}`)
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
        clearErrors(`${blockKey}.items.${index}.${name}`)
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
                return { ...b, items: [...b.items, withUid(blank)] }
            })
        )
    }

    /* خطاهای ردیف‌ها با شماره‌ی ردیف کلید خورده‌اند؛ بعد از حذف یا
       جابه‌جایی به ردیف دیگری می‌چسبیدند، پس پاک می‌شوند و در ذخیره‌ی
       بعدی دوباره حساب می‌شوند. */
    const removeItem = (blockKey, index) => {
        setBlocks((prev) =>
            prev.map((b) =>
                b.key === blockKey
                    ? { ...b, items: b.items.filter((_, i) => i !== index) }
                    : b
            )
        )
        clearErrors(`${blockKey}.items.`)
    }

    /* ترتیب ردیف‌ها روی سایت دیده می‌شود (مثلاً مراحل شماره‌دار چرخه‌ی
       خدمات)، پس باید بدون حذف و ساخت دوباره قابل تغییر باشد. */
    const moveItem = (blockKey, index, delta) => {
        setBlocks((prev) =>
            prev.map((b) => {
                if (b.key !== blockKey) return b
                const to = index + delta
                if (to < 0 || to >= b.items.length) return b
                const items = [...b.items]
                ;[items[index], items[to]] = [items[to], items[index]]
                return { ...b, items }
            })
        )
        clearErrors(`${blockKey}.items.`)
    }

    const checkField = (f, raw) => {
        const v = String(raw ?? '')
        if (f.required && isBlank(v)) return 'این فیلد الزامی است'
        if (!v.trim()) return null

        const kind = String(f.kind ?? '').toLowerCase()
        if (kind === 'image' || f.name === 'image_url') {
            if (!isValidImage(v)) return 'نشانی تصویر باید با https:// یا / شروع شود'
        } else if (kind === 'url' || f.name === 'url' || f.name.endsWith('_url')) {
            if (!isValidLink(v)) return 'نشانی باید با / (صفحه‌ی داخلی) یا https:// شروع شود'
        }
        return null
    }

    const submit = (publish) => {
        const errs = {}

        for (const block of blocks) {
            const spec = specOf(block.key)
            if (!spec?.editable) continue

            for (const f of spec.fields ?? []) {
                const msg = checkField(f, block.fields[f.name])
                if (msg) errs[`${block.key}.${f.name}`] = msg
            }

            block.items.forEach((item, i) => {
                for (const f of spec.items?.fields ?? []) {
                    const msg = checkField(f, item[f.name])
                    if (msg) errs[`${block.key}.items.${i}.${f.name}`] = msg
                }
            })
        }

        setFieldErrors(errs)
        if (Object.keys(errs).length > 0) return

        /* `CmsBlockIn` فقط `key` و `fields` و `items` می‌گیرد، نه
           `type` و نه `version`.

           ⚠️ بلوک‌های **غیرقابل‌ویرایش هم فرستاده می‌شوند** — با همان
           مقدار دست‌نخورده. بک‌اند تأیید کرد `PUT` آرایه‌ی بلوک‌ها را
           **جایگزین** می‌کند؛ نفرستادن بلوک قفل‌شده یعنی پاک شدنش. */
        const payload = blocks.map((b) => ({
            key: b.key,
            fields: b.fields,
            /* `items` برای بلوک غیرتکرارشونده باید null بماند */
            items: specOf(b.key)?.items
                ? b.items.map((it) => ({ fields: withoutUid(it) }))
                : null,
        }))

        onSubmit?.({ blocks: payload }, { publish })
    }

    const requestClose = () => {
        if (dirty) setConfirmClose(true)
        else onClose?.()
    }

    const canPublish = Boolean(page.permissions?.can_publish)

    const feedback = (
        <>
            {errorCount > 0 && (
                <p className={styles.error} role="alert">
                    {errorCount.toLocaleString('fa-IR')} فیلد نیاز به اصلاح دارد؛
                    کنار هر کدام توضیح داده شده.
                </p>
            )}
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
        </>
    )

    return (
        <form
            ref={formRef}
            className={styles.wrapper}
            onSubmit={(e) => {
                e.preventDefault()
                submit(false)
            }}
            noValidate
        >
            <button
                type="button"
                className={styles.close}
                onClick={requestClose}
                aria-label="بستن ویرایشگر"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>ویرایش «{page.title}»</h2>

            <div className={styles.body}>
                {feedback}

                <p className={styles.intro}>
                    این صفحه قالب ثابت دارد: فقط فیلدهای زیر قابل تغییرند و
                    چیدمانشان سمت سایت مشخص شده است. فیلد خالی روی سایت متن
                    پیش‌فرض همان بخش را نشان می‌دهد.
                </p>

                {(page.editable_blocks ?? []).map((spec) => {
                    const block = blocks.find((b) => b.key === spec.key)
                    if (!block) return null

                    const Icon = BLOCK_ICON[spec.type] ?? Type
                    const locked = !spec.editable
                    const maxItems = spec.items?.max_items ?? Infinity
                    const atMax = block.items.length >= maxItems
                    const hint = blockHint(page.schema_key, spec.key)

                    return (
                        <section key={spec.key} className={styles.block}>
                            <header className={styles.blockHead}>
                                <span className={styles.blockName}>
                                    <Icon size={15} aria-hidden="true" />
                                    {/* عنوان از قالب بک‌اند؛ نبودش یعنی نگاشت فارسی خودمان */}
                                    {spec.title || blockName(spec.key)}
                                </span>

                                <span className={styles.blockType}>
                                    {BLOCK_TYPE_LABEL[spec.type] ?? spec.type}
                                </span>

                                {locked && (
                                    <span className={styles.lockTag}>فقط خواندنی</span>
                                )}
                            </header>

                            {hint && (
                                <p className={styles.blockHint}>
                                    <MapPin size={13} aria-hidden="true" />
                                    {hint}
                                </p>
                            )}

                            {(spec.fields ?? []).length > 0 && (
                                <div className={styles.fields}>
                                    {spec.fields.map((f) => (
                                        <BlockField
                                            key={f.name}
                                            spec={f}
                                            blockType={spec.type}
                                            uploadImage={uploadImage}
                                            value={block.fields[f.name]}
                                            disabled={locked || busy}
                                            error={fieldErrors[`${spec.key}.${f.name}`]}
                                            onChange={(v) => setField(spec.key, f.name, v)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ── ردیف‌های تکرارشونده ── */}
                            {spec.items && (
                                <div className={styles.items}>
                                    <div className={styles.itemsHead}>
                                        <span className={styles.itemsTitle}>
                                            ردیف‌ها
                                        </span>
                                        <span className={styles.itemsCount}>
                                            {block.items.length.toLocaleString('fa-IR')}
                                            {Number.isFinite(maxItems) &&
                                                ` از ${maxItems.toLocaleString('fa-IR')}`}
                                        </span>
                                    </div>

                                    {block.items.length === 0 && (
                                        <p className={styles.itemsEmpty}>
                                            هنوز ردیفی اضافه نشده است؛ روی سایت
                                            ردیف‌های پیش‌فرض نمایش داده می‌شوند.
                                        </p>
                                    )}

                                    {block.items.map((item, i) => (
                                        <div key={item._uid} className={styles.item}>
                                            <div className={styles.itemHead}>
                                                <span className={styles.itemIndex}>
                                                    ردیف {(i + 1).toLocaleString('fa-IR')}
                                                </span>

                                                {!locked && (
                                                    <div className={styles.itemTools}>
                                                        <button
                                                            type="button"
                                                            className={styles.itemBtn}
                                                            onClick={() =>
                                                                moveItem(spec.key, i, -1)
                                                            }
                                                            disabled={busy || i === 0}
                                                            aria-label={`بردن ردیف ${i + 1} به بالا`}
                                                            title="بالا"
                                                        >
                                                            <ArrowUp size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.itemBtn}
                                                            onClick={() =>
                                                                moveItem(spec.key, i, 1)
                                                            }
                                                            disabled={
                                                                busy ||
                                                                i === block.items.length - 1
                                                            }
                                                            aria-label={`بردن ردیف ${i + 1} به پایین`}
                                                            title="پایین"
                                                        >
                                                            <ArrowDown size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.itemRemove}
                                                            onClick={() =>
                                                                removeItem(spec.key, i)
                                                            }
                                                            disabled={busy}
                                                            aria-label={`حذف ردیف ${i + 1}`}
                                                            title="حذف ردیف"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.fields}>
                                                {(spec.items.fields ?? []).map((f) => (
                                                    <BlockField
                                                        key={f.name}
                                                        spec={f}
                                                        blockType={spec.type}
                                                        uploadImage={uploadImage}
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
                    «ذخیره» فقط یک نسخه‌ی تازه می‌سازد و روی سایت دیده
                    نمی‌شود. برای دیده شدن، «ذخیره و انتشار» را بزنید.
                </p>

                {/* خطا کنار دکمه‌ها هم تکرار می‌شود: فرم بلند است و
                    ادمین بعد از کلیک پایین صفحه است، نه بالا. */}
                {feedback}

                <div className={styles.actions}>
                    {canPublish && (
                        <button
                            type="button"
                            className={styles.submit}
                            disabled={busy}
                            onClick={() => submit(true)}
                        >
                            {busy ? 'در حال ذخیره…' : 'ذخیره و انتشار'}
                        </button>
                    )}

                    <button
                        type="submit"
                        className={canPublish ? styles.cancel : styles.submit}
                        disabled={busy}
                    >
                        {busy ? 'در حال ذخیره…' : canPublish ? 'فقط ذخیره' : 'ذخیره تغییرات'}
                    </button>

                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={requestClose}
                        disabled={busy}
                    >
                        انصراف
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={confirmClose}
                title="تغییرات ذخیره نشده"
                message="تغییراتی که داده‌اید ذخیره نشده‌اند و با بستن ویرایشگر از بین می‌روند. خارج می‌شوید؟"
                confirmLabel="خروج بدون ذخیره"
                cancelLabel="ادامه‌ی ویرایش"
                onConfirm={() => {
                    setConfirmClose(false)
                    onClose?.()
                }}
                onClose={() => setConfirmClose(false)}
            />
        </form>
    )
}
