import api from './api'

const unwrap = (res) => res.data?.data

/* نوع شناسه — enum IdentifierType بک‌اند */
export const IDENTIFIER_TYPE = {
    username: 'نام کاربری',
    email: 'ایمیل',
    phone: 'شماره تماس',
    national_id: 'کد ملی',
    landline: 'تلفن ثابت',
}

/* وضعیت احراز هویت — enum KycStatus */
export const KYC_STATUS = {
    not_started: 'شروع نشده',
    pending: 'در انتظار بررسی',
    verified: 'تأیید شده',
    failed: 'رد شده',
}

export const kycStatusLabel = (status) => KYC_STATUS[status] ?? status ?? ''

/**
 * استخراج مقدار یک شناسه از آرایه‌ی identifiers.
 *
 * ⚠️ این با `Profile` در `/auth/me` فرق دارد: آنجا شناسه‌ها فیلد
 * نام‌دار شده‌اند ولی `UserResponseSchema` (سمت ادمین) هنوز آرایه
 * می‌دهد. پس همان شکل قدیمی اینجا درست است.
 */
export const identifierOf = (user, type) =>
    user?.identifiers?.find((i) => i.type === type)?.value ?? ''

/**
 * سرویس مدیریت کاربران و نقش‌ها — ماژول `/admin/auth/*`.
 *
 * ⚠️ `UserUpdateSchema` فقط `is_active` و `is_blocked` را می‌پذیرد
 * (`additionalProperties: false`). یعنی ادمین نمی‌تواند ایمیل، نام
 * یا شماره‌ی کاربر را ویرایش کند — فقط فعال/مسدود کردن.
 */
export const adminUserService = {
    /* GET /admin/auth/users — لیست کاربران با صفحه‌بندی */
    getUsers({ page = 1, limit = 10 } = {}) {
        return api
            .get('/admin/auth/users', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/auth/users/{id} — یک کاربر با نقش‌ها و دسترسی‌ها */
    getUser(userId) {
        return api.get(`/admin/auth/users/${userId}`).then(unwrap)
    },

    /* PATCH /admin/auth/users/{id} — فقط فعال/مسدود کردن */
    updateUser(userId, { is_active, is_blocked } = {}) {
        const body = {}
        /* فیلد نافرستاده یعنی «تغییر نده»؛ فرستادن null آن را پاک می‌کند */
        if (is_active != null) body.is_active = is_active
        if (is_blocked != null) body.is_blocked = is_blocked

        return api.patch(`/admin/auth/users/${userId}`, body).then(unwrap)
    },

    /* DELETE /admin/auth/users/{id} */
    deleteUser(userId) {
        return api.delete(`/admin/auth/users/${userId}`).then(unwrap)
    },

    /* GET /admin/auth/admins — فقط کاربران دارای نقش ادمین */
    getAdmins({ page = 1, limit = 10 } = {}) {
        return api
            .get('/admin/auth/admins', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* ─── نقش‌ها ─── */

    /* GET /admin/auth/roles — فهرست نقش‌ها */
    getRoles({ page = 1, limit = 50 } = {}) {
        return api
            .get('/admin/auth/roles', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* POST /admin/auth/users/{id}/roles — تخصیص نقش به کاربر.
       AssignRoleSchema فقط یک role_id می‌گیرد، پس برای چند نقش باید
       چند بار صدا زده شود. */
    assignRole(userId, roleId) {
        return api
            .post(`/admin/auth/users/${userId}/roles`, { role_id: roleId })
            .then(unwrap)
    },
}
