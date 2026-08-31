import api from './api'

const unwrap = (res) => res.data?.data

/* وضعیت‌های تیکت — enum TicketStatus بک‌اند */
export const TICKET_STATUS = {
    open: 'باز',
    in_progress: 'در حال بررسی',
    waiting_for_customer: 'در انتظار پاسخ شما',
    resolved: 'رسیدگی شد',
    closed: 'بسته شده',
    cancelled: 'لغو شده',
    spam: 'اسپم',
}

export const ticketStatusLabel = (status) => TICKET_STATUS[status] ?? status ?? ''

/* وضعیت‌هایی که یعنی تیکت هنوز باز است و کاربر می‌تواند پیام بفرستد */
const OPEN_STATUSES = new Set(['open', 'in_progress', 'waiting_for_customer'])
export const isTicketOpen = (status) => OPEN_STATUSES.has(status)

/* نوع پیام — enum TicketMessageType.
   internal_note فقط بین کارشناسان است و به کاربر نشان داده نمی‌شود. */
export const MESSAGE_TYPE = {
    PUBLIC: 'public',
    INTERNAL: 'internal_note',
    SYSTEM: 'system',
}

/**
 * سرویس تیکتینگ — ماژول ticketing بک‌اند.
 *
 * همه‌ی اندپوینت‌ها نیاز به لاگین دارند.
 * پاسخ‌ها در قالب { data, meta } هستند.
 *
 * نکته‌ی مهم درباره‌ی ساخت تیکت:
 * TicketCreateSchema فقط department_id و subject می‌گیرد — جای
 * «توضیحات» ندارد. بنابراین متن توضیحات کاربر به‌صورت اولین پیامِ
 * تیکت با /reply ثبت می‌شود.
 */
