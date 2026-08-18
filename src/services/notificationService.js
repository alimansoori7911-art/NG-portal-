import api from './api'

const unwrap = (res) => res.data?.data

/* نوع اعلان — enum NotificationType بک‌اند */
export const NOTIFICATION_TYPE = {
    system: 'سیستمی',
    kyc: 'احراز هویت',
    ticket: 'تیکت',
    order: 'سفارش',
    security: 'امنیتی',
}

export const notificationTypeLabel = (type) =>
    NOTIFICATION_TYPE[type] ?? type ?? ''

/* کانال ارسال — enum NotificationChannel.
   بک‌اند فقط این دو را دارد؛ فیگما «E-mail» هم داشت که وجود ندارد. */
export const NOTIFICATION_CHANNEL = {
    in_app: 'اعلان درون‌برنامه‌ای',
    sms: 'پیامک',
}

export const channelLabel = (channel) =>
    NOTIFICATION_CHANNEL[channel] ?? channel ?? ''

/* حداکثر تعداد در عملیات گروهی — طبق MarkReadRequest بک‌اند */
export const BULK_LIMIT = 100

/**
 * سرویس اعلان‌ها — ماژول notifications بک‌اند.
 *
 * اعلان‌ها از روی «قالب» (template) ساخته می‌شوند: ادمین قالب را با
 * جای‌گذارهای {variable} می‌سازد و هنگام ارسال، مقادیر را در payload
 * می‌فرستد. بک‌اند خودش متن نهایی را می‌سازد.
 */
export const notificationService = {
    /* GET /notifications/ — لیست اعلان‌های کاربر جاری.
       read_only=true فقط نخوانده‌ها را می‌دهد.

       مثل بقیه‌ی لیست‌ها کل پاسخ برگردانده می‌شود چون صفحه به
       meta.pagination نیاز دارد. */
    getNotifications({ page = 1, limit = 10, read_only } = {}) {
        return api
            .get('/notifications/', { params: { page, limit, read_only } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /notifications/{id} — یک اعلان */
    getNotification(id) {
        return api.get(`/notifications/${id}`).then(unwrap)
    },

    /* PATCH /notifications/{id}/read — علامت‌زدن به‌عنوان خوانده‌شده */
    markRead(id) {
        return api.patch(`/notifications/${id}/read`).then(unwrap)
    },

    /* PATCH /notifications/bulk/read — علامت‌زدن گروهی (حداکثر ۱۰۰).
       خروجی: { affected, notification_ids } */
    markManyRead(ids) {
        return api
            .patch('/notifications/bulk/read', {
                notification_ids: ids.slice(0, BULK_LIMIT),
            })
            .then(unwrap)
    },

    /* DELETE /notifications/{id} — حذف یک اعلان */
    remove(id) {
        return api.delete(`/notifications/${id}`)
    },

    /* DELETE /notifications/bulk — حذف گروهی (soft delete، حداکثر ۱۰۰) */
    removeMany(ids) {
        return api
            .delete('/notifications/bulk', {
                data: { notification_ids: ids.slice(0, BULK_LIMIT) },
            })
            .then(unwrap)
    },

    /* ─── اندپوینت‌های ادمین ─── */

    /* GET /admin/notifications/templates — لیست قالب‌ها */
    getTemplates({ page = 1, limit = 20, is_active } = {}) {
        return api
            .get('/admin/notifications/templates', {
                params: { page, limit, is_active },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/notifications/templates/{id} */
    getTemplate(templateId) {
        return api.get(`/admin/notifications/templates/${templateId}`).then(unwrap)
    },

    /* POST /admin/notifications/templates — ساخت قالب.
       key باید snake_case باشد (^[a-z][a-z0-9_]*$).
       variables نام جای‌گذارهایی است که در title/body آمده‌اند. */
    createTemplate({
        key,
        type,
        title,
        body,
        sms_body,
        default_channels = ['in_app'],
        variables = [],
        is_active = true,
    }) {
        return api
            .post('/admin/notifications/templates', {
                key,
                type,
                title,
                body,
                sms_body,
                default_channels,
                variables,
                is_active,
            })
            .then(unwrap)
    },

    /* PATCH /admin/notifications/templates/{id} — ویرایش قالب */
    updateTemplate(templateId, changes) {
        return api
            .patch(`/admin/notifications/templates/${templateId}`, changes)
            .then(unwrap)
    },

    /* DELETE /admin/notifications/templates/{id} */
    deleteTemplate(templateId) {
        return api.delete(`/admin/notifications/templates/${templateId}`)
    },

    /* POST /admin/notifications — ارسال اعلان به یک یا چند کاربر.
       broadcast=true یعنی همه‌ی کاربران؛ در این حالت بک‌اند
       recipient_ids را نادیده می‌گیرد.

       payload باید همه‌ی متغیرهای قالب را داشته باشد وگرنه بک‌اند
       خطا می‌دهد. */
    send({
        template_key,
        recipient_ids = [],
        broadcast = false,
        payload = {},
        dedup_key,
        dedup_window_seconds,
    }) {
        /* نکته: اسپک recipient_ids را با minItems=1 اجباری کرده، ولی
           توضیح broadcast می‌گوید در آن حالت نادیده گرفته می‌شود.
           یعنی برای ارسال همگانی معلوم نیست چه باید فرستاد.
           در BACKEND_NEEDS.md ثبت شده تا بک‌اند روشن کند. */
        return api
            .post('/admin/notifications', {
                template_key,
                recipient_ids,
                broadcast,
                payload,
                dedup_key,
                dedup_window_seconds,
            })
            .then(unwrap)
    },
}
