/* داده‌ی نمایشی کاتالوگ — مقادیر عیناً از فیگما.
   TODO: با اتصال به /admin/plans حذف شود.

   ⚠️ برخلاف بقیه‌ی بخش‌های ادمین، اینجا بک‌اند کامل آماده است
   (/admin/plans و زیرمجموعه‌هایش). این mock فقط تا وقتی است که
   سرور در دسترس نیست. */

/* قابلیت‌هایی که در فرم و کارت نمایش داده می‌شوند.
   با اتصال واقعی از GET /admin/features می‌آیند. */
export const MOCK_FEATURES = [
    { id: 1, code: 'asset_management', name: 'asset management' },
    { id: 2, code: 'auditing', name: 'Auditing' },
    { id: 3, code: 'hardening', name: 'Hardening' },
]

/* مدت‌های اعتبار — از GET /admin/billing-term/ می‌آیند.
   «مدت اعتبار» روی خود پلن نیست: BillingTerm موجودیت مستقلی است
   (با duration_days) که از طریق PlanPrice.term_code به پلن وصل می‌شود. */
export const MOCK_BILLING_TERMS = [
    { id: 1, code: 'trial', name: 'آزمایشی', duration_days: 30, is_trial: true },
    { id: 2, code: 'monthly', name: '1ماه', duration_days: 30 },
    { id: 3, code: 'yearly', name: '1سال', duration_days: 365 },
    { id: 4, code: 'perpetual', name: 'دائمی', duration_days: 0 },
]

/** نام نمایشی مدت اعتبار از روی کد آن */
export const termName = (code) =>
    MOCK_BILLING_TERMS.find((t) => t.code === code)?.name ?? ''

const featureRow = (value = 15) => [
    { key: 'asset_management', label: 'Asset managemet', value },
    { key: 'auditing', label: 'Auditing', value },
    { key: 'hardening', label: 'Hardening', value },
]

export const MOCK_PLANS = [
    {
        id: 1,
        name: 'Pilot',
        description: 'مناسب برای آزمایش اولیه',
        external_plan_code: 'NGC-LIC-base-1Y',
        term_code: 'yearly',
        features: featureRow(),
    },
    {
        id: 2,
        name: 'Pilot',
        description: 'مناسب برای آزمایش اولیه',
        external_plan_code: 'NGC-LIC-base-1Y',
        term_code: 'yearly',
        features: featureRow(),
    },
    {
        id: 3,
        name: 'base',
        description: 'مناسب برای کسب و کار های کوچک',
        external_plan_code: 'NGC-LIC-base-1Y',
        term_code: 'yearly',
        features: featureRow(),
    },
    {
        id: 4,
        name: 'Pilot',
        description: 'مناسب برای آزمایش اولیه',
        external_plan_code: 'NGC-LIC-base-1Y',
        term_code: 'yearly',
        features: featureRow(),
    },
    {
        id: 5,
        name: 'Pilot',
        description: 'مناسب برای آزمایش اولیه',
        external_plan_code: 'NGC-LIC-base-1Y',
        term_code: 'yearly',
        features: featureRow(),
    },
]
