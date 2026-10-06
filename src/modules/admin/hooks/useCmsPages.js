import { useCallback, useEffect, useState } from 'react'
import {
    cmsService,
    pageKindLabel,
    pageState,
} from '../../../services/cmsService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

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
        version: `v${Number(p.version_counter ?? 1).toLocaleString('fa-IR')}`,
        visibility: p.is_public ? 'عمومی' : 'خصوصی',
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

    const run = useCallback(async (fn) => {
        setBusy(true)
        setError(null)
        try {
            await fn()
            return true
        } catch (err) {
            setError(err?.message || 'عملیات ناموفق بود')
            return false
        } finally {
            setBusy(false)
        }
    }, [])

    return {
        busy,
        error,
        clearError: () => setError(null),
        create: (data) => run(() => cmsService.createPage(data)),
        update: (id, changes) => run(() => cmsService.updatePage(id, changes)),
        publish: (id) => run(() => cmsService.publishPage(id)),
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
    }, [])

    return {
        items: state.items,
        error: state.error,
        loading: !state.ready,
    }
}
