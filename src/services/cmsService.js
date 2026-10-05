import api from './api'

const unwrap = (res) => res.data?.data

/* نوع صفحه — enum `PageKind`.

   STRUCTURED یعنی صفحه‌ای که قالبِ از پیش تعریف‌شده دارد (بلوک‌هایش
   از `structured-schemas` می‌آید و ادمین فقط متنشان را عوض می‌کند).
   ARTICLE یعنی مقاله‌ی آزاد با یک متن کامل. */
export const PAGE_KIND = {
    ARTICLE: 'مقاله',
    STRUCTURED: 'صفحه‌ی ساختاریافته',
}

export const pageKindLabel = (k) => PAGE_KIND[k] ?? k ?? ''

/* وضعیت انتشار — enum `ContentStatus` */
export const PAGE_STATUS = {
    DRAFT: 'پیش‌نویس',
    PUBLISHED: 'منتشرشده',
}

export const pageStatusLabel = (s) => PAGE_STATUS[s] ?? s ?? ''

/* قالب محتوا — enum `ContentFormat` */
export const CONTENT_FORMAT = {
    HTML: 'HTML',
    MARKDOWN: 'Markdown',
}

/* دستور موتور جستجو — enum `Robots` */
export const ROBOTS = {
    INDEX: 'ایندکس شود',
    NOINDEX: 'ایندکس نشود',
    NOFOLLOW: 'لینک‌ها دنبال نشوند',
    NOINDEX_NOFOLLOW: 'نه ایندکس نه دنبال کردن',
    NONE: 'بدون دستور',
}

/**
 * وضعیت نمایشی صفحه.
 *
 * بک‌اند `status` را دارد ولی دو حالت دیگر هم مهم‌اند که از فیلدهای
 * جدا می‌آیند: صفحه‌ی حذف‌شده (`deleted_at`) و صفحه‌ای که منتشر شده
 * ولی تغییرات ذخیره‌نشده دارد (`has_unpublished_changes`).
 *
 * ترتیب مهم است: صفحه‌ی حذف‌شده هر وضعیت دیگری هم داشته باشد،
 * «حذف‌شده» است.
 */
export function pageState(p) {
    if (p?.deleted_at) return { key: 'deleted', label: 'حذف‌شده' }
    if (p?.status === 'PUBLISHED' && p?.has_unpublished_changes) {
        return { key: 'modified', label: 'تغییر منتشرنشده' }
    }
    if (p?.status === 'PUBLISHED') return { key: 'published', label: 'منتشرشده' }
    return { key: 'draft', label: 'پیش‌نویس' }
}

/**
 * مدیریت محتوا — ماژول `/admin/cms/*` و `/cms/*`.
 *
 * ⚠️ `DELETE` حذف نرم است: `deleted_at` پر می‌شود و صفحه با
 * `/restore` برمی‌گردد. صفحه‌های حذف‌شده فقط با
 * `include_deleted=true` در فهرست می‌آیند.
 */
export const cmsService = {
    /* GET /admin/cms/pages — فهرست با فیلتر.

       `include_deleted` پیش‌فرضِ بک‌اند false است؛ اینجا به‌صورت
       پارامتر می‌آید تا صفحه بتواند «نمایش حذف‌شده‌ها» داشته باشد. */
    getPages({
        page = 1,
        limit = 10,
        kind,
        status,
        is_public,
        tag,
        include_deleted = false,
        sort_by = 'created_at',
        sort_order = 'desc',
    } = {}) {
        return api
            .get('/admin/cms/pages', {
                params: {
                    page,
                    limit,
                    kind,
                    status,
                    is_public,
                    tag,
                    include_deleted,
                    sort_by,
                    sort_order,
                },
            })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/cms/pages/{id} — صفحه با بلوک‌ها و محتوای کامل */
    getPage(id) {
        return api.get(`/admin/cms/pages/${id}`).then(unwrap)
    },

    /* POST /admin/cms/pages — ساخت صفحه.
       `slug` اختیاری است؛ نیامدنش یعنی بک‌اند از عنوان می‌سازد. */
    createPage(payload) {
        return api.post('/admin/cms/pages', payload).then(unwrap)
    },

    /* PUT /admin/cms/pages/{id} — ویرایش.
       هر ویرایش یک نسخه‌ی تازه می‌سازد و `version_counter` جلو می‌رود. */
    updatePage(id, changes) {
        return api.put(`/admin/cms/pages/${id}`, changes).then(unwrap)
    },

    /* DELETE /admin/cms/pages/{id} — حذف نرم */
    deletePage(id) {
        return api.delete(`/admin/cms/pages/${id}`).then(unwrap)
    },

    /* POST /admin/cms/pages/{id}/restore — برگرداندن صفحه‌ی حذف‌شده */
    restorePage(id) {
        return api.post(`/admin/cms/pages/${id}/restore`).then(unwrap)
    },

    /* POST /admin/cms/pages/{id}/publish — انتشار نسخه‌ی جاری */
    publishPage(id) {
        return api.post(`/admin/cms/pages/${id}/publish`).then(unwrap)
    },

    /* GET /admin/cms/pages/{id}/preview — پیش‌نمایش.
       `version` که ندهیم یعنی نسخه‌ی جاری. */
    previewPage(id, { version } = {}) {
        return api
            .get(`/admin/cms/pages/${id}/preview`, { params: { version } })
            .then(unwrap)
    },

    /* GET /admin/cms/pages/{id}/versions — تاریخچه‌ی نسخه‌ها */
    getVersions(id, { page = 1, limit = 20 } = {}) {
        return api
            .get(`/admin/cms/pages/${id}/versions`, { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/cms/pages/{id}/versions/{version} — یک نسخه‌ی مشخص */
    getVersion(id, version) {
        return api.get(`/admin/cms/pages/${id}/versions/${version}`).then(unwrap)
    },

    /* GET /admin/cms/editable-pages — صفحه‌هایی که این کاربر اجازه‌ی
       ویرایششان را دارد، به‌همراه بلوک‌های قابل ویرایش. */
    getEditablePages() {
        return api.get('/admin/cms/editable-pages').then(unwrap)
    },

    /* GET /admin/cms/structured-schemas — قالب صفحه‌های ساختاریافته */
    getStructuredSchemas() {
        return api.get('/admin/cms/structured-schemas').then(unwrap)
    },

    /* GET /admin/cms/redirects — ریدایرکت‌های اسلاگ قدیمی به جدید */
    getRedirects({ page = 1, limit = 20 } = {}) {
        return api
            .get('/admin/cms/redirects', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* ── عمومی (بدون نیاز به ادمین) ── */

    /* GET /cms/pages — مقاله‌های منتشرشده */
    getPublicPages({ page = 1, limit = 10, tag } = {}) {
        return api
            .get('/cms/pages', { params: { page, limit, tag } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /cms/pages/{slug} — یک صفحه‌ی منتشرشده */
    getPublicPage(slug) {
        return api.get(`/cms/pages/${slug}`).then(unwrap)
    },

    /* GET /cms/redirects/{slug} — اسلاگ قدیمی به کجا می‌رود */
    resolveRedirect(slug) {
        return api.get(`/cms/redirects/${slug}`).then(unwrap)
    },
}
