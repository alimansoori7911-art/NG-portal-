import api from './api'

const unwrap = (res) => res.data?.data

/**
 * مقادیر مجاز `term_code` در `CreatePlanPrice`.
 *
 * ⚠️ این یک **enum بسته** در اسپک است، در حالی که `BillingTerm.code`
 * متن آزاد (تا ۶۴ کاراکتر) است. پس ادمین می‌تواند مدت اعتباری با کد
 * دلخواه بسازد که هنگام قیمت‌گذاری ۴۲۲ بگیرد.
 *
 * فرم پیش‌فاکتور با همین لیست، گزینه‌های غیرمجاز را فیلتر می‌کند تا
 * ادمین نتواند انتخابی کند که قطعاً رد می‌شود.
 */
export const PRICE_TERM_CODES = ['monthly', 'yearly', 'perpetual', 'trial']

/**
 * سرویس کاتالوگ ادمین — اندپوینت‌های /admin/*
 * همه نیاز به توکن با نقش admin دارند.
 *
 * کل CRUD کاتالوگ اینجا پوشش داده شده: محصول، دسته‌بندی، نسخه،
 * قابلیت، پلن، قابلیت پلن، قیمت پلن و مدت اعتبار.
 *
 * ⚠️ بعضی از این متدها هنوز صفحه‌ای در UI ندارند (فیگمایشان نرسیده)
 * ولی چون اندپوینتشان آماده است اینجا نوشته شده‌اند تا وقتی طرح رسید
 * فقط صفحه ساخته شود. رجوع به BACKEND_NEEDS.md
 */
