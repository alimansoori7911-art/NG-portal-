import api from './api'

const unwrap = (res) => res.data?.data

/**
 * سرویس کاتالوگ ادمین — اندپوینت‌های /admin/*
 * همه نیاز به توکن با نقش admin دارند.
 *
 * فعلاً فقط بخش‌هایی پیاده شده که فیگمای «محصولات و کاتالوگ» لازم دارد:
 * خواندن، ساخت، ویرایش و حذف پلن‌ها به همراه قابلیت‌ها و قیمت‌هایشان.
 *
 * TODO: محصولات، نسخه‌ها، دسته‌بندی و قابلیت‌های سراسری اندپوینت دارند
 *       ولی فیگمایشان نرسیده — با رسیدن طرح اضافه می‌شوند.
 */
export const adminCatalogService = {
    /* GET /admin/plans — لیست همه‌ی پلن‌ها (شامل غیرعمومی‌ها) */
    getPlans({ page = 1, limit = 20 } = {}) {
        return api
            .get('/admin/plans', { params: { page, limit } })
            .then((res) => ({
                items: res.data?.data ?? [],
                pagination: res.data?.meta?.pagination ?? null,
            }))
    },

    /* GET /admin/plans/{id} — جزئیات یک پلن */
    getPlan(planId) {
        return api.get(`/admin/plans/${planId}`).then(unwrap)
    },

    /* POST /admin/products/{id}/plans — ساخت پلن جدید زیر یک محصول.
       CreatePlan فیلدهای اجباری: code، name، external_plan_code */
    createPlan(productId, { code, name, external_plan_code, description, is_active = true, is_public = true, sort_order = 0 }) {
        return api
            .post(`/admin/products/${productId}/plans`, {
                code,
                name,
                external_plan_code,
                description,
                is_active,
                is_public,
                sort_order,
            })
            .then(unwrap)
    },

    /* PATCH /admin/plans/{id} — ویرایش پلن (همه‌ی فیلدها اختیاری‌اند) */
    updatePlan(planId, payload) {
        return api.patch(`/admin/plans/${planId}`, payload).then(unwrap)
    },

    /* DELETE /admin/plans/{id} */
    deletePlan(planId) {
        return api.delete(`/admin/plans/${planId}`)
    },

    /* ── قابلیت‌های پلن ── */

    getPlanFeatures(planId) {
        return api.get(`/admin/plans/${planId}/features`).then(unwrap)
    },

    /* PUT /admin/plans/{id}/features — جایگزینی کل مجموعه‌ی قابلیت‌ها.
       برای فرم ویرایش مناسب‌تر از POST تکی است چون کاربر همه را یکجا
       تنظیم می‌کند. */
    replacePlanFeatures(planId, features) {
        return api.put(`/admin/plans/${planId}/features`, features).then(unwrap)
    },

    /* ── قیمت‌های پلن ── */

    getPlanPrices(planId) {
        return api.get(`/admin/plans/${planId}/prices`).then(unwrap)
    },

    createPlanPrice(planId, { code, name, term_code, amount, currency = 'IRR', is_active = true }) {
        return api
            .post(`/admin/plans/${planId}/prices`, {
                code,
                name,
                term_code,
                amount,
                currency,
                is_active,
            })
            .then(unwrap)
    },

    updatePlanPrice(priceId, payload) {
        return api.patch(`/admin/plan-prices/${priceId}`, payload).then(unwrap)
    },

    /* ── قابلیت‌های سراسری (برای انتخاب در فرم پلن) ── */

    getFeatures() {
        return api.get('/admin/features').then(unwrap)
    },

    /* ── مدت‌های اعتبار ──
       «مدت اعتبار» روی خود پلن نیست: BillingTerm موجودیت مستقلی است
       (code, name, duration_days, is_trial) که از طریق
       PlanPrice.term_code به پلن وصل می‌شود. فرم پلن گزینه‌هایش را
       از همین‌جا می‌گیرد. */
    getBillingTerms({ is_active = true } = {}) {
        return api
            .get('/admin/billing-term/', { params: { is_active } })
            .then(unwrap)
    },

    /* ── محصولات (برای انتخاب محصول هنگام ساخت پلن) ── */

    getProducts() {
        return api.get('/admin/products').then(unwrap)
    },
}
