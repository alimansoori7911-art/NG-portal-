import { useCallback, useEffect, useState } from 'react'
import { ticketService } from '../../../services/ticketService'
import { adminUserService } from '../../../services/adminUserService'

/**
 * دپارتمان‌های تیکت و کاربران سیستم.
 *
 * فهرست کاربران هم گرفته می‌شود چون عضو دپارتمان با `user_id` عددی
 * ذخیره می‌شود و بدون این فهرست، UI فقط می‌تواند عدد خام نشان بدهد.
 *
 * ⚠️ `GET /ticketing/departments` فقط `id` و `slug` و `name` می‌دهد
 * (`TicketDepartmentListItemSchema`) — توضیح و تاریخ‌ها فقط در مسیر
 * تکی هستند. پس اگر `description` لازم شد باید جدا خوانده شود.
 */
export function useDepartments() {
    const [state, setState] = useState({
        key: null,
        departments: [],
        users: [],
        error: null,
    })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const key = String(attempt)

    useEffect(() => {
        let cancelled = false

        Promise.allSettled([
            ticketService.getDepartments(),
            adminUserService.getUsers({ limit: 100 }),
        ]).then(([d, u]) => {
            if (cancelled) return

            setState({
                key: String(attempt),
                departments: d.status === 'fulfilled' ? (d.value ?? []) : [],
                /* فهرست کاربران صفحه‌بندی‌شده است و `{items}` می‌دهد،
                   برخلاف دپارتمان‌ها که آرایه‌ی خام می‌دهند. */
                users: u.status === 'fulfilled' ? (u.value?.items ?? []) : [],
                error:
                    d.status === 'rejected'
                        ? d.reason?.message || 'دریافت دپارتمان‌ها ناموفق بود'
                        : null,
            })
        })

        return () => {
            cancelled = true
        }
    }, [attempt])

    const fresh = state.key === key
    return {
        departments: fresh ? state.departments : [],
        users: fresh ? state.users : [],
        error: fresh ? state.error : null,
        loading: !fresh,
        reload,
    }
}

/**
 * اعضای یک دپارتمان.
 */
export function useDepartmentMembers(departmentId) {
    const [state, setState] = useState({ key: null, items: [], error: null })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const key = departmentId ? `${departmentId}:${attempt}` : null

    useEffect(() => {
        if (!departmentId) return
        let cancelled = false

        ticketService
            .getDepartmentMembers(departmentId)
            .then((items) => {
                if (!cancelled) {
                    setState({
                        key: `${departmentId}:${attempt}`,
                        items: items ?? [],
                        error: null,
                    })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setState({
                        key: `${departmentId}:${attempt}`,
                        items: [],
                        error: err?.message || 'دریافت اعضا ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [departmentId, attempt])

    const fresh = state.key === key
    return {
        items: fresh ? state.items : [],
        error: fresh ? state.error : null,
        loading: Boolean(departmentId) && !fresh,
        reload,
    }
}

/**
 * ساخت، ویرایش و حذف دپارتمان و عضویت‌هایش.
 */
export function useDepartmentActions() {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const run = useCallback(async (fn) => {
        setBusy(true)
        setError(null)
        try {
            return (await fn()) ?? true
        } catch (err) {
            /* ⚠️ `api.js` هر ۴۰۹ را «قبلاً ثبت شده» ترجمه می‌کند، ولی
               اینجا ۴۰۹ یعنی نام تکراری **یا** دپارتمانی که هنوز تیکت
               دارد. همان راه‌حل کاتالوگ: با خواندن `code` پیام دقیق‌تر
               گذاشته می‌شود. */
            setError(
                (err?.code === 'CONFLICT'
                    ? 'این دپارتمان با چیزی تداخل دارد — ممکن است نامش تکراری باشد یا هنوز تیکت داشته باشد.'
                    : err?.message) || 'عملیات ناموفق بود'
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
        create: (d) => run(() => ticketService.createDepartment(d)),
        update: (id, d) => run(() => ticketService.updateDepartment(id, d)),
        remove: (id) => run(() => ticketService.deleteDepartment(id)),
        /* بک‌اند آرایه می‌گیرد، پس افزودن چندتایی یک درخواست است */
        addMembers: (id, userIds) =>
            run(() => ticketService.addDepartmentMembers(id, userIds)),
        /* ⚠️ حذف با `user_id` است نه شناسه‌ی ردیف عضویت */
        removeMember: (id, userId) =>
            run(() => ticketService.removeDepartmentMember(id, userId)),
    }
}