export const adminCatalogService = {
    /* GET /admin/plans — لیست همه‌ی پلن‌ها (شامل غیرعمومی‌ها).

       include قیمت‌ها و قابلیت‌ها را در همان پاسخ می‌آورد؛ بدون آن
       برای هر کارت دو درخواست جداگانه لازم می‌شد. */
    getPlans({ page = 1, limit = 20, include = ['prices', 'features'] } = {}) {
        return api
            .get('/admin/plans', { params: { page, limit, include } })
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

    /**
     * ساخت قیمت برای یک پلن.
     *
     * ⚠️ `user_id` **کاربر هدف** است — یعنی کسی که این قیمت برای او
     * ساخته می‌شود، نه ادمینی که آن را می‌سازد. قیمت‌گذاری در این
     * سیستم می‌تواند اختصاصیِ هر کاربر باشد.
     *
     * یکتایی روی ترکیب `(name, code, term_code, currency, user_id)`
     * است، پس برای دو سفارشِ همان کاربر با همان شرایط باید `code` یا
     * `name` فرق کند.
     *
     * ⚠️ `discount_percentage` و `tax_percentage` **درصد**اند نه مبلغ
     * (مثلاً ۱۰ یعنی ۱۰٪). `quoted_amount` مبلغ پایه به واحد پول است.
     */
    createPlanPrice(
        planId,
        {
            code,
            name,
            term_code,
            quoted_amount,
            discount_percentage = 0,
            tax_percentage = 0,
            user_id,
            currency = 'IRR',
            is_active = true,
        }
    ) {
        return api
            .post(`/admin/plans/${planId}/prices`, {
                code,
                name,
                term_code,
                quoted_amount,
                discount_percentage,
                tax_percentage,
                user_id,
                currency,
                is_active,
            })
            .then(unwrap)
    },

    updatePlanPrice(priceId, payload) {
        return api.patch(`/admin/plan-prices/${priceId}`, payload).then(unwrap)
    },

    /* POST /admin/plans/{id}/features — افزودن یک قابلیت به پلن.
       برای فرم ویرایش `replacePlanFeatures` مناسب‌تر است؛ این یکی
       وقتی به کار می‌آید که فقط یک قابلیت اضافه شود. */
    addPlanFeature(planId, { feature_id, value_json }) {
        return api
            .post(`/admin/plans/${planId}/features`, { feature_id, value_json })
            .then(unwrap)
    },

    getPlanFeature(planFeatureId) {
        return api.get(`/admin/plan-features/${planFeatureId}`).then(unwrap)
    },

    /* PATCH /admin/plan-features/{id} — فقط `value_json` قابل تغییر است */
    updatePlanFeature(planFeatureId, value_json) {
        return api
            .patch(`/admin/plan-features/${planFeatureId}`, { value_json })
            .then(unwrap)
    },

    deletePlanFeature(planFeatureId) {
        return api.delete(`/admin/plan-features/${planFeatureId}`)
    },

    getPlanPrice(priceId) {
        return api.get(`/admin/plan-prices/${priceId}`).then(unwrap)
    },

    deletePlanPrice(priceId) {
        return api.delete(`/admin/plan-prices/${priceId}`)
    },

    /* ── قابلیت‌های سراسری (برای انتخاب در فرم پلن) ── */

    getFeatures() {
        return api.get('/admin/features').then(unwrap)
    },

    getFeature(featureId) {
        return api.get(`/admin/features/${featureId}`).then(unwrap)
    },

    /* CreateFeature: code، name و value_type اجباری‌اند.
       value_type یکی از bool | int | decimal | text | json است. */
    createFeature({ code, name, value_type, description, is_active = true, sort_order = 0 }) {
        return api
            .post('/admin/features', {
                code,
                name,
                value_type,
                description,
                is_active,
                sort_order,
            })
            .then(unwrap)
    },

    updateFeature(featureId, payload) {
        return api.patch(`/admin/features/${featureId}`, payload).then(unwrap)
    },

    deleteFeature(featureId) {
        return api.delete(`/admin/features/${featureId}`)
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

    getBillingTerm(billingTermId) {
        return api.get(`/admin/billing-term/${billingTermId}`).then(unwrap)
    },

    /* CreateBillingTerm: code و name اجباری.
       duration_days تهی یعنی بی‌نهایت (مثل perpetual). */
    createBillingTerm({ code, name, duration_days, is_trial = false, is_active = true, sort_order = 0 }) {
        return api
            .post('/admin/billing-term/', {
                code,
                name,
                duration_days,
                is_trial,
                is_active,
                sort_order,
            })
            .then(unwrap)
    },

    updateBillingTerm(billingTermId, payload) {
        return api
            .patch(`/admin/billing-term/${billingTermId}`, payload)
            .then(unwrap)
    },

    deleteBillingTerm(billingTermId) {
        return api.delete(`/admin/billing-term/${billingTermId}`)
    },

    /* ── محصولات ── */

    getProducts() {
        return api.get('/admin/products').then(unwrap)
    },

    getProduct(productId) {
        return api.get(`/admin/products/${productId}`).then(unwrap)
    },

    /* GET /admin/products/{slug}/plans — پلن‌های یک محصول با slug.
       ⚠️ برخلاف بقیه‌ی مسیرهای محصول، این یکی slug می‌گیرد نه id. */
    getProductPlans(slug) {
        return api.get(`/admin/products/${slug}/plans`).then(unwrap)
    },

    /* CreateProduct: code، slug و name اجباری‌اند */
    createProduct({ code, slug, name, category_id, description, is_active = true, is_public = true, sort_order = 0 }) {
        return api
            .post('/admin/products', {
                code,
                slug,
                name,
                category_id,
                description,
                is_active,
                is_public,
                sort_order,
            })
            .then(unwrap)
    },

    updateProduct(productId, payload) {
        return api.patch(`/admin/products/${productId}`, payload).then(unwrap)
    },

    deleteProduct(productId) {
        return api.delete(`/admin/products/${productId}`)
    },

    /* ── دسته‌بندی محصولات ── */

    getCategories() {
        return api.get('/admin/product-categories').then(unwrap)
    },

    getCategory(categoryId) {
        return api.get(`/admin/product-categories/${categoryId}`).then(unwrap)
    },

    /* CreateCategory: code و title اجباری‌اند (نه name — برخلاف محصول) */
    createCategory({ code, title, description, is_active = true, sort_order = 0 }) {
        return api
            .post('/admin/product-categories', {
                code,
                title,
                description,
                is_active,
                sort_order,
            })
            .then(unwrap)
    },

    updateCategory(categoryId, payload) {
        return api
            .patch(`/admin/product-categories/${categoryId}`, payload)
            .then(unwrap)
    },

    deleteCategory(categoryId) {
        return api.delete(`/admin/product-categories/${categoryId}`)
    },

    /* ── نسخه‌های محصول ── */

    getProductVersions(productId) {
        return api.get(`/admin/products/${productId}/versions`).then(unwrap)
    },

    getProductVersion(versionId) {
        return api.get(`/admin/product-versions/${versionId}`).then(unwrap)
    },

    /* CreateProductVersion: فقط `version` اجباری است.
       release_date در قالب date است (نه date-time) — برای تبدیل از
       شمسی باید jalaliToDateOnly استفاده شود نه slice روی ISO. */
    createProductVersion(productId, { version, release_date, is_release = false, changelog }) {
        return api
            .post(`/admin/products/${productId}/versions`, {
                version,
                release_date,
                is_release,
                changelog,
            })
            .then(unwrap)
    },

    updateProductVersion(versionId, payload) {
        return api
            .patch(`/admin/product-versions/${versionId}`, payload)
            .then(unwrap)
    },

    deleteProductVersion(versionId) {
        return api.delete(`/admin/product-versions/${versionId}`)
    },
}
