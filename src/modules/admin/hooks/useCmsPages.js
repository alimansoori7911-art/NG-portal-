import { useCallback, useEffect, useState } from 'react'
import {
    cmsService,
    pageKindLabel,
    pageState,
} from '../../../services/cmsService'
import { parseValidationErrors } from '../../../services/authService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { fieldLabel } from '../constants/cmsLabels'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/* نشانی واقعی هر صفحه روی سایت.

   مقاله مسیر اسلاگی دارد. صفحه‌ی ساختاریافته به یک مسیر ثابت
   سایت نگاشت می‌شود — همان نگاشتی که در CMS_CONTRACT.md توافق شد.

   کلید ناشناخته `null` می‌دهد تا دکمه‌ی «دیدن در سایت» نیاید؛
   لینک شکسته بدتر از نبودن دکمه است. */
export const SCHEMA_ROUTES = {
    home: '/',
    /* فوتر صفحه‌ی مستقل نیست و در همه‌ی صفحات دیده می‌شود؛
       مسیر صفحه‌ی اصلی را می‌دهیم تا دکمه‌ی «دیدن در سایت»
       به مسیر ناموجود /site-footer نرود. */
    site_footer: '/',
    company: '/company',
    services: '/services',
    products: '/products',
    resources: '/resources',
    contact: '/contact',
}

export function publicUrlOf(p) {
    if (p.kind === 'ARTICLE') return `/resources/articles/${p.slug}`
    if (p.kind === 'STRUCTURED') return SCHEMA_ROUTES[p.schema_key] ?? null
    return null
}

/* شماره‌ی نسخه بدون «v»: در فونت فارسی «v۱» شبیه «۷۱» خوانده
   می‌شد، چون «۷» فارسی شکل v است. */
export const versionLabel = (n) => Number(n ?? 1).toLocaleString('fa-IR')

/* برچسب فارسی فیلدهای فرم صفحه — برای خطای ۴۲۲ سرور. */
const PAGE_FIELD_LABEL = {
    slug: 'نشانی صفحه',
    excerpt: 'خلاصه',
    content_raw: 'متن صفحه',
    meta_title: 'عنوان سئو',
    meta_description: 'توضیح سئو',
    og_image_url: 'نشانی تصویر اشتراک‌گذاری',
    canonical_url: 'نشانی اصلی',
    tags: 'برچسب‌ها',
    schema_key: 'قالب صفحه',
    blocks: 'بلوک‌ها',
}

/**
 * پیام خطای قابل‌فهم برای ادمین.
 *
 * خطای ۴۲۲ قبلاً فقط «اطلاعات واردشده معتبر نیست» بود، بدون اینکه
 * بگوید کدام فیلد. حالا جزئیات سرور (`details`) هم فهرست می‌شود.
 */
export function describeError(err, fallback) {
    const base = err?.message || fallback
    const fields = parseValidationErrors(err?.details)
    const lines = Object.entries(fields).map(
        ([name, msg]) => `• ${PAGE_FIELD_LABEL[name] ?? fieldLabel(name)}: ${msg}`
    )
    return lines.length ? `${base}\n${lines.join('\n')}` : base
}

function toRow(p, i, offset) {
    const { date } = formatJalaliDateTime(p.updated_at)

    return {
        id: p.id,
        index: offset + i + 1,
        title: p.title,
        slug: p.slug,
        kind: pageKindLabel(p.kind),
        /* نسخه کنار وضعیت مهم است: ادمین باید ببیند صفحه چند بار
           ویرایش شده، چون هر ویرایش یک نسخه‌ی برگشت‌پذیر می‌سازد. */
        version: versionLabel(p.version_counter),
        visibility: p.is_public ? 'عمومی' : 'خصوصی',
        /* نشانی واقعی روی سایت — ستون «نشانی» همین را نشان می‌دهد نه
           اسلاگ خام؛ اسلاگ صفحه‌ی اصلی `home` است ولی نشانی‌اش `/`. */
        publicUrl: publicUrlOf(p),
        address: publicUrlOf(p) ?? `/${p.slug}`,
        status: pageState(p),
        updatedAt: date || '—',
        raw: p,
    }
}

/**
 * فهرست صفحه‌های CMS — صفحه‌بندی و فیلتر سمت سرور.
 *
 * `include_deleted` به‌صورت فیلتر در دسترس است چون حذف **نرم** است:
 * صفحه‌ی حذف‌شده با `/restore` برمی‌گردد، پس ادمین باید بتواند ببیندش.
 * پیش‌فرض خاموش است تا فهرست روزمره شلوغ نشود.
 */
