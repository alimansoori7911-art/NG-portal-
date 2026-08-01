/* ─────────────────────────────────────────────────────────────
   تبدیل PlanOutput خام بک‌اند به شکلی که کارت‌های پلن مصرف می‌کنند.

   خروجی هر پلن:
   {
     id, code, name, subtitle, licenseCode, duration,
     features: [{ label, value }],
     price: { amount, currency, term } | null,
     isPilot, hoverColor, hoverWidth
   }
   ───────────────────────────────────────────────────────────── */

/* رنگ حاشیه‌ی hover هر پلن — تزئین بصری است و در بک‌اند وجود ندارد.
   کلید = PlanOutput.code */
const PLAN_STYLES = {
    pilot: { hoverColor: 'var(--color-primary-soft)', hoverWidth: '1px' },
    base: { hoverColor: 'var(--color-primary-lighter)', hoverWidth: '1.25px' },
    pro: { hoverColor: 'var(--color-primary-pale)', hoverWidth: '1.5px' },
    plus: { hoverColor: 'var(--color-primary-pale)', hoverWidth: '1.5px' },
    unlimited: { hoverColor: 'var(--color-primary-ghost)', hoverWidth: '2px' },
}

const DEFAULT_STYLE = { hoverColor: 'var(--color-primary-soft)', hoverWidth: '1px' }

/* متن مدت اعتبار از روی term_code قیمت */
const TERM_LABELS = {
    monthly: 'مدت اعتبار:1ماه',
    yearly: 'مدت اعتبار:1سال',
    perpetual: 'مدت اعتبار:دائمی',
    trial: 'مدت اعتبار:آزمایشی',
}

/* ترتیب اولویت برای انتخاب قیمت نمایشی وقتی پلن چند قیمت دارد */
const TERM_PRIORITY = ['yearly', 'monthly', 'perpetual', 'trial']

const UNLIMITED_LABEL = 'نامحدود'

/**
 * خواندن مقدار قابلیت از value_json.
 *
 * TODO: ساختار دقیق value_json در اسپک تعریف نشده و سؤالش به بک‌اند رفته.
 *       فعلاً هم مقدار خام و هم چند حالت رایج پوششی پشتیبانی می‌شود.
 *       وقتی جواب آمد، این تابع به یک خط ساده تبدیل می‌شود.
 */
function readRawValue(valueJson) {
    if (valueJson === null || valueJson === undefined) return null

    if (typeof valueJson === 'object' && !Array.isArray(valueJson)) {
        for (const key of ['value', 'limit', 'amount', 'count']) {
            if (key in valueJson) return valueJson[key]
        }
        return null
    }

    return valueJson
}

/**
 * تبدیل مقدار خام به متن نمایشی بر اساس value_type قابلیت.
 * مقدارهای -1، null و "unlimited" به «نامحدود» تبدیل می‌شوند.
 */
function formatFeatureValue(raw, valueType) {
    if (raw === null || raw === undefined) return UNLIMITED_LABEL
    if (raw === -1 || raw === '-1') return UNLIMITED_LABEL
    if (typeof raw === 'string' && raw.toLowerCase() === 'unlimited') {
        return UNLIMITED_LABEL
    }

    if (valueType === 'bool') return raw ? 'دارد' : 'ندارد'

    if (valueType === 'int' || valueType === 'decimal') {
        const num = Number(raw)
        return Number.isFinite(num) ? num.toLocaleString('fa-IR') : String(raw)
    }

    if (valueType === 'json') return JSON.stringify(raw)

    return String(raw)
}

/** انتخاب قیمت نمایشی از میان قیمت‌های فعال پلن */
function pickPrice(prices = []) {
    const active = prices.filter((p) => p?.is_active)
    if (!active.length) return null

    for (const term of TERM_PRIORITY) {
        const match = active.find((p) => p.term_code === term)
        if (match) return match
    }
    return active[0]
}

/** تبدیل یک PlanOutput به مدل نمایشی کارت */
export function mapPlan(plan) {
    const style = PLAN_STYLES[plan.code] ?? DEFAULT_STYLE
    const price = pickPrice(plan.prices)

    const features = (plan.features ?? [])
        .filter((pf) => pf?.feature?.is_active !== false)
        .sort((a, b) => (a.feature?.sort_order ?? 0) - (b.feature?.sort_order ?? 0))
        .map((pf) => ({
            key: pf.feature?.code ?? String(pf.feature_id),
            label: pf.feature?.name ?? '',
            value: formatFeatureValue(
                readRawValue(pf.value_json),
                pf.feature?.value_type
            ),
        }))

    return {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        subtitle: plan.description ?? '',
        licenseCode: plan.external_plan_code,
        duration: price ? TERM_LABELS[price.term_code] ?? '' : '',
        features,
        price: price
            ? {
                amount: Number(price.amount) || 0,
                currency: price.currency,
                term: price.term_code,
            }
            : null,
        isPilot: plan.is_pilot,
        ...style,
    }
}

/** تبدیل و مرتب‌سازی لیست پلن‌ها — فقط پلن‌های فعال و عمومی */
export function mapPlans(plans = []) {
    return plans
        .filter((p) => p?.is_active && p?.is_public)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(mapPlan)
}

/** قالب‌بندی مبلغ برای نمایش — در صفحه‌ی خرید استفاده می‌شود */
export function formatPrice(amount, currency = 'IRR') {
    if (!amount) return 'رایگان'
    const label = currency === 'IRR' ? 'ریال' : currency
    return `${Number(amount).toLocaleString('fa-IR')} ${label}`
}