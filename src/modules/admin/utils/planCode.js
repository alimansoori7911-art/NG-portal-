/* حداکثر طول code در CreatePlan */
const MAX_LENGTH = 64

/* پسوند تصادفی کوتاه تا دو پلن با شناسه‌ی مشابه، code یکسان نگیرند */
const randomSuffix = () => Math.random().toString(36).slice(2, 8)

/**
 * تولید code یکتای پلن.
 *
 * CreatePlan فیلد code را اجباری می‌داند (حداکثر ۶۴ کاراکتر) ولی فیگما
 * آن را از کاربر نمی‌پرسد. پس از external_plan_code (مثل NGC-LIC-base-1Y)
 * یا در نبودش از نام پلن ساخته می‌شود.
 *
 * ⚠️ چرا پسوند تصادفی دارد؟
 * در فیگما هر پنج کارت external_plan_code یکسان دارند. بدون پسوند،
 * code همه یکی می‌شد و بک‌اند از پلن دوم به بعد ۴۰۹ (تکراری) می‌داد.
 *
 * خروجی: حروف کوچک لاتین، رقم و خط تیره — مثل ngc-lic-base-1y-k3f9a2
 *
 * TODO: اگر بک‌اند code را خودش بسازد یا اختیاری کند، این تابع حذف شود.
 */
export function buildPlanCode({ external_plan_code, name }) {
    const source = (external_plan_code || name || '').trim()

    const slug = source
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // هر چیز غیرمجاز → خط تیره
        .replace(/^-+|-+$/g, '') // خط تیره‌های ابتدا و انتها

    const suffix = randomSuffix()

    /* اگر ورودی فارسی بود چیزی از slug باقی نمی‌ماند؛ در آن حالت هم
       با همین پسوند یک code معتبر ساخته می‌شود. */
    if (!slug) return `plan-${suffix}`

    /* جا باز می‌کنیم تا با پسوند از سقف رد نشود */
    const room = MAX_LENGTH - suffix.length - 1
    return `${slug.slice(0, room).replace(/-+$/, '')}-${suffix}`
}
