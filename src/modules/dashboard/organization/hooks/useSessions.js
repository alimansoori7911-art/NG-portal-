import { useCallback, useEffect, useState } from 'react'
import { authService } from '../../../../services/authService'

/* هر صفحه ۱۰ ردیف — هم‌راستا با بقیه‌ی جدول‌های داشبورد */
export const SESSIONS_PER_PAGE = 10

/**
 * نشست‌های فعال کاربر.
 *
 * ⚠️ نکته‌ی مهم: `id` و `session_id` دو چیز متفاوت‌اند.
 * `id` شناسه‌ی خود رکورد refresh-token است ولی حذف با `session_id`
 * انجام می‌شود (`DELETE /auth/sessions/{session_id}`). اشتباه گرفتن
 * این دو یعنی حذف کار نمی‌کند.
 */
export function useSessions() {
    const [sessions, setSessions] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [working, setWorking] = useState(false)
    const [actionError, setActionError] = useState(null)

    const load = useCallback(
        async ({ silent = false } = {}) => {
            if (!silent) setLoading(true)
            try {
                const { items, pagination } = await authService.getSessions({
                    page,
                    limit: SESSIONS_PER_PAGE,
                })
                /* نشست باطل‌شده نباید در فهرست بماند */
                setSessions((items ?? []).filter((s) => !s.revoked))
                setPageCount(pagination?.total_pages ?? 1)
                setError(null)
            } catch (err) {
                if (!silent) setError(err?.message || 'دریافت نشست‌ها ناموفق بود')
            } finally {
                if (!silent) setLoading(false)
            }
        },
        [page]
    )

    useEffect(() => {
        load()
    }, [load])

    /* حذف یک نشست — با session_id نه id */
    const removeSession = useCallback(
        async (sessionId) => {
            setWorking(true)
            setActionError(null)
            try {
                await authService.removeSession(sessionId)
                await load({ silent: true })
                return true
            } catch (err) {
                setActionError(err?.message || 'بستن نشست ناموفق بود')
                return false
            } finally {
                setWorking(false)
            }
        },
        [load]
    )

    /* حذف همه — نشست خودِ این مرورگر هم باطل می‌شود، پس صفحه بعد از
       این باید کاربر را خارج کند. تصمیمش با فراخوان است نه اینجا. */
    const removeAllSessions = useCallback(async () => {
        setWorking(true)
        setActionError(null)
        try {
            await authService.removeAllSessions()
            return true
        } catch (err) {
            setActionError(err?.message || 'خروج از همه دستگاه‌ها ناموفق بود')
            return false
        } finally {
            setWorking(false)
        }
    }, [])

    return {
        sessions,
        page,
        pageCount,
        loading,
        error,
        working,
        actionError,
        setPage,
        removeSession,
        removeAllSessions,
        reload: load,
    }
}