export function useCmsPages() {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    /* فیلترها — هر تغییری صفحه را به ۱ برمی‌گرداند، وگرنه ممکن است
       کاربر در صفحه‌ی ۳ فیلتری بزند که فقط ۲ صفحه نتیجه دارد. */
    const [filters, setFilters] = useState({
        kind: '',
        status: '',
        is_public: '',
        tag: '',
        q: '',
        include_deleted: false,
    })

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const setFilter = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
        setPage(1)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await cmsService.getPages({
                    page,
                    limit: ROWS_PER_PAGE,
                    /* رشته‌ی خالی یعنی «بی‌فیلتر» و نباید فرستاده شود،
                       وگرنه بک‌اند آن را مقدار معتبر می‌گیرد. */
                    kind: filters.kind || undefined,
                    status: filters.status || undefined,
                    is_public:
                        filters.is_public === ''
                            ? undefined
                            : filters.is_public === 'true',
                    tag: filters.tag.trim() || undefined,
                    /* ✅ اسپک تازه جستجوی متنی روی عنوان و نشانی را آورد */
                    q: filters.q.trim() || undefined,
                    include_deleted: filters.include_deleted,
                    sort_by: 'updated_at',
                    sort_order: 'desc',
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
                setRows((items ?? []).map((p, i) => toRow(p, i, offset)))
                setPageCount(pagination?.total_pages ?? 1)
                setTotal(pagination?.total ?? items?.length ?? 0)
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'دریافت فهرست صفحه‌ها ناموفق بود')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt, filters])

    return {
        rows,
        page,
        pageCount,
        total,
        loading,
        error,
        filters,
        setPage,
        setFilter,
        reload,
    }
}

/**
 * ساخت، ویرایش، انتشار، حذف و بازگردانی صفحه.
 *
 * جدا از هوک فهرست است چون فقط وقتی فرم یا نوار عملیات باز است
 * لازم می‌شود — مثل `useDiscountActions`.
 */
export function useCmsActions() {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    /* نتیجه‌ی درخواست برگردانده می‌شود (نه فقط true) تا «ساخت و
       انتشار» شناسه‌ی صفحه‌ی تازه را داشته باشد. شکست `null` است. */
    const run = useCallback(async (fn, fallback = 'عملیات ناموفق بود') => {
        setBusy(true)
        setError(null)
        try {
            return (await fn()) ?? true
        } catch (err) {
            setError(describeError(err, fallback))
            return null
        } finally {
            setBusy(false)
        }
    }, [])

    /* ذخیره و بلافاصله انتشار — دو درخواست پشت سر هم.
       اگر ذخیره شد ولی انتشار نه، خطا صریح می‌گوید که متن ذخیره شده
       تا ادمین دوباره همه‌چیز را ننویسد. */
    const saveThenPublish = (save) =>
        run(async () => {
            const saved = await save()
            const id = saved?.id
            try {
                if (id) await cmsService.publishPage(id)
            } catch (err) {
                throw {
                    ...err,
                    message: `تغییرات ذخیره شد ولی انتشار ناموفق بود: ${err?.message ?? ''}`,
                }
            }
            return saved
        })

    return {
        busy,
        error,
        clearError: () => setError(null),
        create: (data, { publish = false } = {}) =>
            publish
                ? saveThenPublish(() => cmsService.createPage(data))
                : run(() => cmsService.createPage(data), 'ساخت صفحه ناموفق بود'),
        update: (id, changes, { publish = false } = {}) =>
            publish
                ? saveThenPublish(async () => ({
                      id,
                      ...(await cmsService.updatePage(id, changes)),
                  }))
                : run(() => cmsService.updatePage(id, changes), 'ذخیره ناموفق بود'),
        publish: (id) => run(() => cmsService.publishPage(id), 'انتشار ناموفق بود'),
        remove: (id) => run(() => cmsService.deletePage(id)),
        restore: (id) => run(() => cmsService.restorePage(id)),
    }
}

/**
 * یک صفحه با محتوای کامل — برای فرم ویرایش.
 *
 * فهرست (`CmsPageListItemOut`) محتوا را **ندارد**؛ `content_raw` و
 * `blocks` و `seo` فقط از `GET /pages/{id}` می‌آیند. پس فرم ویرایش
 * نمی‌تواند با ردیف جدول پر شود و باید جدا بخواند.
 */
