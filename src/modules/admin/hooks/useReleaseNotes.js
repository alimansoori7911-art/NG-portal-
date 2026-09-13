import { useEffect, useState } from 'react'
import { adminCatalogService } from '../../../services/adminCatalogService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/**
 * ریلیز نوت‌ها = نسخه‌های محصول (`ProductVersionOutput`).
 *
 * ⚠️ اندپوینت فهرستِ سراسری نداریم؛ فقط
 * `GET /admin/products/{product_id}/versions`. پس اول محصول‌ها گرفته
 * می‌شوند و نسخه‌های همه‌شان یک‌جا جمع می‌شود. تا وقتی یک محصول داریم
 * این عملاً یک درخواست اضافه است.
 *
 * `changelog` در جدول نمی‌آید (یک ستون جا نمی‌شود) ولی در `raw` هست
 * تا اگر بعداً نمای جزئیات ساخته شد لازم نباشد دوباره درخواست بزنیم.
 */
export function useReleaseNotes(enabled = true) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!enabled) return
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                /* `getProducts` خودِ آرایه را می‌دهد (unwrap شده) */
                const list = (await adminCatalogService.getProducts()) ?? []

                const perProduct = await Promise.all(
                    list.map((p) =>
                        adminCatalogService
                            .getProductVersions(p.id)
                            /* یک محصول بدون نسخه نباید کل صفحه را بشکند */
                            .catch(() => [])
                    )
                )

                if (cancelled) return

                const versions = perProduct
                    .flat()
                    .filter(Boolean)
                    /* تازه‌ترین اول */
                    .sort((a, b) =>
                        String(b.release_date ?? b.created_at ?? '').localeCompare(
                            String(a.release_date ?? a.created_at ?? '')
                        )
                    )

                setRows(
                    versions.map((v, i) => ({
                        id: v.id,
                        index: i + 1,
                        title: v.version ?? '—',
                        status: v.is_release ? 'منتشر شده' : 'پیش‌نویس',
                        publishedAt:
                            formatJalaliDateTime(v.release_date).date || '—',
                        raw: v,
                    }))
                )
            } catch (err) {
                if (cancelled) return
                setError(err?.message || 'دریافت ریلیز نوت‌ها ناموفق بود')
                setRows([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [enabled])

    return { rows, loading, error }
}
