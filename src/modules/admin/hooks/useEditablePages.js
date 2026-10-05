import { useCallback, useEffect, useState } from 'react'
import { cmsService } from '../../../services/cmsService'

/**
 * صفحه‌های ساختاریافته‌ای که این کاربر اجازه‌ی ویرایششان را دارد،
 * به‌همراه بلوک‌ها و فیلدهای مجاز.
 *
 * `GET /admin/cms/editable-pages` خودش مشخصات فیلدها را می‌دهد
 * (`kind`، `required`، `max_length`) و اسپک صراحتاً می‌گوید هدفش این
 * است که «ویرایشگر فرم درست را بسازد و فیلدی که بک‌اند قبول نمی‌کند
 * پیشنهاد ندهد». پس فرم از روی همین داده ساخته می‌شود، نه از روی یک
 * ساختار ثابت در فرانت.
 */
export function useEditablePages() {
    const [result, setResult] = useState({ key: null, rows: [], error: null })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const key = String(attempt)

    useEffect(() => {
        let cancelled = false

        cmsService
            .getEditablePages()
            .then((items) => {
                if (!cancelled) {
                    setResult({ key: String(attempt), rows: items ?? [], error: null })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setResult({
                        key: String(attempt),
                        rows: [],
                        error: err?.message || 'دریافت صفحه‌های ساختاریافته ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [attempt])

    const fresh = result.key === key
    return {
        rows: fresh ? result.rows : [],
        error: fresh ? result.error : null,
        loading: !fresh,
        reload,
    }
}
