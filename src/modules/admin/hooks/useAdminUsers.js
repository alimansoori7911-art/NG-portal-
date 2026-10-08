import { useCallback, useEffect, useState } from 'react'
import { adminUserService, identifierOf } from '../../../services/adminUserService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/* نام نقشی که یعنی کاربر VIP است.

   بک‌اند فیلد جداگانه‌ای برای VIP ندارد و قرار هم نیست داشته باشد:
   VIP یک **نقش RBAC** است، پس با همان `/admin/auth/roles` ساخته و با
   `/admin/auth/users/{id}/roles` به کاربر داده می‌شود — همان مسیری که
   دیالوگ «تغییر نقش» از قبل استفاده می‌کند.

   چند املا پذیرفته می‌شود چون اسم دقیق نقش را ادمین می‌سازد و ممکن
   است با حروف بزرگ یا فارسی ثبت شود. */
const VIP_ROLE_NAMES = ['vip', 'VIP', 'وی‌آی‌پی', 'ویژه']

const isVipRole = (name) =>
    VIP_ROLE_NAMES.some((v) => String(name).trim().toLowerCase() === v.toLowerCase())

/**
 * تبدیل UserResponseSchema به ردیف جدول کاربران.
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
        /* از روی نقش‌ها، نه یک فیلد جدا */
        vip: roleNames.some(isVipRole) ? 'VIP' : '—',
        /* ✅ اسپک ۲۱ مسیر grant/revoke داد. خودِ وضعیت همچنان از
           `roles` خوانده می‌شود چون `is_vip` روی فهرست کاربران نیست. */
        isVip: roleNames.some(isVipRole),
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

    /* فقط مدیران — `/admin/auth/users` فیلتر نقش **ندارد** (فقط page و
       limit)، پس تنها راه دیدن مدیران مسیر جدای
       `/admin/auth/admins` است. */
    const [adminsOnly, setAdminsOnly] = useState(false)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const toggleAdminsOnly = useCallback(() => {
        setAdminsOnly((v) => !v)
        /* فیلتر که عوض شد، ماندن در صفحه‌ی ۳ یعنی احتمالاً جدول خالی */
        setPage(1)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const fetcher = adminsOnly
                    ? adminUserService.getAdmins
                    : adminUserService.getUsers
                const { items, pagination } = await fetcher({
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
    }, [page, attempt, adminsOnly])

    return {
        rows,
        page,
        pageCount,
        loading,
        error,
        setPage,
        reload,
        adminsOnly,
        toggleAdminsOnly,
    }
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

        /* ✅ VIP — هر دو مسیر idempotent هستند، پس کلیک دوباره
           بی‌خطر است. */
        setVip: (userId, on) =>
            run(() =>
                on
                    ? adminUserService.grantVip(userId)
                    : adminUserService.revokeVip(userId)
            ),
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
