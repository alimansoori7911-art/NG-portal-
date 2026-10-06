import { useCallback, useEffect, useState } from 'react'
import { adminCatalogService } from '../../../services/adminCatalogService'

/**
 * محصول‌ها، دسته‌بندی‌ها و ویژگی‌ها — سه موجودیت پایه‌ی کاتالوگ.
 *
 * هر سه با هم گرفته می‌شوند چون فرم محصول بدون فهرست دسته‌بندی قابل
 * ساختن نیست و صفحه هر سه تب را کنار هم دارد.
 *
 * ⚠️ خطای یکی نباید بقیه را از کار بیندازد: اگر ویژگی‌ها نیامدند،
 * فهرست محصول‌ها باید همچنان کار کند. پس هر کدام جدا گرفته می‌شوند.
 */
export function useProductCatalog() {
    const [state, setState] = useState({
        key: null,
        products: [],
        categories: [],
        features: [],
        error: null,
    })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const key = String(attempt)

    useEffect(() => {
        let cancelled = false

        Promise.allSettled([
            adminCatalogService.getProducts(),
            adminCatalogService.getCategories(),
            adminCatalogService.getFeatures(),
        ])
            .then(([p, c, f]) => {
                if (cancelled) return

                const failed = [p, c, f].find((r) => r.status === 'rejected')
                /* این سه متد آرایه را **مستقیم** می‌دهند، نه
                   `{items, pagination}` — برخلاف متدهای صفحه‌بندی‌شده‌ی
                   همین سرویس. */
                const list = (r) => (r.status === 'fulfilled' ? (r.value ?? []) : [])

                setState({
                    key: String(attempt),
                    products: list(p),
                    categories: list(c),
                    features: list(f),
                    error: failed
                        ? failed.reason?.message || 'دریافت بخشی از کاتالوگ ناموفق بود'
                        : null,
                })
            })

        return () => {
            cancelled = true
        }
    }, [attempt])

    const fresh = state.key === key
    return {
        products: fresh ? state.products : [],
        categories: fresh ? state.categories : [],
        features: fresh ? state.features : [],
        error: fresh ? state.error : null,
        loading: !fresh,
        reload,
    }
}

/**
 * نسخه‌های یک محصول.
 *
 * فهرست سراسری ندارد و فقط زیرمجموعه‌ی محصول است — عیناً مثل اسپک.
 */
export function useProductVersions(productId) {
    const [state, setState] = useState({ key: null, items: [], error: null })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const key = productId ? `${productId}:${attempt}` : null

    useEffect(() => {
        if (!productId) return
        let cancelled = false

        adminCatalogService
            .getProductVersions(productId)
            .then((items) => {
                if (!cancelled) {
                    setState({
                        key: `${productId}:${attempt}`,
                        items: items ?? [],
                        error: null,
                    })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setState({
                        key: `${productId}:${attempt}`,
                        items: [],
                        error: err?.message || 'دریافت نسخه‌ها ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [productId, attempt])

    const fresh = state.key === key
    return {
        items: fresh ? state.items : [],
        error: fresh ? state.error : null,
        loading: Boolean(productId) && !fresh,
        reload,
    }
}

/**
 * نوشتن روی کاتالوگ — محصول، دسته‌بندی، ویژگی و نسخه.
 *
 * خروجی خودِ درخواست برگردانده می‌شود (نه فقط true/false) تا اگر
 * جایی به شناسه‌ی رکورد تازه نیاز شد در دسترس باشد.
 */
export function useCatalogActions() {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const run = useCallback(async (fn) => {
        setBusy(true)
        setError(null)
        try {
            return (await fn()) ?? true
        } catch (err) {
            /* ⚠️ `api.js` هر ۴۰۹ را به «این اطلاعات قبلاً ثبت شده است»
               ترجمه می‌کند، چون پیام بک‌اند معمولاً انگلیسی است. ولی در
               کاتالوگ ۴۰۹ دو معنی کاملاً متفاوت دارد — کد تکراری، یا
               دسته‌ای که هنوز محصول دارد — و پیام عمومی غلط است.

               همان راه‌حلی که کامنت `api.js` پیشنهاد می‌کند: صفحه با
               خواندن `code` پیام دقیق‌تر خودش را می‌گذارد. اگر سرور
               پیام فارسی داد، همان ارجح است. */
            const raw = err?.details?.message ?? err?.response?.data?.data?.error?.message
            const isPersian = (t) => /[؀-ۿ]/.test(String(t ?? ''))

            setError(
                (isPersian(raw) && raw) ||
                    (err?.code === 'CONFLICT'
                        ? 'این مورد با چیزی در سیستم تداخل دارد — ممکن است کد تکراری باشد یا هنوز وابستگی داشته باشد.'
                        : err?.message) ||
                    'عملیات ناموفق بود'
            )
            return null
        } finally {
            setBusy(false)
        }
    }, [])

    return {
        busy,
        error,
        clearError: () => setError(null),

        createProduct: (d) => run(() => adminCatalogService.createProduct(d)),
        updateProduct: (id, d) => run(() => adminCatalogService.updateProduct(id, d)),
        deleteProduct: (id) => run(() => adminCatalogService.deleteProduct(id)),

        createCategory: (d) => run(() => adminCatalogService.createCategory(d)),
        updateCategory: (id, d) => run(() => adminCatalogService.updateCategory(id, d)),
        deleteCategory: (id) => run(() => adminCatalogService.deleteCategory(id)),

        createFeature: (d) => run(() => adminCatalogService.createFeature(d)),
        updateFeature: (id, d) => run(() => adminCatalogService.updateFeature(id, d)),
        deleteFeature: (id) => run(() => adminCatalogService.deleteFeature(id)),

        createVersion: (productId, d) =>
            run(() => adminCatalogService.createProductVersion(productId, d)),
        updateVersion: (id, d) =>
            run(() => adminCatalogService.updateProductVersion(id, d)),
        deleteVersion: (id) => run(() => adminCatalogService.deleteProductVersion(id)),
    }
}
