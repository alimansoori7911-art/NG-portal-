import api from './api'

const unwrap = (res) => res.data?.data

/* نوع تخفیف — enum `DiscountType` */
export const DISCOUNT_TYPE = {
    PERCENT: 'درصدی',
    FIXED: 'مبلغ ثابت',
}

export const discountTypeLabel = (type) => DISCOUNT_TYPE[type] ?? type ?? ''

/* دامنه‌ی اعمال — enum `DiscountTargetType` */
export const DISCOUNT_TARGET = {
    ALL: 'همه‌ی کاربران',
    USER: 'کاربران مشخص',
    ORGANIZATION: 'یک سازمان',
}

export const discountTargetLabel = (target) =>
    DISCOUNT_TARGET[target] ?? target ?? ''

/**
 * وضعیت نمایشی یک کد تخفیف.
 *
 * بک‌اند فیلد «وضعیت» ندارد؛ از ترکیب `is_revoked`، تاریخ انقضا و
 * `remaining_usage` ساخته می‌شود. ترتیب مهم است: کد باطل‌شده حتی اگر
 * منقضی هم باشد، «باطل شده» است نه «منقضی».
 */
export function discountState(d) {
    if (d?.is_revoked) return { key: 'revoked', label: 'باطل شده' }

    if (d?.valid_until && new Date(d.valid_until) < new Date()) {
        return { key: 'expired', label: 'منقضی' }
    }

    /* `remaining_usage` تهی یعنی نامحدود، نه تمام‌شده */
    if (typeof d?.remaining_usage === 'number' && d.remaining_usage <= 0) {
        return { key: 'used', label: 'سقف تمام شد' }
    }

    return { key: 'active', label: 'فعال' }
}

/**
 * کدهای تخفیف — ماژول `/admin/discount/*`.
 *
 * ⚠️ `DELETE` کد را **باطل** می‌کند نه حذف: در پاسخ `is_revoked` و
 * `revoked_at` پر می‌شوند و رکورد می‌ماند. برای همین در UI «باطل
 * کردن» نوشته شده نه «حذف».
 */
export const discountService = {
    /* GET /admin/discount/ — فهرست با فیلتر و مرتب‌سازی.
       پیش‌فرض بک‌اند منقضی‌ها را نشان نمی‌دهد (`include_expired=false`). */
    getDiscounts({
        page = 1,
        limit = 10,
        is_revoked,
        discount_type,
        target_type,
        include_expired = true,
        sort_by = 'created_at',
        sort_order = 'desc',
    } = {}) {
        return api
            .get('/admin/discount/', {
                params: {
                    page,
                    limit,
                    is_revoked,
                    discount_type,
                    target_type,
                    include_expired,
                    sort_by,
                    sort_order,
                },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/discount/{id} — جزئیات به‌همراه `usages` */
    getDiscount(id) {
        return api.get(`/admin/discount/${id}`).then(unwrap)
    },

    /* POST /admin/discount/ — ساخت کد.

       `target_user_public_ids` آرایه‌ی **UUID عمومی** کاربران است، نه
       شناسه‌ی عددی؛ فقط وقتی `target_type === 'USER'` معنا دارد.

       `send_notification` یعنی بک‌اند خودش به گیرنده‌ها اعلان بدهد. */
    createDiscount({
        code,
        discount_type,
        value,
        valid_until,
        max_usage,
        target_type = 'ALL',
        target_user_public_ids,
        organization_id,
        comment,
        send_notification = false,
    }) {
        return api
            .post('/admin/discount/', {
                code,
                discount_type,
                value,
                valid_until,
                max_usage,
                target_type,
                target_user_public_ids,
                organization_id,
                comment,
                send_notification,
            })
            .then(unwrap)
    },

    /* PUT /admin/discount/{id} — ویرایش.

       ⚠️ `code` و `discount_type` در `DiscountUpdate` نیستند: کد پس از
       صدور عوض نمی‌شود چون ممکن است دست کاربر باشد. */
    updateDiscount(id, changes) {
        return api.put(`/admin/discount/${id}`, changes).then(unwrap)
    },

    /* DELETE /admin/discount/{id} — باطل کردن (نه حذف) */
    revokeDiscount(id) {
        return api.delete(`/admin/discount/${id}`).then(unwrap)
    },

    /* GET /user/discount/ — کدهای در دسترسِ کاربر جاری */
    getMyDiscounts({ page = 1, limit = 10 } = {}) {
        return api
            .get('/user/discount/', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },
}
