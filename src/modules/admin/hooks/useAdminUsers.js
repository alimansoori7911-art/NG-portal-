import { useCallback, useEffect, useState } from 'react'
import { adminUserService, identifierOf } from '../../../services/adminUserService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/**
 * تبدیل UserResponseSchema به ردیف جدول کاربران.
 *
 * ⚠️ ستون «برچسب VIP» در فیگما هست ولی بک‌اند چنین مفهومی ندارد.
 * تا اضافه شدن، خط تیره نشان داده می‌شود — نه «غیرفعال» که دروغ است.
 *
 * نقش‌ها آرایه‌ای از UserRoleResponseSchema هستند و نام واقعی نقش
 * یک لایه تودرتوست: role.name
 */
function toRow(user, i, offset) {
    const { date } = formatJalaliDateTime(user.created_at)

    const roleNames = (user.roles ?? [])
        .map((r) => r.role?.name)
        .filter(Boolean)

    return {
        id: user.id,
        index: offset + i + 1,
        email: identifierOf(user, 'email') || '—',
        username: identifierOf(user, 'username') || '—',
        phone: identifierOf(user, 'phone') || '—',
        status: user.is_active ? 'فعال' : 'غیرفعال',
        role: roleNames.length > 0 ? roleNames.join('، ') : 'کاربر عادی',
        /* بک‌اند فیلد VIP ندارد — رجوع به BACKEND_NEEDS.md */
        vip: '—',
        registeredAt: date || '—',
        /* داده‌ی خام برای نوار عملیات و مودال پروفایل */
        raw: user,
    }
}

/**
 * کاربران سیستم برای پنل ادمین — صفحه‌بندی سمت سرور.
 */
export function useAdminUsers() {
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
                const { items, pagination } = await adminUserService.getUsers({
                    page,
                    limit: ROWS_PER_PAGE,
                })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE
                setRows((items ?? []).map((u, i) => toRow(u, i, offset)))
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت کاربران ناموفق بود')
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

/**
 * عملیات روی یک کاربر: تغییر وضعیت، حذف، تخصیص نقش.
 *
 * ⚠️ «ویرایش اطلاعات» که در فیگما هست پیاده نشده چون
 * `UserUpdateSchema` فقط `is_active` و `is_blocked` می‌پذیرد
 * (`additionalProperties: false`). ایمیل/نام/شماره قابل ویرایش نیست.
 */
export function useUserActions(onDone) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const run = useCallback(
        async (fn) => {
            setBusy(true)
            setError(null)
            try {
                await fn()
                onDone?.()
                return true
            } catch (err) {
                setError(err?.message || 'عملیات ناموفق بود')
                return false
            } finally {
                setBusy(false)
            }
        },
        [onDone]
    )

    return {
        busy,
        error,
        clearError: () => setError(null),

        toggleActive: (user) =>
            run(() =>
                adminUserService.updateUser(user.id, { is_active: !user.is_active })
            ),

        remove: (userId) => run(() => adminUserService.deleteUser(userId)),

        assignRole: (userId, roleId) =>
            run(() => adminUserService.assignRole(userId, roleId)),
    }
}

/**
 * فهرست نقش‌ها — برای دیالوگ «تغییر نقش».
 *
 * جدا از لیست کاربران بارگذاری می‌شود و فقط وقتی لازم است
 * (`enabled`) تا هر بار باز شدن صفحه یک درخواست اضافه نزند.
 */
export function useRoles(enabled = true) {
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!enabled) return
        let cancelled = false

        async function load() {
            setLoading(true)
            try {
                const { items } = await adminUserService.getRoles()
                if (!cancelled) {
                    setRoles(items ?? [])
                    setError(null)
                }
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت نقش‌ها ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [enabled])

    return { roles, loading, error }
}
