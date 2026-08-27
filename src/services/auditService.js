import api from './api'

const unwrap = (res) => res.data?.data

/* ستون‌های قابل مرتب‌سازی — enum AuditLogSortBy بک‌اند */
export const AUDIT_SORT_BY = [
    'created_at',
    'actor_id',
    'action',
    'route',
    'method',
    'status_code',
    'success',
]

/**
 * سرویس لاگ ممیزی — ماژول `/audit/*`.
 *
 * هر رکورد یک عملیات حساس را ثبت می‌کند: چه کسی (actor)، چه کاری
 * (action)، از چه IP، با چه نتیجه‌ای (status_code / success).
 */
export const auditService = {
    /* GET /audit/ — فهرست لاگ‌ها.
       فیلترهای اختیاری زیادی دارد؛ فقط مقادیر داده‌شده ارسال می‌شوند
       تا کوئری بی‌مورد شلوغ نشود. */
    getLogs({
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc',
        ...filters
    } = {}) {
        const params = { page, limit, sort_by, sort_order }

        /* رشته‌ی خالی هم حذف می‌شود: بک‌اند آن را فیلترِ «برابر با
           هیچ» می‌گیرد و نتیجه‌ی خالی برمی‌گرداند. */
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params[key] = value
            }
        })

        return api.get('/audit/', { params }).then((res) => ({
            items: res.data?.data ?? [],
            pagination: res.data?.meta?.pagination ?? null,
        }))
    },

    /* GET /audit/{id} — جزئیات کامل یک لاگ شامل input_data/output_data */
    getLog(auditLogId) {
        return api.get(`/audit/${auditLogId}`).then(unwrap)
    },
}
