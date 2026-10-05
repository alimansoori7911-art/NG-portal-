import { useEffect, useState } from 'react'
import { cmsService } from '../../../services/cmsService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/**
 * مقاله‌های منتشرشده‌ی CMS — برای بخش عمومی سایت.
 *
 * ⚠️ این مسیر **احراز هویت نمی‌خواهد** و فقط صفحه‌هایی را می‌دهد که
 * هم منتشر شده‌اند هم `is_public` دارند. پس پیش‌نویس و صفحه‌ی خصوصی
 * هیچ‌وقت اینجا دیده نمی‌شوند.
 *
 * ⚠️ خطا اینجا **صفحه را نمی‌شکند**. مرکز منابع ویترین خودش را دارد
 * و مقاله‌ها بخش اضافه‌ی آن‌اند؛ اگر CMS بالا نیامد، بقیه‌ی صفحه باید
 * سر جایش بماند نه این‌که کل صفحه خطا شود.
 */
export function usePublicPages({ limit = 6, tag } = {}) {
    const [state, setState] = useState({
        key: null,
        items: [],
        total: 0,
        error: null,
    })

    const key = `${limit}:${tag ?? ''}`

    useEffect(() => {
        let cancelled = false

        cmsService
            .getPublicPages({ limit, tag })
            .then(({ items, pagination }) => {
                if (cancelled) return
                setState({
                    key,
                    items: (items ?? []).map((p) => ({
                        ...p,
                        publishedLabel:
                            formatJalaliDateTime(p.published_at).date || '',
                    })),
                    total: pagination?.total ?? items?.length ?? 0,
                    error: null,
                })
            })
            .catch((err) => {
                if (cancelled) return
                setState({
                    key,
                    items: [],
                    total: 0,
                    error: err?.message || 'دریافت مقاله‌ها ناموفق بود',
                })
            })

        return () => {
            cancelled = true
        }
    }, [key, limit, tag])

    const fresh = state.key === key
    return {
        items: fresh ? state.items : [],
        total: fresh ? state.total : 0,
        error: fresh ? state.error : null,
        loading: !fresh,
    }
}

/**
 * یک صفحه‌ی منتشرشده با محتوای کامل.
 *
 * اگر اسلاگ پیدا نشد، قبل از اعلام ۴۰۴ یک‌بار از
 * `GET /cms/redirects/{slug}` می‌پرسیم: اسلاگ ممکن است عوض شده باشد و
 * لینک قدیمی هنوز جایی منتشر باشد. این دقیقاً کاری است که ماژول
 * ریدایرکت اسپک برایش ساخته شده.
 */
export function usePublicPage(slug) {
    const [state, setState] = useState({
        slug: null,
        data: null,
        error: null,
        redirectedTo: null,
    })

    useEffect(() => {
        if (!slug) return
        let cancelled = false

        async function load() {
            try {
                const data = await cmsService.getPublicPage(slug)
                if (!cancelled) {
                    setState({ slug, data, error: null, redirectedTo: null })
                }
            } catch {
                /* شاید اسلاگ قدیمی باشد */
                try {
                    const target = await cmsService.resolveRedirect(slug)
                    if (cancelled) return

                    if (target?.to_slug) {
                        setState({
                            slug,
                            data: null,
                            error: null,
                            redirectedTo: target.to_slug,
                        })
                        return
                    }
                    throw new Error('no redirect')
                } catch {
                    if (!cancelled) {
                        setState({
                            slug,
                            data: null,
                            error: 'این صفحه پیدا نشد.',
                            redirectedTo: null,
                        })
                    }
                }
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [slug])

    const fresh = state.slug === slug
    return {
        data: fresh ? state.data : null,
        error: fresh ? state.error : null,
        redirectedTo: fresh ? state.redirectedTo : null,
        loading: Boolean(slug) && !fresh,
    }
}