export const ticketService = {
    /* GET /ticketing/departments — لیست دپارتمان‌ها.
       بدون صفحه‌بندی؛ خروجی: [{ id (uuid), slug, name }] */
    getDepartments() {
        return api.get('/ticketing/departments').then(unwrap)
    },

    /* GET /ticketing/departments/{id} — جزئیات یک دپارتمان */
    getDepartment(departmentId) {
        return api.get(`/ticketing/departments/${departmentId}`).then(unwrap)
    },

    /* GET /ticketing/tickets — لیست تیکت‌ها با صفحه‌بندی.
       فیلترها: q (جستجوی متنی)، department_id، status، assigned_to_user_id
       include=['messages'] پیام‌ها را هم می‌آورد.

       مثل getOrders کل پاسخ برگردانده می‌شود چون صفحه به
       meta.pagination نیاز دارد. */
    getTickets({
        page = 1,
        limit = 10,
        q,
        department_id,
        status,
        assigned_to_user_id,
        include,
    } = {}) {
        return api
            .get('/ticketing/tickets', {
                params: {
                    page,
                    limit,
                    q,
                    department_id,
                    status,
                    assigned_to_user_id,
                    include,
                },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/tickets — تیکت‌های **همه‌ی** کاربران (اسپک ۱۵).

       پارامترهایش دقیقاً مثل `/ticketing/tickets` است؛ فرقش دامنه
       است: آن یکی فقط تیکت‌های کاربر جاری را می‌دهد.

       ⚠️ هنوز فیلتر «صاحب تیکت» ندارد (`assigned_to_user_id` کارشناس
       است)، پس جدول تیکت در پروفایل جامع کاربر همچنان بلاک است. */
    getAdminTickets({ page = 1, limit = 10, q, department_id, status, assigned_to_user_id, is_locked, include } = {}) {
        return api
            .get('/admin/tickets', {
                params: { page, limit, q, department_id, status, assigned_to_user_id, is_locked, include },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /ticketing/tickets/{id} — جزئیات تیکت به‌همراه messages */
    getTicket(ticketId) {
        return api.get(`/ticketing/tickets/${ticketId}`).then(unwrap)
    },

    /* GET /ticketing/tickets/{id}/messages — فقط پیام‌ها.
       برای تازه‌سازی گفتگو بدون گرفتن دوباره‌ی کل تیکت. */
    getMessages(ticketId) {
        return api.get(`/ticketing/tickets/${ticketId}/messages`).then(unwrap)
    },

    /* POST /ticketing/tickets — ثبت تیکت جدید.
       subject حداقل ۳ و حداکثر ۲۵۵ کاراکتر. */
    createTicket({ department_id, subject }) {
        return api
            .post('/ticketing/tickets', { department_id, subject })
            .then(unwrap)
    },

    /* POST /ticketing/tickets/{id}/reply — افزودن پیام.
       message_type پیش‌فرض public است؛ کاربر عادی همیشه public
       می‌فرستد و internal_note مخصوص پنل ادمین است. */
    reply(ticketId, message, messageType = MESSAGE_TYPE.PUBLIC) {
        return api
            .post(`/ticketing/tickets/${ticketId}/reply`, {
                message,
                message_type: messageType,
            })
            .then(unwrap)
    },

    /* GET /ticketing/tickets/{id}/messages/{mid}/attachments — توکن آپلود.

       ⚠️ با اینکه «خواندن» به نظر می‌رسد، متدش GET است ولی ۲۰۱
       برمی‌گرداند و یک JWT یک‌بارمصرف می‌دهد.

       برخلاف نسخه‌ی پرداخت، این یکی **پیام موجود** را هدف می‌گیرد
       (`message_id` در مسیر) و بدنه ندارد؛ پس اول باید پیام ارسال
       شود و بعد فایل به آن پیوست شود.

       هر توکن فقط **یک فایل** می‌گیرد. */
    requestMessageUploadToken(ticketId, messageId) {
        return api
            .get(`/ticketing/tickets/${ticketId}/messages/${messageId}/attachments`)
            .then(unwrap)
    },

    /* PATCH /ticketing/tickets/{id} — ویرایش تیکت.
       هر فیلدی که ارسال نشود بدون تغییر می‌ماند.
       assigned_to_user_id = null یعنی برداشتن تخصیص. */
    updateTicket(ticketId, { subject, status, department_id, assigned_to_user_id }) {
        return api
            .patch(`/ticketing/tickets/${ticketId}`, {
                subject,
                status,
                department_id,
                assigned_to_user_id,
            })
            .then(unwrap)
    },

    /* ─── اندپوینت‌های ادمین ─── */

    /* POST /admin/departments — ساخت دپارتمان */
    createDepartment({ name, description }) {
        return api.post('/admin/departments', { name, description }).then(unwrap)
    },

    /* PATCH /admin/departments/{id} — ویرایش دپارتمان */
    updateDepartment(departmentId, { name, description }) {
        return api
            .patch(`/admin/departments/${departmentId}`, { name, description })
            .then(unwrap)
    },

    /* DELETE /admin/departments/{id} — حذف دپارتمان */
    deleteDepartment(departmentId) {
        return api.delete(`/admin/departments/${departmentId}`)
    },

    /* GET /admin/departments/{id}/members — اعضای دپارتمان */
    getDepartmentMembers(departmentId) {
        return api.get(`/admin/departments/${departmentId}/members`).then(unwrap)
    },

    /* POST /admin/departments/{id}/members — افزودن عضو.
       بک‌اند آرایه‌ای از شناسه‌ها می‌گیرد (user_id: [1,2,3]). */
    addDepartmentMembers(departmentId, userIds) {
        return api
            .post(`/admin/departments/${departmentId}/members`, {
                user_id: Array.isArray(userIds) ? userIds : [userIds],
            })
            .then(unwrap)
    },

    /* DELETE /admin/departments/{id}/members/{user_id} — حذف عضو */
    removeDepartmentMember(departmentId, userId) {
        return api.delete(`/admin/departments/${departmentId}/members/${userId}`)
    },
}
