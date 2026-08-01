/* ─────────────────────────────────────────────────────────────
   داده‌ی نمونه — دقیقاً مطابق اسکیمای OpenAPI (ماژول ۵)
   برای توسعه بدون دسترسی به بک‌اند.

   نام و کد پلن‌ها از فیگما/کد فعلی برداشته شده است.
   TODO: قیمت‌ها فرضی‌اند و باید با داده‌ی واقعی جایگزین شوند.
   TODO: ساختار value_json حدسی است — سؤالش به بک‌اند رفته.
   ───────────────────────────────────────────────────────────── */

const NOW = "1405-01-01T00:00:00Z";

const timestamps = { created_at: NOW, updated_at: NOW };

/* ── دسته‌بندی ── */
const CATEGORY = {
    id: 1,
    code: "security",
    title: "امنیت سایبری",
    description: "راهکارهای امنیت زیرساخت",
    is_active: true,
    sort_order: 1,
    ...timestamps,
};

/* ── محصول ── */
const PRODUCT = {
    id: 1,
    code: "NGCORION",
    name: "NGcorion",
    slug: "ngcorion",
    description:
        "پلتفرم متمرکز برای مشاهده، ارزیابی و بهبود امنیت زیرساخت سازمان",
    category_id: CATEGORY.id,
    category: CATEGORY,
    is_active: true,
    is_public: true,
    sort_order: 1,
    ...timestamps,
};

/* ── قابلیت‌ها ── */
const FEATURES = [
    {
        id: 1,
        code: "asset_management",
        name: "Asset management",
        description: "تعداد دارایی قابل مدیریت",
        value_type: "int",
        is_active: true,
        sort_order: 1,
        ...timestamps,
    },
    {
        id: 2,
        code: "auditing",
        name: "Auditing",
        description: "تعداد ممیزی امنیتی",
        value_type: "int",
        is_active: true,
        sort_order: 2,
        ...timestamps,
    },
    {
        id: 3,
        code: "hardening",
        name: "hardening",
        description: "تعداد مقاوم‌سازی خودکار",
        value_type: "int",
        is_active: true,
        sort_order: 3,
        ...timestamps,
    },
];

const featureById = (id) => FEATURES.find((f) => f.id === id) ?? null;

/* ساخت PlanFeatureOutput.
   مقدار به‌صورت خام در value_json گذاشته می‌شود — رایج‌ترین حالت.
   planMapper هر سه حالت ممکن را پوشش می‌دهد. */
let planFeatureId = 0;
const makeFeatures = (planId, values) =>
    values.map((value, i) => ({
        id: ++planFeatureId,
        plan_id: planId,
        feature_id: FEATURES[i].id,
        feature: featureById(FEATURES[i].id),
        value_json: value,
        ...timestamps,
    }));

/* ساخت PlanPriceOutput */
let priceId = 0;
const makePrice = (planId, amount, term_code) => ({
    id: ++priceId,
    plan_id: planId,
    amount,
    currency: "IRR",
    term_code,
    is_active: true,
    ...timestamps,
});

/* ── پلن‌ها ── */
const PLANS = [
    {
        id: 1,
        product_id: PRODUCT.id,
        code: "pilot",
        name: "pilot",
        description: "مناسب برای ارزیابی اولیه محصول",
        external_plan_code: "NGC-LIC-PILOT-1M",
        is_pilot: true,
        is_active: true,
        is_public: true,
        organization_id: null,
        sort_order: 1,
        features: makeFeatures(1, [5, 2, 2]),
        prices: [makePrice(1, 0, "trial")],
        ...timestamps,
    },
    {
        id: 2,
        product_id: PRODUCT.id,
        code: "base",
        name: "base",
        description: "مناسب برای کسب و کار های کوچک",
        external_plan_code: "NGC-LIC-base-1Y",
        is_pilot: false,
        is_active: true,
        is_public: true,
        organization_id: null,
        sort_order: 2,
        features: makeFeatures(2, [15, 15, 15]),
        prices: [
            makePrice(2, 120000000, "yearly"),
            makePrice(2, 12000000, "monthly"),
        ],
        ...timestamps,
    },
    {
        id: 3,
        product_id: PRODUCT.id,
        code: "pro",
        name: "pro",
        description: "مناسب برای سازمان های متوسط و تیم های فناوری اطلاعات",
        external_plan_code: "NGC-LIC-PRO-1Y",
        is_pilot: false,
        is_active: true,
        is_public: true,
        organization_id: null,
        sort_order: 3,
        features: makeFeatures(3, [50, 50, 50]),
        prices: [
            makePrice(3, 340000000, "yearly"),
            makePrice(3, 34000000, "monthly"),
        ],
        ...timestamps,
    },
    {
        id: 4,
        product_id: PRODUCT.id,
        code: "plus",
        name: "plus",
        description: "مناسب برای سازمان های بزرگ و مراکز داده",
        external_plan_code: "NGC-LIC-PLUS-1Y",
        is_pilot: false,
        is_active: true,
        is_public: true,
        organization_id: null,
        sort_order: 4,
        features: makeFeatures(4, [150, 150, 150]),
        prices: [
            makePrice(4, 780000000, "yearly"),
            makePrice(4, 78000000, "monthly"),
        ],
        ...timestamps,
    },
    {
        id: 5,
        product_id: PRODUCT.id,
        code: "unlimited",
        name: "unlimited",
        description: "مناسب برای enterprise،MSSP و محیط های چند عملیاتی",
        external_plan_code: "NGC-LIC-unlimited-1Y",
        is_pilot: false,
        is_active: true,
        is_public: true,
        organization_id: null,
        sort_order: 5,
        // مقدار «نامحدود» — در بک‌اند احتمالاً با -1 یا null نمایش داده می‌شود
        features: makeFeatures(5, [-1, -1, -1]),
        prices: [makePrice(5, 0, "perpetual")],
        ...timestamps,
    },
];

/* تأخیر ساختگی تا حالت loading واقعی دیده شود */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const clone = (value) => JSON.parse(JSON.stringify(value));

export const mockProductApi = {
    async getProducts() {
        await delay();
        return clone([PRODUCT]);
    },

    async getProduct(slug) {
        await delay();
        if (slug !== PRODUCT.slug) {
            throw { status: 404, code: "NOT_FOUND", message: "محصول یافت نشد" };
        }
        return clone(PRODUCT);
    },

    async getProductPlans(slug) {
        await delay();
        if (slug !== PRODUCT.slug) {
            throw { status: 404, code: "NOT_FOUND", message: "محصول یافت نشد" };
        }
        return clone(PLANS);
    },

    async getCategories() {
        await delay();
        return clone([CATEGORY]);
    },

    async getFeatures() {
        await delay();
        return clone(FEATURES);
    },

    async getPlans() {
        await delay();
        return clone(PLANS);
    },

    async getPlan(id) {
        await delay();
        const plan = PLANS.find((p) => p.id === Number(id));
        if (!plan) {
            throw { status: 404, code: "NOT_FOUND", message: "پلن یافت نشد" };
        }
        return clone(plan);
    },
};