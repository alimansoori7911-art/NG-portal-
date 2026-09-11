import { useEffect, useState } from 'react'
import { adminCatalogService } from '../../../services/adminCatalogService'

/**
 * فقط «مدت‌های اعتبار» فعال.
 *
 * جدا از `useCatalog` است چون آن هوک پلن‌ها، قابلیت‌ها و محصولات را
 * هم می‌گیرد (چهار درخواست). صفحه‌ی فروش برای فرم پیش‌فاکتور تنها به
 * همین لیست نیاز دارد.
 *
 * `enabled` تا وقتی فرم باز نشده جلوی درخواست بی‌مورد را می‌گیرد.
 */
export function useBillingTerms(enabled = true) {
    const [terms, setTerms] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!enabled) return
        let cancelled = false

        /* `setLoading(true)` عمداً داخل تابع async است نه در بدنه‌ی
           افکت: تغییر state به‌صورت همگام در افکت یک رندر آبشاری
           اضافه می‌سازد (و لینت هم می‌گیردش). */
        async function load() {
            setLoading(true)
            try {
                const list = await adminCatalogService.getBillingTerms({
                    is_active: true,
                })
                if (!cancelled) setTerms(list ?? [])
            } catch {
                /* فرم خودش پیام «مدتی تعریف نشده» را نشان می‌دهد */
                if (!cancelled) setTerms([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [enabled])

    return { terms, loading }
}
