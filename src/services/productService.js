import api from "./api";
import { mockProductApi } from "./productService.mock";

const unwrap = (res) => res.data?.data;

/* سوییچ داده‌ی نمونه.
   با VITE_USE_MOCK_PRODUCTS=true در فایل .env فعال می‌شود.
   برای اتصال به بک‌اند واقعی، فقط همین متغیر را false کن یا حذفش کن. */
const USE_MOCK = import.meta.env.VITE_USE_MOCK_PRODUCTS === "true";

/**
 * سرویس کاتالوگ محصولات — اندپوینت‌های عمومی /products/*
 * همه بدون احراز هویت کار می‌کنند (برای مهمان هم باز است).
 *
 * پاسخ‌ها در قالب { data, meta } هستند و unwrap فقط data را برمی‌گرداند.
 *
 * TODO: صفحه‌بندی — اسپک برای /products/ هیچ query parameter تعریف نکرده
 *       و ساختار meta.pagination هم مشخص نیست. سؤالش به بک‌اند رفته.
 */
const realProductApi = {
    /* GET /products/ — لیست محصولات عمومی */
    getProducts() {
        return api.get("/products/").then(unwrap);
    },

    /* GET /products/{slug} — جزئیات یک محصول */
    getProduct(slug) {
        return api.get(`/products/${slug}`).then(unwrap);
    },

    /* GET /products/{slug}/plans — پلن‌های یک محصول
       هر پلن شامل features و prices است. */
    getProductPlans(slug) {
        return api.get(`/products/${slug}/plans`).then(unwrap);
    },

    /* GET /products/categories — دسته‌بندی محصولات */
    getCategories() {
        return api.get("/products/categories").then(unwrap);
    },

    /* GET /products/features — تمام قابلیت‌های تعریف‌شده
       برای ساخت جدول مقایسه‌ای لازم است (ستون‌های ثابت). */
    getFeatures() {
        return api.get("/products/features").then(unwrap);
    },

    /* GET /products/plans — تمام پلن‌های عمومی، مستقل از محصول */
    getPlans() {
        return api.get("/products/plans").then(unwrap);
    },

    /* GET /products/plans/{id} — جزئیات یک پلن */
    getPlan(id) {
        return api.get(`/products/plans/${id}`).then(unwrap);
    },
};

export const productService = USE_MOCK ? mockProductApi : realProductApi;

if (USE_MOCK && import.meta.env.DEV) {
    console.info("[productService] در حال استفاده از داده‌ی نمونه");
}