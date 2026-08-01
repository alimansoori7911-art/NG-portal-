import { useEffect, useState } from 'react'
import { productService } from '../../../services/productService'
import { mapPlans } from '../utils/planMapper'

/**
 * گرفتن پلن‌های محصول اصلی.
 *
 * چون فعلاً یک محصول داریم، اولین محصول فعالِ لیست انتخاب می‌شود.
 * وقتی محصول دوم اضافه شد، کافی است slug به‌عنوان آرگومان داده شود.
 *
 * خروجی: { plans, loading, error, retry }
 */
export function usePlans(slug = null) {
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                let target = slug
                if (!target) {
                    const products = await productService.getProducts()
                    const first = (products ?? []).find((p) => p.is_active && p.is_public)
                    if (!first) throw { message: 'محصولی یافت نشد' }
                    target = first.slug
                }

                const raw = await productService.getProductPlans(target)
                if (!cancelled) setPlans(mapPlans(raw ?? []))
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت اطلاعات پلن‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [slug, attempt])

    return {
        plans,
        loading,
        error,
        retry: () => setAttempt((n) => n + 1),
    }
}