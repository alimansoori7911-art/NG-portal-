import { useCallback, useEffect, useState } from 'react'
import { adminUserService } from '../../../services/adminUserService'

/**
 * نقش‌ها و دسترسی‌ها.
 *
 * فهرست نقش و فهرست کل دسترسی‌ها با هم گرفته می‌شوند چون فرمِ نقش
 * بدون دانستن دسترسی‌های موجود قابل ساختن نیست.
 *
 * ⚠️ `is_system` یعنی نقش را خودِ سیستم ساخته (`admin`). حذف و تغییر
 * نامش ممنوع است چون جاهای دیگر کد به **نام** نقش تکیه کرده‌اند.
 */
export function useRolesAdmin() {
    const [state, setState] = useState({
        key: null,
        roles: [],
        permissions: [],
        error: null,
    })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const key = String(attempt)

    useEffect(() => {
        let cancelled = false

        Promise.all([
            adminUserService.getRoles({ limit: 100 }),
            adminUserService.getPermissions({ limit: 200 }),
        ])
            .then(async ([r, p]) => {
                if (cancelled) return

                /* تعداد کاربرِ هر نقش از `meta.pagination.total` همان
                   مسیر می‌آید؛ اسپک فیلدی روی خود نقش ندارد.

                   ⚠️ یک درخواست به‌ازای هر نقش است. چون نقش‌ها
                   انگشت‌شمارند قابل قبول است، ولی اگر زیاد شدند باید
                   از بک‌اند بخواهیم `user_count` را روی
                   `RoleResponseSchema` بگذارد. */
                const roles = await Promise.all(
                    (r.items ?? []).map(async (role) => {
                        try {
                            const { pagination } = await adminUserService.getRoleUsers(
                                role.id,
                                { limit: 1 }
                            )
                            return { ...role, user_count: pagination?.total ?? null }
                        } catch {
                            /* شمارش که نیامد نباید کل فهرست را بشکند */
                            return { ...role, user_count: null }
                        }
                    })
                )
                if (cancelled) return

                setState({
                    key: String(attempt),
                    roles,
                    permissions: p.items ?? [],
                    error: null,
                })
            })
            .catch((err) => {
                if (cancelled) return
                setState({
                    key: String(attempt),
                    roles: [],
                    permissions: [],
                    error: err?.message || 'دریافت نقش‌ها ناموفق بود',
                })
            })

        return () => {
            cancelled = true
        }
    }, [attempt])

    const fresh = state.key === key
    return {
        roles: fresh ? state.roles : [],
        permissions: fresh ? state.permissions : [],
        error: fresh ? state.error : null,
        loading: !fresh,
        reload,
    }
}

/**
 * دسترسی‌های یک نقش — فقط وقتی لازم است که فرم باز باشد.
 */
export function useRolePermissions(roleId) {
    const [state, setState] = useState({ id: null, keys: [], error: null })

    useEffect(() => {
        if (!roleId) return
        let cancelled = false

        adminUserService
            .getRolePermissions(roleId, { limit: 200 })
            .then(({ items }) => {
                if (!cancelled) {
                    setState({
                        id: roleId,
                        keys: (items ?? []).map((p) => p.key),
                        error: null,
                    })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setState({
                        id: roleId,
                        keys: [],
                        error: err?.message || 'دریافت دسترسی‌های نقش ناموفق بود',
                    })
                }
            })

        return () => {
            cancelled = true
        }
    }, [roleId])

    const fresh = state.id === roleId
    return {
        keys: fresh ? state.keys : [],
        error: fresh ? state.error : null,
        loading: Boolean(roleId) && !fresh,
    }
}

/**
 * ساخت، ویرایش، حذف نقش و تعیین دسترسی‌هایش.
 */
export function useRoleActions() {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    /* خروجی خودِ درخواست برگردانده می‌شود، نه فقط true/false.

       ساخت نقش و تعیین دسترسی‌هایش دو درخواست جدا هستند و دومی به
       شناسه‌ی نقشِ تازه نیاز دارد؛ بدون این، باید فهرست را دوباره
       می‌گرفتیم و با نام دنبالش می‌گشتیم — که اگر دو نقش هم‌نام شوند
       هم شکننده است هم یک رفت‌وبرگشت اضافه. */
    const run = useCallback(async (fn) => {
        setBusy(true)
        setError(null)
        try {
            return (await fn()) ?? true
        } catch (err) {
            setError(err?.message || 'عملیات ناموفق بود')
            return null
        } finally {
            setBusy(false)
        }
    }, [])

    return {
        busy,
        error,
        clearError: () => setError(null),
        create: (data) => run(() => adminUserService.createRole(data)),
        update: (id, changes) => run(() => adminUserService.updateRole(id, changes)),
        remove: (id) => run(() => adminUserService.deleteRole(id)),
        /* ⚠️ `AssignPermissionsSchema` دسترسی را با سه‌تایی
           `{module, resource, action}` می‌گیرد نه با id — پس کلیدها
           باید به همان شکل تبدیل شوند. */
        setPermissions: (id, permissions) =>
            run(() => adminUserService.assignRolePermissions(id, permissions)),
    }
}
