import { useCallback, useEffect, useState } from 'react'
import {
    notificationService,
    channelLabel,
} from '../../../services/notificationService'
import { formatJalaliDateTime } from '../../../utils/datetime'

/**
 * تبدیل NotificationTemplateResponse به ردیف جدول.
 *
 * ستون «کانال» فیگما یک مقدار داشت ولی بک‌اند آرایه می‌دهد
 * (یک قالب می‌تواند هم in_app باشد هم sms)، پس با «،» جدا می‌شوند.
 */
function toRow(t, i, offset) {
    const { date } = formatJalaliDateTime(t.created_at)

    return {
        id: t.id,
        index: offset + i + 1,
        title: t.title,
        channel: (t.default_channels ?? []).map(channelLabel).join('، ') || '—',
        publishedAt: date || '—',
        /* برای فرم ارسال لازم است */
        key: t.key,
        variables: t.variables ?? [],
        isActive: t.is_active,
    }
}

const PER_PAGE = 9

/**
 * قالب‌های اعلان — جدول تب «ارسال نوتیفیکیشن» پنل ادمین.
 *
 * ارسال اعلان در بک‌اند فقط از روی قالب ممکن است، پس این هوک
 * هم جدول را پر می‌کند و هم فهرست قالب‌ها را برای فرم ارسال می‌دهد.
 */
export function useNotificationTemplates() {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } = await notificationService.getTemplates({
                    page,
                    limit: PER_PAGE,
                })
                if (cancelled) return

                const offset = (page - 1) * PER_PAGE
                setRows((items ?? []).map((t, i) => toRow(t, i, offset)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت قالب‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt])

    return { rows, page, pageCount, loading, error, setPage, reload }
}