export function useCmsPage(id) {
    /* نتیجه همراه شناسه‌اش نگه داشته می‌شود تا وقتی `id` عوض شد،
       داده‌ی صفحه‌ی قبلی لحظه‌ای بیرون نزند. اگر state داخل افکت
       صفر می‌شد، یک رندر اضافه لازم بود و فرم در آن فاصله با
       مقدار قبلی پر می‌شد. */
    const [result, setResult] = useState({ id: null, data: null, error: null })

    useEffect(() => {
        if (!id) return

        let cancelled = false

        cmsService
            .getPage(id)
            .then((p) => {
                if (!cancelled) setResult({ id, data: p, error: null })
            })
            .catch((err) => {
                if (!cancelled) {
                    setResult({
                        id,
                        data: null,
                        error: err?.message || 'دریافت صفحه ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [id])

    /* نتیجه‌ی مربوط به شناسه‌ی دیگری، نتیجه‌ی این یکی نیست */
    const fresh = result.id === id
    return {
        data: fresh ? result.data : null,
        error: fresh ? result.error : null,
        loading: Boolean(id) && !fresh,
    }
}

/**
 * تاریخچه‌ی نسخه‌ها و خواندن یک نسخه‌ی مشخص.
 *
 * `openVersion` محتوای همان نسخه را می‌آورد تا ادمین قبل از
 * برگرداندن ببیند چه چیزی را برمی‌گرداند.
 *
 * ⚠️ اسپک مسیر «بازگردانی نسخه» ندارد؛ برگشت به نسخه‌ی قدیمی با
 * `PUT` و فرستادن محتوای همان نسخه انجام می‌شود که یک نسخه‌ی تازه
 * می‌سازد (تاریخچه پاک نمی‌شود).
 */
export function useCmsVersions(pageId) {
    /* مثل `useCmsPage`: نتیجه با شناسه و شماره‌ی تلاش نگه داشته
       می‌شود تا پاک کردن state داخل افکت لازم نشود. */
    const [result, setResult] = useState({ key: null, rows: [], error: null })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const key = pageId ? `${pageId}:${attempt}` : null

    useEffect(() => {
        if (!pageId) return

        let cancelled = false

        cmsService
            .getVersions(pageId, { limit: 50 })
            .then(({ items }) => {
                if (cancelled) return
                setResult({
                    key: `${pageId}:${attempt}`,
                    rows: (items ?? []).map((v) => ({
                        ...v,
                        createdAtLabel:
                            formatJalaliDateTime(v.created_at).date || '—',
                    })),
                    error: null,
                })
            })
            .catch((err) => {
                if (!cancelled) {
                    setResult({
                        key: `${pageId}:${attempt}`,
                        rows: [],
                        error: err?.message || 'دریافت تاریخچه ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [pageId, attempt])

    const fresh = result.key === key
    return {
        rows: fresh ? result.rows : [],
        error: fresh ? result.error : null,
        loading: Boolean(pageId) && !fresh,
        reload,
    }
}

/**
 * ریدایرکت‌های اسلاگ — فقط خواندنی.
 *
 * ⚠️ اسپک برای ریدایرکت‌ها **فقط `GET`** دارد: نه ساخت، نه ویرایش، نه
 * حذف. یعنی رکوردها را خودِ بک‌اند هنگام تغییر اسلاگ یک صفحه می‌سازد.
 * پس این فهرست عمداً دکمه‌ی عملیات ندارد — گذاشتنش یعنی وعده‌ای که
 * پشتش اندپوینتی نیست.
 */
export function useCmsRedirects() {
    const [state, setState] = useState({ ready: false, items: [], error: null })
    /* بعد از تغییر نشانی یک صفحه، سرور ریدایرکت تازه می‌سازد؛ بدون
       تازه‌سازی این تب تا رفرش کامل صفحه همان فهرست قدیمی را نشان می‌داد. */
    const [attempt, setAttempt] = useState(0)
    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false

        cmsService
            .getRedirects({ limit: 100 })
            .then(({ items }) => {
                if (!cancelled) {
                    setState({ ready: true, items: items ?? [], error: null })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setState({
                        ready: true,
                        items: [],
                        error: err?.message || 'دریافت ریدایرکت‌ها ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [attempt])

    return {
        items: state.items,
        error: state.error,
        loading: !state.ready,
        reload,
    }
}

/**
 * قالب صفحه‌های ساختاریافته — `GET /admin/cms/structured-schemas`.
 *
 * دو کاربرد دارد: عنوان فارسی بلوک‌ها (اسپک تازه `title` را روی هر
 * بلوک قالب آورد، ولی `editable-pages` هنوز ندارد) و فهرست قالب‌ها
 * برای ساخت صفحه‌ی ساختاریافته‌ی تازه.
 */
export function useStructuredSchemas() {
    const [state, setState] = useState({ ready: false, items: [], error: null })

    useEffect(() => {
        let cancelled = false
        cmsService
            .getStructuredSchemas()
            .then((items) => {
                if (!cancelled) {
                    setState({ ready: true, items: items ?? [], error: null })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setState({
                        ready: true,
                        items: [],
                        error: err?.message || 'دریافت قالب‌ها ناموفق بود',
                    })
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    return { schemas: state.items, loading: !state.ready, error: state.error }
}

/* عنوان بلوک‌ها را از قالب روی بلوک‌های صفحه می‌نشاند. */
export function withBlockTitles(page, schemas) {
    const schema = schemas.find((s) => s.key === page?.schema_key)
    if (!schema) return page
    const title = (key) => schema.blocks?.find((b) => b.key === key)?.title
    return {
        ...page,
        editable_blocks: (page.editable_blocks ?? []).map((b) => ({
            ...b,
            title: b.title ?? title(b.key),
        })),
        blocks: (page.blocks ?? []).map((b) => ({
            ...b,
            title: b.title ?? title(b.key),
        })),
    }
}
