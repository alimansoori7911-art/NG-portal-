/**
 * سرور تقلبی بک‌اند — فقط برای تست و دیباگ فرانت.
 *
 * چرا وجود دارد: بک‌اند واقعی پشت VPN است و وقتی به آن وصل می‌شویم
 * دسترسی به بیرون قطع می‌شود، پس نمی‌توان همزمان تست کرد. این سرور
 * طبق `openapi (18).json` رفتار می‌کند و روی همین کامپیوتر اجرا
 * می‌شود.
 *
 * اجرا:  node mock-server.mjs
 * سپس در .env بگذارید: VITE_API_BASE_URL=http://localhost:5000
 *
 * ⚠️ این فایل هرگز نباید در production استفاده شود. داده در حافظه
 * است و با بستن سرور پاک می‌شود.
 *
 * تزریق خطا برای تست حالت‌های خراب:
 *   http://localhost:5000/__mock/fail/auth/login/401
 *   http://localhost:5000/__mock/reset
 */

import { createServer } from 'node:http'

const PORT = 5000
/* در توسعه ممکن است Vite روی پورت دیگری بالا بیاید (مثلاً وقتی
   ۵۱۷۳ اشغال است). چون این سرور فقط ابزار تست محلی است، هر
   localhost پذیرفته می‌شود — با credentials نمی‌توان '*' گذاشت،
   پس origin خودِ درخواست بازتاب داده می‌شود. */
const isLocalOrigin = (o) => !!o && /^http:\/\/localhost:\d+$/.test(o)

/* ─── داده‌ی درون‌حافظه ─── */
const db = {
    users: new Map(), // username -> user
    orders: [],
    tickets: [],
    invoices: [],
    notifications: [],
    templates: [],
    discounts: [],
    cmsPages: [],
    cmsVersions: [],   // { ...snapshot, page_id, version }
    cmsRedirects: [],
    /* دسترسی‌ها و نگاشت نقش→دسترسی.

       قبلاً `/admin/auth/permissions` همیشه `[]` می‌داد، یعنی هر UIای
       که رویش ساخته می‌شد خالی به‌نظر می‌رسید و هیچ باگی پیدا
       نمی‌شد. */
    permissions: [],
    rolePermissions: new Map(), // roleId -> Set<permission key>
    /* کاتالوگ — قبلاً این‌ها stub بودند و بعضی `[]` می‌دادند، پس هر
       UIای که رویشان ساخته می‌شد خالی به‌نظر می‌رسید. */
    products: [],
    categories: [],
    features: [],
    productVersions: [],
    nextCatalogId: 1,
    /* دپارتمان تیکت — قبلاً `/ticketing/departments` هر بار uuid تازه
       می‌ساخت، یعنی شناسه‌ی دپارتمان بین دو درخواست عوض می‌شد و هر
       UIای که رویش کار می‌کرد می‌شکست. */
    departments: [],
    departmentMembers: [], // { id, department_id, user_id, created_at, updated_at }
    nextMemberId: 1,
    terms: [],
    licenses: [],
    planPrices: [],
    otps: new Map(), // identifier -> code
    resetTokens: new Map(), // reset token -> identifier (یک‌بارمصرف)
    nextTemplateId: 1,
    nextRoleId: 4,
    roles: [
        { id: 1, name: 'admin', description: 'مدیر سیستم', is_active: true, is_system: true, created_at: null, updated_at: null },
        { id: 2, name: 'support', description: 'پشتیبانی', is_active: true, is_system: false, created_at: null, updated_at: null },
        /* VIP یک نقش است، نه فیلد جدا — همان چیزی که فرانت از آن
           برچسب VIP را می‌سازد. */
        { id: 3, name: 'vip', description: 'کاربر ویژه', is_active: true, is_system: false, created_at: null, updated_at: null },
    ],
    nextOrderNum: 1001,
    nextTermId: 3,
    nextPriceId: 1,
    nextUserId: 1,
}

/* مدت‌های اعتبار — پنل ادمین این‌ها را می‌سازد و ویرایش می‌کند، پس
   باید قابل تغییر باشند نه ثابت داخل مسیر. */
function seedTerms() {
    db.terms = [
        { id: 1, code: 'monthly', name: 'ماهانه', duration_days: 30, is_trial: false, is_active: true, sort_order: 1 },
        { id: 2, code: 'yearly', name: 'سالانه', duration_days: 365, is_trial: false, is_active: true, sort_order: 2 },
    ]
    db.nextTermId = 3
}

/* لایسنس‌های نمونه — شکل `LicenseListOutput` اسپک ۱۸ */
function seedLicenses() {
    const day = 86_400_000
    const now = Date.now()
    db.licenses = [
        {
            order_number: 'ORD-1001',
            starts_at: new Date(now - 30 * day).toISOString(),
            expires_at: new Date(now + 335 * day).toISOString(),
            limits: { max_assets: 50, max_discoveries: 50, max_audits: 50, max_hardens: 50, max_monitors: 50 },
            is_active: true,
        },
        {
            order_number: 'ORD-1002',
            starts_at: new Date(now - 400 * day).toISOString(),
            expires_at: new Date(now - 35 * day).toISOString(),
            /* تهی یعنی نامحدود — جدول باید «نامحدود» نشان دهد */
            limits: { max_assets: null, max_discoveries: null, max_audits: null, max_hardens: null, max_monitors: null },
            is_active: false,
        },
    ]
}

/* اعلان‌های نمونه — بدون این، صفحه‌ی اعلان‌ها همیشه خالی بود و
   نمی‌شد فهمید کد کار می‌کند یا نه. */
function seedNotifications() {
    const now = Date.now()
    db.notifications = [
        {
            id: 1, title: 'سفارش شما ثبت شد', type: 'order',
            body: 'سفارش ORD-1001 با موفقیت ثبت شد و در انتظار بررسی است.',
            read_at: null,
            created_at: new Date(now - 5 * 60_000).toISOString(),
        },
        {
            id: 2, title: 'پیش‌فاکتور صادر شد', type: 'invoice',
            body: 'پیش‌فاکتور سفارش ORD-1001 صادر شد. برای پرداخت اقدام کنید.',
            read_at: null,
            created_at: new Date(now - 2 * 3600_000).toISOString(),
        },
        {
            id: 3, title: 'به NG Corion خوش آمدید', type: 'system',
            body: 'حساب شما ساخته شد. برای ثبت سفارش ابتدا هویت خود را تأیید کنید.',
            read_at: new Date(now - 20 * 3600_000).toISOString(),
            created_at: new Date(now - 24 * 3600_000).toISOString(),
        },
    ]
}

/* فاکتورهای نمونه — فیلدها همان‌هایی است که `InvoicesPage` می‌خواند:
   `issued_at` (نه `created_at`)، `invoice_number`، `snapshot_plan_name`
   و `pdf_file_id`. */
function seedInvoices() {
    const now = Date.now()
    db.invoices = [
        {
            id: uuid(), invoice_number: 'INV-1001', invoice_type: 'invoice',
            status: 'issued', snapshot_plan_name: 'Base',
            snapshot_product_name: 'NG Corion',
            total_amount: '480000000', currency: 'IRR',
            issued_at: new Date(now - 3 * 86400_000).toISOString(),
            created_at: new Date(now - 3 * 86400_000).toISOString(),
            pdf_file_id: 'mock-pdf-1',
        },
        {
            id: uuid(), invoice_number: 'INV-1002', invoice_type: 'proforma',
            status: 'issued', snapshot_plan_name: 'Pro',
            snapshot_product_name: 'NG Corion',
            total_amount: '960000000', currency: 'IRR',
            issued_at: new Date(now - 86400_000).toISOString(),
            created_at: new Date(now - 86400_000).toISOString(),
            pdf_file_id: 'mock-pdf-2',
        },
    ]
}

/* خطاهای تزریق‌شده: "POST /auth/login" -> 401 */
const forcedErrors = new Map()

/* زمانِ رفرش‌های یک دقیقه‌ی اخیر — برای شبیه‌سازی سقف بک‌اند */
let refreshHits = []

/* مسیرهای عمومیِ محافظت‌شده با کپچا — طبق سند Turnstile بک‌اند.
   `/orders/demo` عمداً اینجا نیست: نیاز به لاگین دارد پس کپچا نمی‌خواهد. */
const CAPTCHA_ROUTES = [
    /^\/auth\/login$/,
    /^\/auth\/register$/,
    /^\/auth\/otp\/request$/,
    /^\/auth\/password\/reset$/,
    /^\/landing\/(contact|subscribe)$/,
]
let captchaRequired = false

const uuid = () =>
    '01930000-0000-7000-8000-' + String(Date.now()).slice(-12).padStart(12, '0')

/* `uuid()` از ساعت ساخته می‌شود، پس در یک حلقه‌ی تنگ چند بار پشت‌هم
   یک مقدار می‌دهد. برای CMS که چند رکورد را در یک تیک می‌سازد شناسه‌ی
   شمارنده‌دار لازم است وگرنه id تکراری می‌شود. */
let cmsSeq = 0
const cmsId = () =>
    '01930000-0000-7000-8000-' + String(++cmsSeq).padStart(12, '0')

const slugify = (s) =>
    String(s).trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-')

/* نسخه‌ی تازه از وضعیت فعلی صفحه. بک‌اند هر ویرایش را نسخه می‌کند و
   `version_counter` را جلو می‌برد — مک هم باید همین کار را بکند
   وگرنه تب «تاریخچه» همیشه خالی می‌ماند و باگ واقعی پیدا نمی‌شود. */
function snapshotCmsVersion(p, { published = false } = {}) {
    db.cmsVersions
        .filter((v) => v.page_id === p.id)
        .forEach((v) => { v.is_current = false })

    const v = {
        id: cmsId(),
        page_id: p.id,
        version: p.version_counter,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        created_by_user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_published: published,
        is_current: true,
        content_format: p.content_format,
        content_raw: p.content_raw ?? '',
        content_html: p.content_raw ?? '',
        structure: p.blocks ?? [],
        is_public: p.is_public,
        robots: p.robots,
        seo: p.seo ?? {},
    }
    db.cmsVersions.push(v)
    return v
}

function makeCmsPage(b) {
    const title = b.title
    const now = new Date().toISOString()
    return {
        id: cmsId(),
        created_at: now,
        updated_at: now,
        kind: b.kind,
        schema_key: b.schema_key ?? null,
        slug: b.slug ? slugify(b.slug) : slugify(title),
        title,
        excerpt: b.excerpt ?? null,
        status: 'DRAFT',
        is_public: b.is_public ?? true,
        robots: b.robots ?? 'INDEX',
        content_format: b.content_format ?? 'HTML',
        version_counter: 1,
        has_unpublished_changes: false,
        published_at: null,
        published_slug: null,
        created_by_user_id: 1,
        updated_by_user_id: 1,
        deleted_at: null,
        tags: (b.tags ?? []).map((t) => ({ id: cmsId(), name: t, slug: slugify(t) })),
        /* همه‌ی اجازه‌ها باز است؛ برای تست حالت بسته
           `MOCK_CMS_READONLY=1` بگذارید. */
        permissions: process.env.MOCK_CMS_READONLY
            ? { can_edit: false, can_publish: false, can_delete: false, can_restore: false }
            : { can_edit: true, can_publish: true, can_delete: true, can_restore: true },
        current_version_id: null,
        published_version_id: null,
        version: 1,
        blocks: b.blocks ?? [],
        content_raw: b.content_raw ?? '',
        content_html: b.content_raw ?? '',
        seo: {
            meta_title: b.meta_title ?? null,
            meta_description: b.meta_description ?? null,
            og_image_url: b.og_image_url ?? null,
            canonical_url: b.canonical_url ?? null,
            robots: b.robots ?? 'INDEX',
        },
    }
}

/* قالب صفحه‌های ساختاریافته — مرجع هم برای مسیر schemas و هم برای
   ساختن بلوک‌های اولیه‌ی seed، تا این دو از هم جدا نیفتند. */
const STRUCTURED_SCHEMAS = [
    {
        key: 'home',
        title: 'صفحه‌ی اصلی',
        blocks: [
            {
                key: 'hero',
                type: 'TEXT',
                editable: true,
                fields: [
                    { name: 'heading', kind: 'text', required: true, max_length: 120, allowed_sizes: null },
                    { name: 'subheading', kind: 'text', required: false, max_length: 240, allowed_sizes: null },
                ],
                items: null,
            },
            {
                key: 'intro',
                type: 'RICH_TEXT',
                editable: true,
                fields: [
                    { name: 'body', kind: 'rich_text', required: false, max_length: null, allowed_sizes: null },
                ],
                items: null,
            },
            {
                key: 'banner',
                type: 'IMAGE',
                editable: true,
                fields: [
                    { name: 'image_url', kind: 'image', required: true, max_length: null, allowed_sizes: [1920, 1280] },
                    { name: 'alt', kind: 'text', required: true, max_length: 160, allowed_sizes: null },
                ],
                items: null,
            },
            {
                /* بلوک تکرارشونده — سقف دارد */
                key: 'features',
                type: 'CARD_LIST',
                editable: true,
                fields: [
                    { name: 'section_title', kind: 'text', required: false, max_length: 120, allowed_sizes: null },
                ],
                items: {
                    max_items: 4,
                    fields: [
                        { name: 'title', kind: 'text', required: true, max_length: 80, allowed_sizes: null },
                        { name: 'description', kind: 'textarea', required: false, max_length: 300, allowed_sizes: null },
                        { name: 'icon_url', kind: 'image', required: false, max_length: null, allowed_sizes: [64] },
                    ],
                },
            },
            {
                key: 'cta',
                type: 'CTA',
                editable: true,
                fields: [
                    { name: 'label', kind: 'text', required: true, max_length: 40, allowed_sizes: null },
                    { name: 'url', kind: 'url', required: true, max_length: null, allowed_sizes: null },
                    /* بلوک غیرقابل‌ویرایش هم باید تست شود */
                    { name: 'variant', kind: 'text', required: false, max_length: 20, allowed_sizes: null },
                ],
                items: null,
            },
        ],
    },
]

/* دسترسی‌ها — کلید از `module.resource.action` ساخته می‌شود، همان
   سه‌تایی که `PermissionIdentitySchema` می‌خواهد. */
function seedPermissions() {
    const defs = [
        ['auth', 'user', ['read', 'create', 'update', 'delete']],
        ['auth', 'role', ['read', 'create', 'update', 'delete']],
        ['cms', 'page', ['read', 'create', 'update', 'delete', 'publish']],
        ['orders', 'order', ['read', 'update']],
        ['payments', 'payment', ['read', 'verify']],
        ['ticketing', 'ticket', ['read', 'reply', 'close']],
        ['notifications', 'notification', ['read', 'send']],
        ['discount', 'code', ['read', 'create', 'revoke']],
    ]

    let id = 1
    db.permissions = []
    for (const [module, resource, actions] of defs) {
        for (const action of actions) {
            db.permissions.push({
                id: id++,
                key: `${module}.${resource}.${action}`,
                module,
                resource,
                action,
                is_active: true,
            })
        }
    }

    /* ادمین همه را دارد، پشتیبانی فقط تیکت و کاربر */
    db.rolePermissions = new Map([
        [1, new Set(db.permissions.map((x) => x.key))],
        [
            2,
            new Set([
                'ticketing.ticket.read',
                'ticketing.ticket.reply',
                'ticketing.ticket.close',
                'auth.user.read',
            ]),
        ],
        [3, new Set()],
    ])
}

function seedCatalog() {
    const now = () => new Date().toISOString()
    let id = 1

    db.categories = [
        { id: id++, code: 'erp', title: 'نرم‌افزار سازمانی', description: 'راهکارهای یکپارچه', is_active: true, sort_order: 1, created_at: now(), updated_at: now() },
        { id: id++, code: 'infra', title: 'زیرساخت', description: null, is_active: true, sort_order: 2, created_at: now(), updated_at: now() },
        { id: id++, code: 'legacy', title: 'بایگانی‌شده', description: 'دیگر فروخته نمی‌شود', is_active: false, sort_order: 9, created_at: now(), updated_at: now() },
    ]

    db.features = [
        { id: id++, code: 'users', name: 'تعداد کاربر', description: 'سقف کاربر همزمان', value_type: 'number', is_active: true, sort_order: 1, created_at: now(), updated_at: now() },
        { id: id++, code: 'sso', name: 'ورود یکپارچه', description: null, value_type: 'boolean', is_active: true, sort_order: 2, created_at: now(), updated_at: now() },
        { id: id++, code: 'sla', name: 'سطح پشتیبانی', description: null, value_type: 'text', is_active: true, sort_order: 3, created_at: now(), updated_at: now() },
    ]

    db.products = [
        { id: id++, category_id: 1, code: 'NGC', slug: 'ng-corion', name: 'NG Corion', description: 'سامانه‌ی یکپارچه‌ی سازمانی', is_active: true, is_public: true, sort_order: 1, created_at: now(), updated_at: now() },
        { id: id++, category_id: 2, code: 'NGW', slug: 'ng-watch', name: 'NG Watch', description: 'پایش زیرساخت', is_active: true, is_public: false, sort_order: 2, created_at: now(), updated_at: now() },
    ]

    const ngc = db.products[0].id
    db.productVersions = [
        { id: id++, product_id: ngc, version: '2.4.0', release_date: '2026-08-20', is_release: true, changelog: 'بهبود سرعت پایش و رفع چند باگ گزارش‌شده.', created_at: now(), updated_at: now() },
        { id: id++, product_id: ngc, version: '2.5.0-rc1', release_date: null, is_release: false, changelog: 'نسخه‌ی آزمایشی — هنوز منتشر نشده.', created_at: now(), updated_at: now() },
    ]

    db.nextCatalogId = id
}

/* اسلاگ از نام ساخته می‌شود — `TicketDepartmentCreateSchema` اسلاگ
   نمی‌گیرد، یعنی **بک‌اند خودش می‌سازدش**.

   ⚠️ نام دپارتمان فارسی است و اسلاگ فارسی در نشانی درصد-کدگذاری
   می‌شود. اینجا حرف غیرلاتین حذف می‌شود و اگر چیزی نماند، از شناسه‌ی
   کوتاه استفاده می‌شود. این فقط **حدس** ماست از رفتار بک‌اند — در
   BACKEND_REQUESTS.md پرسیده شده که واقعاً چه الگویی تولید می‌کند. */
let deptSlugSeq = 0
const deptSlug = (name) => {
    const latin = String(name)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    return latin || `dept-${++deptSlugSeq}`
}

function seedDepartments() {
    const now = () => new Date().toISOString()
    db.departments = [
        { id: cmsId(), slug: 'tech', name: 'فنی', description: 'مشکلات فنی و خطاها', created_at: now(), updated_at: now() },
        { id: cmsId(), slug: 'fin', name: 'مالی', description: 'پرداخت و فاکتور', created_at: now(), updated_at: now() },
        { id: cmsId(), slug: 'sales', name: 'فروش', description: null, created_at: now(), updated_at: now() },
    ]
    db.departmentMembers = []
    db.nextMemberId = 1
}

seedDepartments()
seedCatalog()
seedPermissions()

function seedCms() {
    db.cmsPages = []
    db.cmsVersions = []
    db.cmsRedirects = []
    cmsSeq = 0

    const about = makeCmsPage({
        kind: 'ARTICLE',
        title: 'درباره ما',
        slug: 'about-us',
        excerpt: 'معرفی شرکت و تیم',
        content_raw: '<h2>درباره ما</h2><p>ما یک تیم نرم‌افزاری هستیم.</p>',
        tags: ['شرکت'],
    })
    about.status = 'PUBLISHED'
    about.published_at = new Date().toISOString()
    about.published_slug = about.slug
    snapshotCmsVersion(about, { published: true })
    about.published_version_id = db.cmsVersions.at(-1).id
    about.current_version_id = about.published_version_id

    /* صفحه‌ای که منتشر شده ولی تغییر ذخیره‌نشده دارد — حالتی که
       `pageState()` باید «تغییر منتشرنشده» نشانش بدهد. */
    const terms = makeCmsPage({
        kind: 'ARTICLE',
        title: 'قوانین و مقررات',
        slug: 'terms',
        excerpt: 'شرایط استفاده از سرویس',
        content_raw: '<p>نسخه‌ی منتشرشده‌ی قوانین.</p>',
    })
    terms.status = 'PUBLISHED'
    terms.published_at = new Date().toISOString()
    terms.published_slug = terms.slug
    snapshotCmsVersion(terms, { published: true })
    terms.published_version_id = db.cmsVersions.at(-1).id
    terms.version_counter = 2
    terms.has_unpublished_changes = true
    terms.content_raw = '<p>نسخه‌ی ویرایش‌شده که هنوز منتشر نشده.</p>'
    terms.content_html = terms.content_raw
    snapshotCmsVersion(terms)
    terms.current_version_id = db.cmsVersions.at(-1).id

    const draft = makeCmsPage({
        kind: 'ARTICLE',
        title: 'راهنمای نصب',
        slug: 'install-guide',
        content_raw: '<p>پیش‌نویس راهنما.</p>',
        is_public: false,
        robots: 'NOINDEX',
    })
    snapshotCmsVersion(draft)
    draft.current_version_id = db.cmsVersions.at(-1).id

    /* صفحه‌ی حذف‌شده — فقط با include_deleted=true باید بیاید */
    const gone = makeCmsPage({
        kind: 'ARTICLE',
        title: 'کمپین قدیمی',
        slug: 'old-campaign',
        content_raw: '<p>حذف‌شده.</p>',
    })
    gone.deleted_at = new Date().toISOString()
    snapshotCmsVersion(gone)
    gone.current_version_id = db.cmsVersions.at(-1).id

    /* صفحه‌ی ساختاریافته — بلوک‌هایش از structured-schemas می‌آید */
    const home = makeCmsPage({
        kind: 'STRUCTURED',
        schema_key: 'home',
        title: 'صفحه‌ی اصلی',
        slug: 'home',
        blocks: [
            {
                key: 'hero',
                type: 'TEXT',
                version: 1,
                fields: { heading: 'نرم‌افزار یکپارچه', subheading: 'ساده و سریع' },
                items: [],
            },
            {
                key: 'intro',
                type: 'RICH_TEXT',
                version: 1,
                fields: { body: '<p>معرفی کوتاه محصول.</p>' },
                items: [],
            },
            {
                key: 'banner',
                type: 'IMAGE',
                version: 1,
                fields: { image_url: 'https://example.com/banner.png', alt: 'تصویر اصلی' },
                items: [],
            },
            {
                key: 'features',
                type: 'CARD_LIST',
                version: 1,
                fields: { section_title: 'چرا ما' },
                items: [
                    { title: 'سرعت', description: 'راه‌اندازی در یک روز', icon_url: '' },
                    { title: 'پشتیبانی', description: 'پاسخ در کمتر از ۲۴ ساعت', icon_url: '' },
                ],
            },
            {
                key: 'cta',
                type: 'CTA',
                version: 1,
                fields: { label: 'درخواست دمو', url: 'https://ngcorion.com/demo', variant: 'primary' },
                items: [],
            },
        ],
    })
    home.status = 'PUBLISHED'
    home.published_at = new Date().toISOString()
    home.published_slug = home.slug
    snapshotCmsVersion(home, { published: true })
    home.published_version_id = db.cmsVersions.at(-1).id
    home.current_version_id = home.published_version_id

    db.cmsPages.push(about, terms, draft, gone, home)

    db.cmsRedirects.push({
        id: cmsId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        from_slug: 'about',
        to_slug: 'about-us',
        page_id: about.id,
        created_by_user_id: 1,
    })
}

/* بعد از `uuid` صدا زده می‌شوند چون `seedInvoices` از آن استفاده
   می‌کند و `const` قبل از تعریفش قابل دسترسی نیست. */
seedCms()
seedNotifications()
seedInvoices()
seedTerms()
seedLicenses()

/* توکن تقلبی با exp واقعی تا tokenManager درست بخواندش */
function makeToken(sub, minutes = Number(process.env.MOCK_TOKEN_MINUTES) || 7) {
    /* نقش‌ها داخل JWT گذاشته می‌شوند تا سناریویی که بک‌اند پرسیده
       (خواندن نقش از توکن) قابل تست باشد. */
    /* `MOCK_NO_JWT_ROLES=1` نقش را از توکن برمی‌دارد ولی در
       `/auth/me` نگه می‌دارد — برای اثبات این‌که فرانت واقعاً نقش را
       از پروفایل می‌خواند نه از JWT. */
    const roles = process.env.MOCK_NO_JWT_ROLES
        ? []
        : (db.users.get(sub)?.roles ?? [])
    const body = Buffer.from(
        JSON.stringify({ sub, roles, exp: Math.floor(Date.now() / 1000) + minutes * 60 })
    ).toString('base64url')
    return `mock.${body}.sig`
}

const ok = (data, meta = {}) => ({ data, meta: { request_id: uuid(), ...meta } })
const fail = (code, message, details = null) => ({
    data: { error: { code, message, details } },
    meta: { request_id: uuid() },
})
const page = (items, p = 1, limit = 10) =>
    ok(items, {
        pagination: {
            page: p,
            limit,
            total: items.length,
            total_pages: Math.max(1, Math.ceil(items.length / limit)),
            has_previous: p > 1,
            has_next: false,
        },
    })

/* شکل `UserResponseSchema` برای پنل ادمین.

   ⚠️ شناسه‌ی نقش از `db.roles` خوانده می‌شود نه عدد ثابت ۱. قبلاً
   همه‌ی نقش‌ها `id: 1` می‌گرفتند، یعنی هر UIای که با شناسه‌ی نقش کار
   می‌کرد (مثل «کاربران این نقش») روی mock درست به‌نظر می‌رسید و روی
   سرور واقعی می‌شکست. */
function makeAdminUser(u, index) {
    const idx = index ?? [...db.users.values()].indexOf(u) + 1

    return {
        id: idx,
        /* ⚠️ `public_id` در `UserResponseSchema` اسپک **نیست** و ما
           ازش خواسته‌ایم (BACKEND_REQUESTS.md). اینجا می‌گذاریمش تا
           وقتی اضافه شد انتخابگر کاربرِ کد تخفیف فوراً کار کند — ولی
           فرانت نباید رویش تکیه کند تا روی سرور واقعی بیاید. */
        public_id: u.public_id,
        identifiers: [
            { id: 1, type: 'username', value: u.username, status: 'active', is_verified: true, verified_at: null },
            { id: 2, type: 'email', value: u.email, status: 'active', is_verified: false, verified_at: null },
            { id: 3, type: 'phone', value: u.phone, status: 'active', is_verified: true, verified_at: null },
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        roles: (u.roles ?? []).map((name) => ({
            role: {
                id: db.roles.find((r) => r.name === name)?.id ?? 0,
                name,
                description: db.roles.find((r) => r.name === name)?.description ?? null,
                is_active: true,
            },
            assigned_at: null,
            assigned_by: null,
        })),
        permissions: [],
        kyc_profile: null,
    }
}

function makeProfile(u) {
    return {
        id: u.public_id,
        is_active: true,
        is_verified: u.is_verified,
        verified_at: u.is_verified ? new Date().toISOString() : null,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        full_name:
            [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
        birth_date: u.birth_date ?? null,
        username: { value: u.username, is_verified: true, status: 'active' },
        email: u.email
            ? { value: u.email, is_verified: u.is_verified, status: 'active' }
            : null,
        phone: u.phone
            ? { value: u.phone, is_verified: true, status: 'active' }
            : null,
        landline: null,
        company_id: u.company_id ?? null,
        company_name: u.company_name ?? null,
        position: u.position ?? null,
        company_address: u.company_address ?? null,
        /* ✅ از اسپک ۱۷ `roles` در شمای `Profile` **اجباری** است، پس
           `/auth/me` منبع اصلی نقش‌هاست — همان چیزی که بک‌اند خواست
           (نه JWT). */
        roles: u.roles ?? [],
    }
}

/* ─── پلن‌های نمونه ─── */
/* شکل `PlanOutput` اسپک. شناسه‌ها **عدد**اند تا `plan_id` معتبر باشد.
   `features` آرایه‌ای از `PlanFeature` است که هرکدام `feature` تودرتو
   و `value_json` دارد — همان چیزی که `planMapper` می‌خواند. */
const feature = (id, code, name, value, sort) => ({
    id,
    feature_id: id,
    value_json: JSON.stringify(value),
    feature: {
        id,
        code,
        name,
        value_type: typeof value === 'number' ? 'int' : 'string',
        is_active: true,
        sort_order: sort,
    },
})

const planFeatures = (assets, audit, harden) => [
    feature(1, 'asset_management', 'Asset Management', assets, 1),
    feature(2, 'auditing', 'Auditing', audit, 2),
    feature(3, 'hardening', 'Hardening', harden, 3),
]

const MOCK_PLANS = [
    {
        id: 1, product_id: 1, code: 'pilot', name: 'Pilot',
        description: 'مناسب برای ارزیابی اولیه محصول',
        external_plan_code: 'NGC-LIC-PILOT-1M',
        is_pilot: true, is_active: true, is_public: true, sort_order: 1,
        prices: [{ id: 1, term_code: 'trial', quoted_amount: '0', final_amount: '0', currency: 'IRR', is_active: true }],
        features: planFeatures(5, 2, 2),
    },
    {
        id: 2, product_id: 1, code: 'base', name: 'Base',
        description: 'مناسب برای کسب و کار های کوچک',
        external_plan_code: 'NGC-LIC-base-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 2,
        prices: [{ id: 2, term_code: 'yearly', quoted_amount: '480000000', final_amount: '480000000', currency: 'IRR', is_active: true }],
        features: planFeatures(15, 15, 15),
    },
    {
        id: 3, product_id: 1, code: 'pro', name: 'Pro',
        description: 'مناسب برای سازمان های متوسط و تیم های فناوری اطلاعات',
        external_plan_code: 'NGC-LIC-PRO-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 3,
        prices: [{ id: 3, term_code: 'yearly', quoted_amount: '960000000', final_amount: '960000000', currency: 'IRR', is_active: true }],
        features: planFeatures(50, 50, 50),
    },
    {
        id: 4, product_id: 1, code: 'plus', name: 'Plus',
        description: 'مناسب برای سازمان های بزرگ و مراکز داده',
        external_plan_code: 'NGC-LIC-PLUS-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 4,
        prices: [{ id: 4, term_code: 'yearly', quoted_amount: '1920000000', final_amount: '1920000000', currency: 'IRR', is_active: true }],
        features: planFeatures(150, 150, 150),
    },
    {
        id: 5, product_id: 1, code: 'unlimited', name: 'Unlimited',
        description: 'مناسب برای enterprise،MSSP و محیط های چند عملیاتی',
        external_plan_code: 'NGC-LIC-unlimited-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 5,
        prices: [{ id: 5, term_code: 'perpetual', quoted_amount: '5000000000', final_amount: '5000000000', currency: 'IRR', is_active: true }],
        features: planFeatures('Unlimited', 'Unlimited', 'Unlimited'),
    },
]

/* ─── مسیرها ─── */
const routes = [
    /* سلامت */
    ['GET', /^\/health\/(live|ready)$/, () =>
        ok({ status: 'ok', timestamp: new Date().toISOString(), checks: { db: 'ok' } }),
    ],

    /* OTP — کد همیشه 111111 تا تست راحت باشد */
    ['POST', /^\/auth\/otp\/request$/, (req) => {
        const id = req.body.phone_number || req.body.email || req.body.username
        db.otps.set(id, '111111')
        console.log(`   📱 OTP برای ${id} = 111111`)
        return ok({ message: 'sent', otp: '111111' })
    }],

    /* تأیید کد.

       ⚠️ با `action: 'register'` این اندپوینت **حساب را می‌سازد** و
       `access_token` می‌دهد — یعنی ثبت‌نام با شماره همین‌جا تمام
       می‌شود و `/auth/register` (که برای نام‌کاربری+رمز است) صدا زده
       نمی‌شود.

       قبلاً این mock فقط `claim_token` می‌داد و همین باعث شد باگِ
       «دوبار ساختن حساب» در فرانت دیده نشود. */
    ['POST', /^\/auth\/otp\/verify$/, (req) => {
        const id = req.body.phone_number || req.body.email || req.body.username
        if (req.body.otp !== db.otps.get(id) && req.body.otp !== '111111') {
            return [400, fail('BAD_REQUEST', 'invalid otp')]
        }

        if (req.body.action === 'register') {
            /* شماره را نام کاربری موقت می‌گیریم؛ بک‌اند واقعی هم کاربر
               را با شناسه‌ی شماره می‌سازد. */
            let u = [...db.users.values()].find((x) => x.phone === id)
            if (!u) {
                u = {
                    id: db.nextUserId++,
                    username: id, email: null, password: null,
                    phone: id,
                    public_id: uuid(),
                    is_verified: false, // هویت (کد ملی) هنوز تأیید نشده
                    roles: [],
                }
                db.users.set(id, u)
                console.log(`   ✅ حساب با شماره ساخته شد: ${id}`)
            }
            return ok({
                message: 'verified',
                access_token: makeToken(u.username),
                user: { roles: u.roles, created_at: new Date().toISOString() },
            })
        }

        return ok({ message: 'verified', claim_token: 'mock-claim-token' })
    }],

    ['POST', /^\/auth\/otp\/reset-password\/verify$/, (req) => {
        const id = req.body.phone_number || req.body.email || req.body.username
        if (req.body.otp !== db.otps.get(id) && req.body.otp !== '111111') {
            return [400, fail('BAD_REQUEST', 'invalid otp')]
        }
        /* توکن به شناسه گره می‌خورد تا `/auth/password/reset` بداند رمزِ
           کدام کاربر را عوض کند. */
        const token = `reset-${id}`
        db.resetTokens.set(token, id)
        return ok({ message: 'verified', claim_token: token })
    }],

    /* تعیین/بازیابی رمز — بدون رمز قبلی.

       مسیری که کاربرِ ثبت‌نام‌کرده با شماره از آن رمز می‌گذارد؛
       `/auth/password/change` به‌درد نمی‌خورد چون `old_password`
       اجباری دارد و چنین کاربری رمزی ندارد. */
    ['POST', /^\/auth\/password\/reset$/, (req) => {
        const { reset_token, new_password } = req.body
        const id = db.resetTokens.get(reset_token)
        if (!id) {
            return [401, fail('UNAUTHORIZED', 'invalid or used reset token')]
        }
        if (!new_password || String(new_password).length < 8) {
            return [422, fail('VALIDATION_ERROR', 'Input validation failed', [
                { loc: "('body', 'new_password')", msg: 'رمز حداقل ۸ کاراکتر' },
            ])]
        }

        const u = [...db.users.values()].find(
            (x) => x.phone === id || x.email === id || x.username === id
        )
        if (u) u.password = new_password
        /* توکن یک‌بارمصرف است */
        db.resetTokens.delete(reset_token)
        console.log(`   🔑 رمز ${id} تنظیم شد`)
        return ok({ message: 'password updated' })
    }],

    /* ثبت‌نام */
    ['POST', /^\/auth\/register$/, (req) => {
        const { username, email, password, phone_number } = req.body
        if (!username || !password) {
            return [422, fail('VALIDATION_ERROR', 'missing fields', [
                { loc: "('body', 'username')", msg: 'الزامی است' },
            ])]
        }
        if (db.users.has(username)) {
            return [409, fail('CONFLICT', 'username taken')]
        }
        const u = {
            /* شناسه‌ی عددی لازم است: `plan_price.user_id` عدد می‌گیرد
               (کاربر هدفِ قیمت‌گذاری). */
            id: db.nextUserId++,
            username, email, password,
            phone: phone_number,
            public_id: uuid(),
            is_verified: false, // ⚠️ تازه‌ثبت‌نام‌کرده تأیید نشده است
            roles: [],
        }
        db.users.set(username, u)
        console.log(`   ✅ کاربر ساخته شد: ${username} (is_verified=false)`)
        return [201, ok({ access_token: makeToken(username), user: { roles: [], created_at: new Date().toISOString() } })]
    }],

    /* ورود */
    ['POST', /^\/auth\/login$/, (req) => {
        const id = req.body.username || req.body.email || req.body.phone_number
        const u = [...db.users.values()].find(
            (x) => x.username === id || x.email === id || x.phone === id
        )
        if (!u || u.password !== req.body.password) {
            return [401, fail('UNAUTHORIZED', 'bad credentials')]
        }
        return ok({
            access_token: makeToken(u.username),
            /* ⚠️ عمداً UserSchema برمی‌گردد نه Profile — دقیقاً مثل
               اسپک، تا مطمئن شویم فرانت is_verified را از /auth/me
               می‌گیرد نه از اینجا. */
            user: { roles: u.roles, created_at: new Date().toISOString() },
        })
    }],

    ['POST', /^\/auth\/refresh$/, (req) => {
        if (!req.cookies.session_id) {
            return [401, fail('UNAUTHORIZED', 'no session cookie')]
        }

        /* سقف رفرش — آینه‌ی سرور واقعی (۱۵ در دقیقه، در برابر ۱۵۰ برای
           بقیه‌ی مسیرها). بدون این، حلقه‌ی رفرشِ پی‌درپی محلی هیچ‌وقت
           دیده نمی‌شد و فقط روی پروداکشن خودش را نشان می‌داد. */
        const now = Date.now()
        refreshHits = refreshHits.filter((t) => now - t < 60_000)
        if (refreshHits.length >= 15) {
            console.log('   🚦 /auth/refresh → 429 (سقف ۱۵ در دقیقه)')
            return [429, fail('TOO_MANY_REQUESTS', 'refresh rate limit exceeded')]
        }
        refreshHits.push(now)

        return ok({ access_token: makeToken(req.cookies.session_id) })
    }],

    ['POST', /^\/auth\/logout$/, () => ok({ message: 'bye' })],

    /* پروفایل */
    ['GET', /^\/auth\/me$/, (req) => {
        const u = req.user
        if (!u) return [401, fail('UNAUTHORIZED', 'no token')]
        return ok(makeProfile(u))
    }],

    ['PATCH', /^\/auth\/me$/, (req) => {
        const u = req.user
        if (!u) return [401, fail('UNAUTHORIZED', 'no token')]
        Object.assign(u, req.body)
        console.log(`   ✏️  پروفایل ${u.username} به‌روز شد`)
        return ok(makeProfile(u))
    }],

    /* تأیید هویت */
    ['POST', /^\/auth\/contact\/verify$/, (req) => {
        const u = req.user
        if (!u) return [401, fail('UNAUTHORIZED', 'no token')]
        const { national_id, first_name, last_name } = req.body
        if (!/^\d{10}$/.test(national_id || '')) {
            return [422, fail('VALIDATION_ERROR', 'bad national id', [
                { loc: "('body', 'national_id')", msg: 'کد ملی باید ۱۰ رقم باشد' },
            ])]
        }
        Object.assign(u, req.body, { is_verified: true })
        console.log(`   🎉 هویت ${u.username} تأیید شد`)
        return ok({ verified: true, message: 'هویت شما تأیید شد' })
    }],

    ['POST', /^\/auth\/password\/change$/, (req) => {
        const u = req.user
        if (!u) return [401, fail('UNAUTHORIZED', 'no token')]
        if (req.body.old_password !== u.password) {
            return [401, fail('UNAUTHORIZED', 'wrong current password')]
        }
        u.password = req.body.new_password
        return ok({ message: 'changed' })
    }],

    /* نشست نمونه — `id` عددی و `session_id` یک UUID جداست. این دو
       عمداً شکل متفاوتی دارند تا اگر فرانت اشتباهی را بفرستد معلوم
       شود (قبلاً `session_id` فرستاده می‌شد و حذف کار نمی‌کرد). */
    ['GET', /^\/auth\/sessions$/, (req) =>
        page(req.user ? [
            {
                id: 1, session_id: uuid(), is_current: true, revoked: false,
                ip_address: '127.0.0.1', user_agent: 'Mock/1.0',
                session_started_at: new Date().toISOString(),
            },
            /* نشست دوم تا دکمه‌ی «بستن» قابل تست باشد — نشست جاری
               دکمه ندارد. */
            {
                id: 2, session_id: uuid(), is_current: false, revoked: false,
                ip_address: '192.168.1.50',
                user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1',
                session_started_at: new Date(Date.now() - 3600_000).toISOString(),
            },
        ] : []),
    ],

    /* حذف همه */
    ['DELETE', /^\/auth\/sessions$/, () => ok({ message: 'revoked all' })],

    /* حذف یکی — **با `id`** نه `session_id`.
       اگر UUID بیاید یعنی فرانت فیلد اشتباه را فرستاده، پس ۴۰۴
       می‌دهیم تا در تست دیده شود نه اینکه بی‌صدا موفق شود. */
    ['DELETE', /^\/auth\/sessions\/[^/]+$/, (req) => {
        const raw = req.path.split('/')[3]
        if (!/^\d+$/.test(raw)) {
            return [404, fail('NOT_FOUND', 'session not found (id عددی لازم است)')]
        }
        return ok({ message: 'revoked' })
    }],

    /* محصولات */
    ['GET', /^\/products\/$/, () => page([{
        id: 1, slug: 'ng-corion', code: 'NGC', name: 'NG Corion',
        description: 'نرم‌افزار پایش شبکه', is_active: true, is_public: true,
    }])],

    /* `product_id` در `PlanOutput` اجباری است و تنها جایی است که
       `CreateOrder` می‌تواند آن را از آن بگیرد؛ نبودنش یعنی سفارش
       بدون محصول ثبت می‌شود. */
    ['GET', /^\/products\/plans$/, () => page([
        { id: 1, product_id: 1, code: 'basic', name: 'پایه', external_plan_code: 'B1', is_active: true, is_public: true,
          prices: [{ id: 1, term_code: 'monthly', quoted_amount: '50000000', final_amount: '50000000', currency: 'IRR', is_active: true }], features: [] },
        { id: 2, product_id: 1, code: 'pro', name: 'حرفه‌ای', external_plan_code: 'P1', is_active: true, is_public: true,
          prices: [{ id: 2, term_code: 'yearly', quoted_amount: '480000000', final_amount: '480000000', currency: 'IRR', is_active: true }], features: [] },
    ])],

    ['GET', /^\/products\/categories$/, () =>
        page(db.categories.filter((c) => c.is_active))],
    ['GET', /^\/products\/features$/, () =>
        page(db.features.filter((f) => f.is_active))],

    /* پلن‌های یک محصول.
       شناسه‌ها عمداً **عدد**اند، چون `plan_id` در `CreateOrder` عدد
       است. قبلاً فرانت شناسه‌ی متنی (`'pilot'`) می‌فرستاد و ۴۲۲
       می‌گرفت؛ با خالی بودن این مسیر آن باگ دیده نمی‌شد.

       اسپک اینجا «آرایه‌ای از آرایه‌ها» می‌دهد و `usePlans` هر دو
       حالت را تخت می‌کند، پس همان شکل تودرتو را می‌سازیم. */
    ['GET', /^\/products\/[^/]+\/plans$/, () => page([MOCK_PLANS])],
    ['GET', /^\/products\/[^/]+$/, () => ok({
        id: 1, slug: 'ng-corion', name: 'NG Corion', description: '—',
    })],

    /* سفارش */
    ['POST', /^\/orders\/$/, (req) => {
        const u = req.user
        if (!u) return [401, fail('UNAUTHORIZED', 'no token')]
        if (!u.is_verified) {
            /* ⚠️ همان قاعده‌ای که فرانت باید جلوترش را بگیرد */
            return [403, fail('FORBIDDEN', 'identity not verified')]
        }

        /* ⚠️ `plan_id` عدد است. بک‌اند واقعی برای رشته ۴۲۲ می‌دهد
           (pydantic int_parsing) و فرانت مدت‌ها شناسه‌ی متنی
           می‌فرستاد بدون اینکه اینجا معلوم شود. همان خطا را
           بازتولید می‌کنیم تا اگر برگشت، تست بگیردش. */
        const rawPlan = req.body.plan_id
        if (rawPlan !== undefined && rawPlan !== null) {
            const n = Number(rawPlan)
            if (!Number.isInteger(n)) {
                return [422, fail('VALIDATION_ERROR', 'Input validation failed', [{
                    type: 'int_parsing',
                    loc: "('plan_id',)",
                    msg: 'Input should be a valid integer, unable to parse string as an integer',
                    input: rawPlan,
                }])]
            }
        }

        const plan = MOCK_PLANS.find((p) => p.id === Number(rawPlan))
        const o = {
            id: uuid(),
            order_number: `ORD-${db.nextOrderNum++}`,
            order_type: 'purchase',
            status: 'REQUESTED',
            first_name: u.first_name, last_name: u.last_name,
            /* `OrderOutput` فقط `user_public_id` (UUID) می‌دهد، نه
               `user_id` عددی. از اسپک ۱۸ `CreatePlanPrice.user_id` هم
               UUID شد، پس همین مقدار مستقیم به قیمت‌گذاری می‌رود و آن
               بلاکِ قبلی برطرف است.

               ⚠️ `user_full_name` عمداً اینجا نیست: در `OrderOutput`
               وجود ندارد. قبلاً بود و اگر فرانت به آن تکیه می‌کرد،
               روی بک‌اند واقعی خالی می‌شد بدون آنکه تست چیزی بگیرد. */
            user_public_id: u.public_id,
            product_id: 1, plan_id: plan?.id ?? 1,
            snapshot_product_name: 'NG Corion',
            snapshot_plan_name: plan?.name ?? 'پایه',
            quoted_amount: null, payable_amount: null,
            customer_note: req.body.customer_note ?? null,
            created_at: new Date().toISOString(),
            payments: [], line_items: [], ticket_links: [],
        }
        db.orders.push(o)
        console.log(`   🛒 سفارش ${o.order_number} ثبت شد`)
        return [201, ok(o)]
    }],

    ['GET', /^\/orders\/$/, (req) =>
        req.user ? page(db.orders) : [401, fail('UNAUTHORIZED', 'no token')],
    ],

    ['POST', /^\/orders\/demo$/, (req) => {
        const u = req.user
        if (!u) return [401, fail('UNAUTHORIZED', 'no token')]
        if (db.orders.some((o) => o.order_type === 'demo')) {
            return [400, fail('BAD_REQUEST', 'demo already requested')]
        }
        const o = {
            id: uuid(), order_number: `DEMO-${db.nextOrderNum++}`,
            order_type: 'demo', status: 'REQUESTED',
            first_name: u.first_name, last_name: u.last_name,
            snapshot_plan_name: 'دمو', created_at: new Date().toISOString(),
            payments: [], line_items: [], ticket_links: [],
        }
        db.orders.push(o)
        return [201, ok(o)]
    }],

    ['GET', /^\/orders\/[^/]+\/invoices$/, () => page([])],
    /* همه‌ی پرداخت‌های کاربر جاری — تخت، نه تودرتو مثل مسیر ادمین. */
    ['GET', /^\/orders\/payments$/, (req) => {
        if (!req.user) return [401, fail('UNAUTHORIZED', 'no token')]

        const rows = []
        for (const o of db.orders) {
            for (const pay of o.payments ?? []) {
                rows.push({ ...pay, order_id: o.id, order_number: o.order_number })
            }
        }
        const pNum = Number(req.query.get('page')) || 1
        const limit = Number(req.query.get('limit')) || 10
        return ok(rows.slice((pNum - 1) * limit, pNum * limit), {
            pagination: {
                page: pNum,
                limit,
                total: rows.length,
                total_pages: Math.max(1, Math.ceil(rows.length / limit)),
                has_previous: pNum > 1,
                has_next: pNum * limit < rows.length,
            },
        })
    }],

    ['GET', /^\/orders\/[^/]+\/payments$/, () => page([])],
    ['GET', /^\/orders\/[^/]+$/, (req) => {
        const o = db.orders.find((x) => req.path.includes(x.id))
        return o ? ok(o) : [404, fail('NOT_FOUND', 'order not found')]
    }],
    ['POST', /^\/orders\/[^/]+\/cancel$/, (req) => {
        const o = db.orders.find((x) => req.path.includes(x.id))
        if (o) o.status = 'CANCELED'
        return ok(o ?? {})
    }],
    ['POST', /^\/orders\/[^/]+\/payments$/, (req) => {
        const o = db.orders.find((x) => req.path.includes(x.id))
        const p = {
            id: uuid(), order_id: o?.id, status: 'pending', method: req.body.method,
            amount: '0', claimed_amount: String(req.body.claimed_amount ?? 0),
            currency: 'IRR', paid_at: req.body.paid_at, verified_at: null,
            payer_name: req.body.payer_name, bank_name: req.body.bank_name,
            tracking_number: req.body.tracking_number, receipt_ref: null,
            payer_national_id: null, account_number: null, note: req.body.note,
            verified_by_user_id: null, attachments: [],
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }
        o?.payments.push(p)
        return [201, ok(p)]
    }],
    ['POST', /^\/orders\/[^/]+\/payments\/attachments$/, () =>
        [201, ok({ token: 'mock-upload-token' })],
    ],

    /* تیکت */
    /* `TicketDepartmentListItemSchema` فقط id و slug و name دارد —
       توضیح و تاریخ‌ها فقط در مسیر تکی و ادمین می‌آیند. */
    ['GET', /^\/ticketing\/departments$/, () =>
        ok(db.departments.map(({ id, slug, name }) => ({ id, slug, name })))],

    ['GET', /^\/ticketing\/departments\/[^/]+$/, (req) => {
        const id = req.path.split('/')[3]
        const d = db.departments.find((x) => x.id === id)
        return d ? ok(d) : [404, fail('NOT_FOUND', 'دپارتمان پیدا نشد')]
    }],
    ['GET', /^\/ticketing\/tickets$/, (req) =>
        req.user ? page(db.tickets) : [401, fail('UNAUTHORIZED', 'no token')],
    ],
    ['POST', /^\/ticketing\/tickets$/, (req) => {
        const t = {
            id: uuid(), ticket_number: `TK-${db.tickets.length + 1}`,
            subject: req.body.subject, status_code: 'open',
            department_id: req.body.department_id,
            /* شناسه‌ی صاحب تیکت از کاربر توکن می‌آید تا فیلتر
               `user_id` قابل تست باشد. */
            user_id: req.user ? [...db.users.keys()].indexOf(req.user.username) + 1 : 0,
            assigned_to_user_id: null,
            created_at: new Date().toISOString(), messages: [],
        }
        db.tickets.push(t)
        return [201, ok(t)]
    }],
    /* پیام‌ها واقعاً روی تیکت ذخیره می‌شوند.

       قبلاً این مسیر همیشه `[]` می‌داد و `reply` چیزی را نگه
       نمی‌داشت، پس صفحه‌ی گفتگو همیشه خالی بود و باگ‌های چیدمانِ
       گفتگوی طولانی اصلاً دیده نمی‌شدند. */
    ['GET', /^\/ticketing\/tickets\/[^/]+\/messages$/, (req) => {
        const t = db.tickets.find((x) => req.path.includes(x.id))
        return t ? ok(t.messages ?? []) : [404, fail('NOT_FOUND', 'ticket not found')]
    }],
    ['POST', /^\/ticketing\/tickets\/[^/]+\/reply$/, (req) => {
        const t = db.tickets.find((x) => req.path.includes(x.id))
        if (!t) return [404, fail('NOT_FOUND', 'ticket not found')]

        /* ادمین که پاسخ می‌دهد `staff` است و کاربر عادی `customer`؛
           بدون این تفکیک هر دو طرف گفتگو یک‌شکل نشان داده می‌شدند. */
        const isStaff = (req.user?.roles ?? []).includes('admin')
        const m = {
            id: uuid(),
            ticket_id: t.id,
            author_type: isStaff ? 'staff' : 'customer',
            author_user_id: req.user
                ? [...db.users.keys()].indexOf(req.user.username) + 1
                : null,
            /* نام نویسنده — اسپک فعلی این را روی پیام ندارد و بک‌اند
               قرار است اضافه‌اش کند. mock آن را می‌فرستد تا نمایشِ
               نام قابل آزمایش باشد. */
            author_username: req.user?.username ?? null,
            message_type: req.body.message_type ?? 'public',
            body: req.body.message,
            created_at: new Date().toISOString(),
            attachments: [],
        }
        t.messages = t.messages ?? []
        t.messages.push(m)
        t.last_activity_at = m.created_at
        return [201, ok(m)]
    }],
    ['GET', /^\/ticketing\/tickets\/[^/]+$/, (req) => {
        const t = db.tickets.find((x) => req.path.includes(x.id))
        return t ? ok(t) : [404, fail('NOT_FOUND', 'ticket not found')]
    }],

    /* ─── ادمین ─── */
    ['GET', /^\/admin\/auth\/users$/, () =>
        page([...db.users.values()].map((u, i) => makeAdminUser(u, i + 1))),
    ],
    ['GET', /^\/admin\/auth\/admins$/, () => page([])],

    ['GET', /^\/admin\/auth\/permissions$/, () => page(db.permissions, 1, 100)],

    /* دسترسی‌های یک نقش */
    ['GET', /^\/admin\/auth\/roles\/\d+\/permissions$/, (req) => {
        const roleId = Number(req.path.split('/')[4])
        const role = db.roles.find((r) => r.id === roleId)
        if (!role) return [404, fail('NOT_FOUND', 'نقش پیدا نشد')]

        const keys = db.rolePermissions.get(roleId) ?? new Set()
        return page(
            db.permissions.filter((x) => keys.has(x.key)),
            1,
            100
        )
    }],

    /* جایگزینی کامل دسترسی‌های نقش.

       ⚠️ `AssignPermissionsSchema` دسترسی را با سه‌تایی
       `{module, resource, action}` می‌گیرد، نه با id. */
    ['POST', /^\/admin\/auth\/roles\/\d+\/permissions$/, (req) => {
        const roleId = Number(req.path.split('/')[4])
        const role = db.roles.find((r) => r.id === roleId)
        if (!role) return [404, fail('NOT_FOUND', 'نقش پیدا نشد')]

        const list = req.body?.permissions
        if (!Array.isArray(list) || list.length === 0) {
            return [422, fail('VALIDATION_ERROR', 'permissions الزامی است')]
        }

        const keys = new Set()
        for (const item of list) {
            if (!item?.module || !item?.resource || !item?.action) {
                return [
                    422,
                    fail('VALIDATION_ERROR', 'module، resource و action الزامی‌اند'),
                ]
            }
            const key = `${item.module}.${item.resource}.${item.action}`
            if (!db.permissions.some((x) => x.key === key)) {
                return [422, fail('VALIDATION_ERROR', `دسترسی ناشناخته: ${key}`)]
            }
            keys.add(key)
        }

        db.rolePermissions.set(roleId, keys)
        console.log(`   🔑 ${keys.size} دسترسی به نقش ${role.name} داده شد`)
        return ok({ message: 'assigned' })
    }],

    /* کاربران یک نقش */
    ['GET', /^\/admin\/auth\/roles\/\d+\/users$/, (req) => {
        const roleId = Number(req.path.split('/')[4])
        const role = db.roles.find((r) => r.id === roleId)
        if (!role) return [404, fail('NOT_FOUND', 'نقش پیدا نشد')]

        const users = [...db.users.values()]
            .filter((u) => (u.roles ?? []).includes(role.name))
            .map((u) => makeAdminUser(u))
        return page(users)
    }],

    ['PATCH', /^\/admin\/auth\/roles\/\d+$/, (req) => {
        const roleId = Number(req.path.split('/')[4])
        const role = db.roles.find((r) => r.id === roleId)
        if (!role) return [404, fail('NOT_FOUND', 'نقش پیدا نشد')]
        /* نقش سیستمی تغییر نام نمی‌دهد — کد جاهای دیگر به نامش
           تکیه کرده (مثلاً برچسب VIP و بررسی admin). */
        if (role.is_system && req.body?.name && req.body.name !== role.name) {
            return [403, fail('FORBIDDEN', 'نام نقش سیستمی تغییر نمی‌کند')]
        }

        for (const k of ['name', 'description', 'is_active']) {
            if (req.body?.[k] != null) role[k] = req.body[k]
        }
        role.updated_at = new Date().toISOString()
        console.log(`   🏷️  نقش ${role.name} ویرایش شد`)
        return ok(role)
    }],

    ['DELETE', /^\/admin\/auth\/roles\/\d+$/, (req) => {
        const roleId = Number(req.path.split('/')[4])
        const i = db.roles.findIndex((r) => r.id === roleId)
        if (i === -1) return [404, fail('NOT_FOUND', 'نقش پیدا نشد')]
        if (db.roles[i].is_system) {
            return [403, fail('FORBIDDEN', 'نقش سیستمی حذف نمی‌شود')]
        }

        const [removed] = db.roles.splice(i, 1)
        db.rolePermissions.delete(roleId)
        /* از کاربرانی که داشتندش هم برداشته شود */
        for (const u of db.users.values()) {
            u.roles = (u.roles ?? []).filter((n) => n !== removed.name)
        }
        console.log(`   🗑️  نقش ${removed.name} حذف شد`)
        return ok({ message: 'deleted' })
    }],

    /* دسترسی مستقیم کاربر (خارج از نقش) */
    ['POST', /^\/admin\/auth\/users\/[^/]+\/permissions$/, (req) => {
        const list = req.body?.permissions
        if (!Array.isArray(list) || list.length === 0) {
            return [422, fail('VALIDATION_ERROR', 'permissions الزامی است')]
        }
        return ok({ message: 'assigned' })
    }],
    /* نقش‌ها واقعاً نگه داشته می‌شوند و تخصیص اثر دارد.

       قبلاً فهرست ثابت بود و `POST .../roles` فقط «assigned» می‌گفت
       بی‌آنکه چیزی عوض شود، پس برچسب VIP — که از روی نقش‌های کاربر
       ساخته می‌شود — هیچ‌وقت در mock دیده نمی‌شد. */
    ['GET', /^\/admin\/auth\/roles$/, () => page(db.roles)],

    ['POST', /^\/admin\/auth\/roles$/, (req) => {
        const name = req.body?.name?.trim()
        if (!name) return [422, fail('VALIDATION_ERROR', 'name الزامی است')]
        if (db.roles.some((r) => r.name === name)) {
            return [409, fail('CONFLICT', 'این نقش قبلاً ثبت شده')]
        }
        const r = {
            id: db.nextRoleId++,
            name,
            description: req.body?.description ?? null,
            is_active: req.body?.is_active ?? true,
            is_system: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
        db.roles.push(r)
        console.log(`   🏷️  نقش ${r.name} ساخته شد`)
        return [201, ok(r)]
    }],

    ['POST', /^\/admin\/auth\/users\/[^/]+\/roles$/, (req) => {
        const uid = Number(req.path.split('/')[4])
        const role = db.roles.find((r) => r.id === Number(req.body?.role_id))
        if (!role) return [404, fail('NOT_FOUND', 'نقش پیدا نشد')]

        const u = [...db.users.values()][uid - 1]
        if (!u) return [404, fail('NOT_FOUND', 'کاربر پیدا نشد')]

        u.roles = [...new Set([...(u.roles ?? []), role.name])]
        console.log(`   🏷️  نقش ${role.name} به ${u.username} داده شد`)
        return ok({ message: 'assigned' })
    }],
    ['PATCH', /^\/admin\/auth\/users\/[^/]+$/, () => ok({ message: 'updated' })],
    ['DELETE', /^\/admin\/auth\/users\/[^/]+$/, () => ok({ message: 'deleted' })],

    /* همه‌ی پرداخت‌های سیستم — شکل `PaymentRecordOutputAdmin`.

       خروجی **تخت نیست**: هر آیتم یک سفارش است و پرداخت‌هایش در
       `PaymentRecords` تودرتو می‌آیند؛ نام کاربر هم جدا
       (`first_name`/`last_name`) کنارش است. قبلاً این مسیر همیشه
       `[]` می‌داد و صفحه‌ی مالی اصلاً قابل ساخت نبود. */
    ['GET', /^\/admin\/orders\/payments$/, () => {
        const rows = db.orders
            .filter((o) => (o.payments ?? []).length > 0)
            .map((o) => {
                const u = [...db.users.values()].find(
                    (x) => x.public_id === o.user_public_id
                )
                return {
                    order_id: o.id,
                    user_public_id: o.user_public_id,
                    first_name: u?.first_name ?? u?.username ?? '—',
                    last_name: u?.last_name ?? '',
                    PaymentRecords: o.payments,
                }
            })
        return page(rows)
    }],
    ['GET', /^\/admin\/orders\/$/, () => page(db.orders)],
    /* ساخت قیمت برای یک پلن.

       یکتایی روی (name, code, term_code, currency, user_id) است —
       عیناً همان قاعده‌ای که بک‌اند گفت. `user_id` کاربر **هدف** است
       نه سازنده. */
    ['POST', /^\/admin\/plans\/[^/]+\/prices$/, (req) => {
        const planId = Number(req.path.split('/')[3])
        const { code, name, term_code, currency = 'IRR', user_id } = req.body ?? {}

        if (!term_code) {
            return [422, fail('VALIDATION_ERROR', 'Input validation failed', [
                { loc: "('body', 'term_code')", msg: 'term_code الزامی است' },
            ])]
        }

        /* اسپک ۱۸: `user_id` اینجا UUID است نه عدد */
        const clash = db.planPrices.find(
            (p) =>
                p.name === name &&
                p.code === code &&
                p.term_code === term_code &&
                p.currency === currency &&
                p.user_id === user_id
        )
        if (clash) {
            return [409, fail('CONFLICT', 'قیمتی با این مشخصات از قبل هست')]
        }

        /* `final_amount` در `PlanPriceOutput` اجباری است و همان چیزی
           است که کاربر می‌پردازد: مبلغ پایه منهای تخفیف، به‌علاوه‌ی
           مالیات. تخفیف و مالیات **درصد**اند نه مبلغ. */
        const base = Number(req.body.quoted_amount) || 0
        const discount = Number(req.body.discount_percentage) || 0
        const tax = Number(req.body.tax_percentage) || 0
        const afterDiscount = base * (1 - discount / 100)
        const finalAmount = Math.round(afterDiscount * (1 + tax / 100))

        const price = {
            id: db.nextPriceId++,
            plan_id: planId,
            code, name, term_code, currency,
            quoted_amount: req.body.quoted_amount ?? 0,
            discount_percentage: discount,
            tax_percentage: tax,
            final_amount: String(finalAmount),
            user_id: user_id ?? null,
            is_active: req.body.is_active !== false,
        }
        db.planPrices.push(price)
        console.log(`   💰 قیمت ${price.code} برای کاربر ${user_id} ساخته شد`)
        return [201, ok(price)]
    }],

    ['POST', /^\/admin\/orders\/[^/]+\/(quote|status)$/, (req) => {
        const o = db.orders.find((x) => req.path.includes(x.id))
        if (o && req.path.endsWith('/status')) o.status = req.body.status

        if (o && req.path.endsWith('/quote')) {
            /* مبلغ اینجا نمی‌آید؛ از روی `plan_price` خوانده می‌شود. */
            const price = db.planPrices.find(
                (p) => p.id === Number(req.body.plan_price_id)
            )
            if (!price) {
                return [422, fail('VALIDATION_ERROR', 'Input validation failed', [
                    { loc: "('body', 'plan_price_id')", msg: 'قیمت پیدا نشد' },
                ])]
            }

            /* مبلغ پرداختی همان `final_amount`ی است که موقع ساخت قیمت
               حساب شد — دوباره حساب نمی‌شود تا دو فرمول از هم جدا
               نیفتند. */
            const base = Number(price.quoted_amount) || 0
            const payable = Number(price.final_amount) || base

            o.status = 'QUOTATION_ISSUED'
            /* تایم‌لاین: صفحه‌ی پرداخت از همین می‌فهمد پیش‌فاکتور
               صادر شده یا نه. */
            o.quotation_issued_at = new Date().toISOString()
            o.plan_price_id = price.id
            o.quoted_amount = String(base)
            o.payable_amount = String(payable)
            o.admin_note = req.body.admin_note ?? null
        }
        return ok(o ?? {})
    }],
    ['POST', /^\/admin\/orders\/[^/]+\/payments\/[^/]+\/verify$/, (req) => {
        /* رسید را واقعاً تأیید می‌کند.

           قبلاً فقط «verified» می‌گفت و `verified_at` خالی می‌ماند، پس
           وضعیت رسید و خلاصه‌ی مالی — که هر دو از همین فیلد خوانده
           می‌شوند — در mock هیچ‌وقت عوض نمی‌شدند. */
        const parts = req.path.split('/')
        const paymentId = parts[5]
        for (const o of db.orders) {
            const p = (o.payments ?? []).find((x) => x.id === paymentId)
            if (p) {
                p.verified_at = new Date().toISOString()
                p.status = 'verified'
                p.amount = p.claimed_amount
                console.log(`   ✅ رسید ${paymentId.slice(-6)} تأیید شد`)
                return ok(o)
            }
        }
        return [404, fail('NOT_FOUND', 'رسید پیدا نشد')]
    }],
    ['POST', /^\/admin\/orders\/[^/]+\/tickets\/link$/, (req) => [201, ok({
        id: uuid(), order_id: uuid(), ticket_id: req.body.ticket_id,
        relation_type: req.body.relation_type, is_primary: req.body.is_primary,
        linked_by_user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })],
    ],

    ['GET', /^\/admin\/tickets$/, (req) => {
        /* `?mockNoFilter=1` فیلتر را عمداً نادیده می‌گیرد تا حالت
           «بک‌اند هنوز پیاده نکرده» قابل تست باشد. */
        const uid = req.query.get('user_id')
        const ignore = req.query.get('mockNoFilter') === '1'
        const list = uid && !ignore
            ? db.tickets.filter((t) => String(t.user_id) === String(uid))
            : db.tickets
        return page(list)
    }],
    /* ── دپارتمان تیکت (ادمین) ──
       ترتیب مهم است: `/members` قبل از `/{id}` بیاید. */

    ['GET', /^\/admin\/departments\/[^/]+\/members$/, (req) => {
        const id = req.path.split('/')[3]
        if (!db.departments.some((d) => d.id === id)) {
            return [404, fail('NOT_FOUND', 'دپارتمان پیدا نشد')]
        }
        return ok(db.departmentMembers.filter((m) => m.department_id === id))
    }],

    /* ⚠️ `user_id` یک **آرایه** است، نه یک عدد — افزودن عضو دسته‌جمعی
       است. (`TicketDepartmentMemberCreateSchema`) */
    ['POST', /^\/admin\/departments\/[^/]+\/members$/, (req) => {
        const id = req.path.split('/')[3]
        if (!db.departments.some((d) => d.id === id)) {
            return [404, fail('NOT_FOUND', 'دپارتمان پیدا نشد')]
        }

        const raw = req.body?.user_id
        const ids = Array.isArray(raw) ? raw : raw != null ? [raw] : []
        if (ids.length === 0) {
            return [422, fail('VALIDATION_ERROR', 'user_id الزامی است')]
        }

        const users = [...db.users.values()]
        const added = []
        for (const uid of ids) {
            const n = Number(uid)
            /* کاربر ناموجود نباید بی‌صدا عضو شود */
            if (!Number.isInteger(n) || n < 1 || n > users.length) {
                return [422, fail('VALIDATION_ERROR', `کاربر ${uid} پیدا نشد`)]
            }
            /* عضو تکراری خطا نیست، فقط دوباره اضافه نمی‌شود */
            if (db.departmentMembers.some((m) => m.department_id === id && m.user_id === n)) {
                continue
            }
            const now = new Date().toISOString()
            const m = {
                id: db.nextMemberId++,
                department_id: id,
                user_id: n,
                created_at: now,
                updated_at: now,
            }
            db.departmentMembers.push(m)
            added.push(m)
        }

        console.log(`   👥 ${added.length} عضو به دپارتمان اضافه شد`)
        return [201, ok(added.length === 1 ? added[0] : added)]
    }],

    /* ⚠️ مسیر حذف با **`user_id`** است نه شناسه‌ی خود عضو. */
    ['DELETE', /^\/admin\/departments\/[^/]+\/members\/\d+$/, (req) => {
        const parts = req.path.split('/')
        const id = parts[3]
        const uid = Number(parts[5])

        const i = db.departmentMembers.findIndex(
            (m) => m.department_id === id && m.user_id === uid
        )
        if (i === -1) return [404, fail('NOT_FOUND', 'عضو پیدا نشد')]

        db.departmentMembers.splice(i, 1)
        console.log(`   👥 کاربر ${uid} از دپارتمان حذف شد`)
        return ok({ message: 'deleted' })
    }],

    ['POST', /^\/admin\/departments$/, (req) => {
        const name = req.body?.name?.trim()
        if (!name) return [422, fail('VALIDATION_ERROR', 'name الزامی است')]
        if (db.departments.some((d) => d.name === name)) {
            return [409, fail('CONFLICT', 'دپارتمانی با این نام موجود است')]
        }

        const now = new Date().toISOString()
        const d = {
            id: cmsId(),
            /* اسلاگ را بک‌اند می‌سازد؛ فرانت نمی‌فرستدش */
            slug: deptSlug(name),
            name,
            description: req.body?.description ?? null,
            created_at: now,
            updated_at: now,
        }
        db.departments.push(d)
        console.log(`   🏢 دپارتمان ${d.name} ساخته شد`)
        return [201, ok(d)]
    }],

    ['PATCH', /^\/admin\/departments\/[^/]+$/, (req) => {
        const id = req.path.split('/')[3]
        const d = db.departments.find((x) => x.id === id)
        if (!d) return [404, fail('NOT_FOUND', 'دپارتمان پیدا نشد')]

        const b = req.body ?? {}
        if (b.name && db.departments.some((x) => x.id !== id && x.name === b.name)) {
            return [409, fail('CONFLICT', 'دپارتمان دیگری این نام را دارد')]
        }
        if (b.name != null) {
            d.name = b.name
            d.slug = deptSlug(b.name)
        }
        if (b.description !== undefined) d.description = b.description
        d.updated_at = new Date().toISOString()
        return ok(d)
    }],

    ['DELETE', /^\/admin\/departments\/[^/]+$/, (req) => {
        const id = req.path.split('/')[3]
        const i = db.departments.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'دپارتمان پیدا نشد')]

        /* دپارتمانی که تیکت باز دارد نباید حذف شود — وگرنه تیکت به
           دپارتمان ناموجود اشاره می‌کند. */
        if (db.tickets.some((t) => t.department_id === id)) {
            return [409, fail('CONFLICT', 'این دپارتمان تیکت دارد و حذف نمی‌شود')]
        }

        const [removed] = db.departments.splice(i, 1)
        db.departmentMembers = db.departmentMembers.filter(
            (m) => m.department_id !== id
        )
        console.log(`   🗑️  دپارتمان ${removed.name} حذف شد`)
        return ok({ message: 'deleted' })
    }],

    /* ── محصول ── */

    ['GET', /^\/admin\/products$/, () =>
        page(
            db.products.map((p) => ({
                ...p,
                category: db.categories.find((c) => c.id === p.category_id) ?? null,
                versions: db.productVersions.filter((v) => v.product_id === p.id),
                plans: [],
            }))
        )],

    ['POST', /^\/admin\/products$/, (req) => {
        const b = req.body ?? {}
        if (!b.code || !b.slug || !b.name) {
            return [422, fail('VALIDATION_ERROR', 'code، slug و name الزامی‌اند')]
        }
        if (db.products.some((p) => p.code === b.code)) {
            return [409, fail('CONFLICT', 'محصولی با این کد موجود است')]
        }
        if (db.products.some((p) => p.slug === b.slug)) {
            return [409, fail('CONFLICT', 'محصولی با این نشانی موجود است')]
        }
        /* دسته‌ی ناموجود نباید بی‌صدا قبول شود */
        if (b.category_id != null && !db.categories.some((c) => c.id === b.category_id)) {
            return [422, fail('VALIDATION_ERROR', 'دسته‌بندی پیدا نشد')]
        }

        const now = new Date().toISOString()
        const p = {
            id: db.nextCatalogId++,
            category_id: b.category_id ?? null,
            code: b.code,
            slug: b.slug,
            name: b.name,
            description: b.description ?? null,
            is_active: b.is_active ?? true,
            is_public: b.is_public ?? true,
            sort_order: b.sort_order ?? 0,
            created_at: now,
            updated_at: now,
        }
        db.products.push(p)
        console.log(`   📦 محصول ${p.name} ساخته شد`)
        return [201, ok(p)]
    }],

    ['GET', /^\/admin\/products\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const p = db.products.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'محصول پیدا نشد')]
        return ok({
            ...p,
            category: db.categories.find((c) => c.id === p.category_id) ?? null,
            versions: db.productVersions.filter((v) => v.product_id === p.id),
            plans: [],
        })
    }],

    ['PATCH', /^\/admin\/products\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const p = db.products.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'محصول پیدا نشد')]

        const b = req.body ?? {}
        if (b.code && db.products.some((x) => x.id !== id && x.code === b.code)) {
            return [409, fail('CONFLICT', 'محصول دیگری این کد را دارد')]
        }
        if (b.slug && db.products.some((x) => x.id !== id && x.slug === b.slug)) {
            return [409, fail('CONFLICT', 'محصول دیگری این نشانی را دارد')]
        }
        if (b.category_id != null && !db.categories.some((c) => c.id === b.category_id)) {
            return [422, fail('VALIDATION_ERROR', 'دسته‌بندی پیدا نشد')]
        }

        for (const k of ['category_id', 'code', 'slug', 'name', 'description', 'is_active', 'is_public', 'sort_order']) {
            if (b[k] != null) p[k] = b[k]
        }
        p.updated_at = new Date().toISOString()
        console.log(`   📦 محصول ${p.name} ویرایش شد`)
        return ok(p)
    }],

    ['DELETE', /^\/admin\/products\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const i = db.products.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'محصول پیدا نشد')]

        const [removed] = db.products.splice(i, 1)
        /* نسخه‌هایش هم می‌روند، وگرنه نسخه‌ی یتیم می‌ماند */
        db.productVersions = db.productVersions.filter((v) => v.product_id !== id)
        console.log(`   🗑️  محصول ${removed.name} حذف شد`)
        return ok({ message: 'deleted' })
    }],

    /* ── نسخه‌ی محصول ── */

    ['GET', /^\/admin\/products\/\d+\/versions$/, (req) => {
        const pid = Number(req.path.split('/')[3])
        if (!db.products.some((p) => p.id === pid)) {
            return [404, fail('NOT_FOUND', 'محصول پیدا نشد')]
        }
        return page(db.productVersions.filter((v) => v.product_id === pid))
    }],

    ['POST', /^\/admin\/products\/\d+\/versions$/, (req) => {
        const pid = Number(req.path.split('/')[3])
        if (!db.products.some((p) => p.id === pid)) {
            return [404, fail('NOT_FOUND', 'محصول پیدا نشد')]
        }
        const b = req.body ?? {}
        if (!b.version) return [422, fail('VALIDATION_ERROR', 'version الزامی است')]
        if (db.productVersions.some((v) => v.product_id === pid && v.version === b.version)) {
            return [409, fail('CONFLICT', 'این نسخه قبلاً ثبت شده')]
        }

        const now = new Date().toISOString()
        const v = {
            id: db.nextCatalogId++,
            product_id: pid,
            version: b.version,
            release_date: b.release_date ?? null,
            is_release: b.is_release ?? true,
            changelog: b.changelog ?? null,
            created_at: now,
            updated_at: now,
        }
        db.productVersions.push(v)
        console.log(`   🏷️  نسخه‌ی ${v.version} ثبت شد`)
        return [201, ok(v)]
    }],

    ['GET', /^\/admin\/product-versions\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const v = db.productVersions.find((x) => x.id === id)
        return v ? ok(v) : [404, fail('NOT_FOUND', 'نسخه پیدا نشد')]
    }],

    ['PATCH', /^\/admin\/product-versions\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const v = db.productVersions.find((x) => x.id === id)
        if (!v) return [404, fail('NOT_FOUND', 'نسخه پیدا نشد')]

        const b = req.body ?? {}
        if (b.version && db.productVersions.some((x) => x.id !== id && x.product_id === v.product_id && x.version === b.version)) {
            return [409, fail('CONFLICT', 'نسخه‌ی دیگری این شماره را دارد')]
        }
        for (const k of ['version', 'release_date', 'is_release', 'changelog']) {
            if (b[k] != null) v[k] = b[k]
        }
        v.updated_at = new Date().toISOString()
        return ok(v)
    }],

    ['DELETE', /^\/admin\/product-versions\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const i = db.productVersions.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'نسخه پیدا نشد')]
        db.productVersions.splice(i, 1)
        return ok({ message: 'deleted' })
    }],

    ['GET', /^\/admin\/plans$/, () => page([
        { id: 1, code: 'basic', name: 'پایه', external_plan_code: 'B1', is_active: true, is_public: true, prices: [], features: [] },
    ])],
    /* ── ویژگی ── */

    ['GET', /^\/admin\/features$/, () => page(db.features)],

    ['POST', /^\/admin\/features$/, (req) => {
        const b = req.body ?? {}
        if (!b.code || !b.name || !b.value_type) {
            return [422, fail('VALIDATION_ERROR', 'code، name و value_type الزامی‌اند')]
        }
        if (db.features.some((f) => f.code === b.code)) {
            return [409, fail('CONFLICT', 'ویژگی‌ای با این کد موجود است')]
        }

        const now = new Date().toISOString()
        const f = {
            id: db.nextCatalogId++,
            code: b.code,
            name: b.name,
            description: b.description ?? null,
            value_type: b.value_type,
            is_active: b.is_active ?? true,
            sort_order: b.sort_order ?? 0,
            created_at: now,
            updated_at: now,
        }
        db.features.push(f)
        console.log(`   ✨ ویژگی ${f.name} ساخته شد`)
        return [201, ok(f)]
    }],

    ['GET', /^\/admin\/features\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const f = db.features.find((x) => x.id === id)
        return f ? ok(f) : [404, fail('NOT_FOUND', 'ویژگی پیدا نشد')]
    }],

    ['PATCH', /^\/admin\/features\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const f = db.features.find((x) => x.id === id)
        if (!f) return [404, fail('NOT_FOUND', 'ویژگی پیدا نشد')]

        const b = req.body ?? {}
        if (b.code && db.features.some((x) => x.id !== id && x.code === b.code)) {
            return [409, fail('CONFLICT', 'ویژگی دیگری این کد را دارد')]
        }
        for (const k of ['code', 'name', 'description', 'value_type', 'is_active', 'sort_order']) {
            if (b[k] != null) f[k] = b[k]
        }
        f.updated_at = new Date().toISOString()
        return ok(f)
    }],

    ['DELETE', /^\/admin\/features\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const i = db.features.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'ویژگی پیدا نشد')]
        db.features.splice(i, 1)
        return ok({ message: 'deleted' })
    }],
    /* مدت اعتبار — CRUD کامل، چون پنل ادمین حالا می‌سازد و ویرایش
       می‌کند. `is_active` وقتی در query بیاید فیلتر می‌کند. */
    ['GET', /^\/admin\/billing-term\/$/, (req) => {
        const f = req.query.get('is_active')
        const list = f == null
            ? db.terms
            : db.terms.filter((t) => String(t.is_active) === f)
        return ok(list)
    }],

    ['GET', /^\/admin\/billing-term\/[^/]+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const t = db.terms.find((x) => x.id === id)
        return t ? ok(t) : [404, fail('NOT_FOUND', 'term not found')]
    }],

    ['POST', /^\/admin\/billing-term\/$/, (req) => {
        /* اسپک ۱۸: `term_code` جای `code` را گرفت و enum شد */
        const code = req.body?.term_code ?? req.body?.code
        const { name } = req.body ?? {}
        if (!code || !name) {
            return [422, fail('VALIDATION_ERROR', 'Input validation failed', [
                { loc: "('body', 'code')", msg: 'code و name الزامی‌اند' },
            ])]
        }
        /* کد یکتاست چون `PlanPrice.term_code` به آن ارجاع می‌دهد */
        if (db.terms.some((t) => t.code === code)) {
            return [409, fail('CONFLICT', 'این کد قبلاً استفاده شده است')]
        }
        const t = {
            id: db.nextTermId++,
            code,
            name,
            duration_days: req.body.duration_days ?? null,
            is_trial: Boolean(req.body.is_trial),
            is_active: req.body.is_active !== false,
            sort_order: req.body.sort_order ?? 0,
        }
        db.terms.push(t)
        console.log(`   📅 مدت اعتبار ${t.code} ساخته شد`)
        return [201, ok(t)]
    }],

    ['PATCH', /^\/admin\/billing-term\/[^/]+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const t = db.terms.find((x) => x.id === id)
        if (!t) return [404, fail('NOT_FOUND', 'term not found')]
        /* `code` عوض نمی‌شود — فرانت هم نمی‌فرستد */
        const { code, ...rest } = req.body ?? {}
        void code
        Object.assign(t, rest)
        console.log(`   ✏️  مدت اعتبار ${t.code} به‌روز شد`)
        return ok(t)
    }],

    ['DELETE', /^\/admin\/billing-term\/[^/]+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const i = db.terms.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'term not found')]
        const [gone] = db.terms.splice(i, 1)
        console.log(`   🗑️  مدت اعتبار ${gone.code} حذف شد`)
        return ok({ message: 'deleted' })
    }],
    /* ── قالب‌های اعلان ──
       قبلاً فقط یک GET خالی بود و هیچ‌کدام از عملیات نوشتن وجود
       نداشت، پس صفحه‌ی قالب‌ها همیشه خالی می‌ماند و ساخت/ویرایش
       ۴۰۴ می‌گرفت بی‌آنکه معلوم باشد تقصیر فرانت است یا mock. */
    /* ── کدهای تخفیف ── */
    ['GET', /^\/admin\/discount\/$/, (req) => {
        const q = req.query
        let rows = [...db.discounts]

        const isRevoked = q.get('is_revoked')
        if (isRevoked != null && isRevoked !== '') {
            rows = rows.filter((d) => String(d.is_revoked) === isRevoked)
        }
        const dType = q.get('discount_type')
        if (dType) rows = rows.filter((d) => d.discount_type === dType)
        const tType = q.get('target_type')
        if (tType) rows = rows.filter((d) => d.target_type === tType)

        /* پیش‌فرض بک‌اند منقضی‌ها را پنهان می‌کند */
        if (q.get('include_expired') !== 'true') {
            const now = Date.now()
            rows = rows.filter((d) => new Date(d.valid_until).getTime() >= now)
        }
        return page(rows)
    }],

    ['POST', /^\/admin\/discount\/$/, (req) => {
        const b = req.body ?? {}
        if (!b.code || !b.discount_type || b.value == null || !b.valid_until) {
            return [422, fail('VALIDATION_ERROR', 'code، discount_type، value و valid_until الزامی‌اند')]
        }
        if (db.discounts.some((d) => d.code === b.code)) {
            return [409, fail('CONFLICT', 'این کد قبلاً صادر شده')]
        }

        const d = {
            id: uuid(),
            code: b.code,
            discount_type: b.discount_type,
            target_type: b.target_type ?? 'ALL',
            value: String(b.value),
            valid_from: new Date().toISOString(),
            valid_until: b.valid_until,
            max_usage: b.max_usage ?? null,
            used_count: 0,
            remaining_usage: b.max_usage ?? null,
            comment: b.comment ?? null,
            is_revoked: false,
            revoked_at: null,
            target_user_public_ids: b.target_user_public_ids ?? null,
            organization_id: b.organization_id ?? null,
            created_by_user_id: 1,
            revoked_by_user_id: null,
            usages: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
        db.discounts.push(d)
        console.log(`   🎟️  کد تخفیف ${d.code} صادر شد`)
        return [201, ok(d)]
    }],

    ['GET', /^\/admin\/discount\/[^/]+$/, (req) => {
        const id = req.path.split('/').pop()
        const d = db.discounts.find((x) => x.id === id)
        return d ? ok(d) : [404, fail('NOT_FOUND', 'کد پیدا نشد')]
    }],

    ['PUT', /^\/admin\/discount\/[^/]+$/, (req) => {
        const id = req.path.split('/').pop()
        const d = db.discounts.find((x) => x.id === id)
        if (!d) return [404, fail('NOT_FOUND', 'کد پیدا نشد')]

        /* `code` و `discount_type` در DiscountUpdate نیستند */
        const { code, discount_type, ...rest } = req.body ?? {}
        void code
        void discount_type
        Object.assign(d, rest, { updated_at: new Date().toISOString() })
        if (d.max_usage != null) d.remaining_usage = d.max_usage - d.used_count
        console.log(`   ✏️  کد ${d.code} ویرایش شد`)
        return ok(d)
    }],

    ['DELETE', /^\/admin\/discount\/[^/]+$/, (req) => {
        const id = req.path.split('/').pop()
        const d = db.discounts.find((x) => x.id === id)
        if (!d) return [404, fail('NOT_FOUND', 'کد پیدا نشد')]
        /* باطل کردن، نه حذف — رکورد می‌ماند */
        d.is_revoked = true
        d.revoked_at = new Date().toISOString()
        d.revoked_by_user_id = 1
        console.log(`   🚫 کد ${d.code} باطل شد`)
        return ok(d)
    }],

    /* ═══ مدیریت محتوا (CMS) ═══

       ترتیب مسیرها مهم است: الگوهای خاص‌تر (`/versions`, `/publish`,
       `/preview`, `/restore`) باید **قبل** از `/pages/{id}` بیایند،
       وگرنه آن الگوی عمومی اول می‌گیردشان. */

    ['GET', /^\/admin\/cms\/editable-pages$/, () =>
        ok(
            db.cmsPages
                .filter((p) => !p.deleted_at && p.kind === 'STRUCTURED')
                .map((p) => ({
                    id: p.id,
                    kind: p.kind,
                    schema_key: p.schema_key,
                    slug: p.slug,
                    title: p.title,
                    status: p.status,
                    is_public: p.is_public,
                    version_counter: p.version_counter,
                    has_unpublished_changes: p.has_unpublished_changes,
                    permissions: p.permissions,
                    /* مقدار ذخیره‌شده با مشخصات قالب ادغام می‌شود.

                       اگر `kind` و `required` و `max_length` را از
                       قالب برنداریم، فرمِ تولیدشده همه‌چیز را یک
                       input ساده می‌بیند و محدودیت‌ها اصلاً تست
                       نمی‌شوند. */
                    editable_blocks: (() => {
                        const schema = STRUCTURED_SCHEMAS.find(
                            (x) => x.key === p.schema_key
                        )
                        if (!schema) return []

                        return schema.blocks.map((spec) => {
                            const saved = (p.blocks ?? []).find(
                                (b) => b.key === spec.key
                            )

                            return {
                                key: spec.key,
                                type: spec.type,
                                editable: spec.editable,
                                fields: spec.fields.map((f) => ({
                                    ...f,
                                    value: saved?.fields?.[f.name] ?? '',
                                })),
                                items: spec.items
                                    ? {
                                          max_items: spec.items.max_items,
                                          fields: spec.items.fields,
                                          values: saved?.items ?? [],
                                      }
                                    : null,
                            }
                        })
                    })(),
                }))
        )],

    /* قالب صفحه‌های ساختاریافته.

       عمداً هر پنج `BlockType` و یک بلوک تکرارشونده (`CARD_LIST` با
       `max_items`) را پوشش می‌دهد. با یک بلوک ساده نمی‌شد فهمید فرمِ
       تولیدشده واقعاً همه‌ی حالت‌ها را می‌سازد یا نه. */
    ['GET', /^\/admin\/cms\/structured-schemas$/, () => ok(STRUCTURED_SCHEMAS)],

    ['GET', /^\/admin\/cms\/redirects$/, () => page(db.cmsRedirects)],

    /* GET /admin/cms/pages — فیلترها واقعاً اعمال می‌شوند.

       ⚠️ `include_deleted` پیش‌فرض false است. مک اگر همیشه همه را
       برگرداند، فرانتی که این پارامتر را نمی‌فرستد هم درست به‌نظر
       می‌رسد و باگ فقط روی سرور واقعی پیدا می‌شود. */
    ['GET', /^\/admin\/cms\/pages$/, (req) => {
        const q = req.query
        let rows = [...db.cmsPages]

        const includeDeleted = q.get('include_deleted') === 'true'
        if (!includeDeleted) rows = rows.filter((p) => !p.deleted_at)

        const kind = q.get('kind')
        if (kind) rows = rows.filter((p) => p.kind === kind)

        const status = q.get('status')
        if (status) rows = rows.filter((p) => p.status === status)

        const isPublic = q.get('is_public')
        if (isPublic != null && isPublic !== '') {
            rows = rows.filter((p) => p.is_public === (isPublic === 'true'))
        }

        const tag = q.get('tag')
        if (tag) rows = rows.filter((p) => (p.tags ?? []).some((t) => t.slug === tag || t.name === tag))

        const sortBy = q.get('sort_by') || 'created_at'
        const dir = (q.get('sort_order') || 'desc') === 'asc' ? 1 : -1
        rows.sort((a, b) => (String(a[sortBy] ?? '') > String(b[sortBy] ?? '') ? dir : -dir))

        /* صفحه‌بندی واقعی — فهرست باید همان ۱۰ ردیف صفحه را بدهد */
        const pNum = Number(q.get('page')) || 1
        const limit = Number(q.get('limit')) || 10
        const total = rows.length
        const slice = rows.slice((pNum - 1) * limit, pNum * limit)

        return ok(slice, {
            pagination: {
                page: pNum,
                limit,
                total,
                total_pages: Math.max(1, Math.ceil(total / limit)),
                has_previous: pNum > 1,
                has_next: pNum * limit < total,
            },
        })
    }],

    ['POST', /^\/admin\/cms\/pages$/, (req) => {
        const b = req.body ?? {}
        if (!b.kind || !b.title) {
            return [422, fail('VALIDATION_ERROR', 'kind و title الزامی‌اند')]
        }
        const slug = b.slug ? slugify(b.slug) : slugify(b.title)
        if (db.cmsPages.some((p) => p.slug === slug && !p.deleted_at)) {
            return [409, fail('CONFLICT', 'صفحه‌ای با این اسلاگ موجود است')]
        }

        const p = makeCmsPage(b)
        snapshotCmsVersion(p)
        p.current_version_id = db.cmsVersions.at(-1).id
        db.cmsPages.push(p)
        console.log(`   📄 صفحه «${p.title}» ساخته شد`)
        return [201, ok(p)]
    }],

    ['GET', /^\/admin\/cms\/pages\/[^/]+\/versions\/\d+$/, (req) => {
        const parts = req.path.split('/')
        const id = parts[4]
        const version = Number(parts[6])
        const v = db.cmsVersions.find((x) => x.page_id === id && x.version === version)
        return v ? ok(v) : [404, fail('NOT_FOUND', 'نسخه یافت نشد')]
    }],

    ['GET', /^\/admin\/cms\/pages\/[^/]+\/versions$/, (req) => {
        const id = req.path.split('/')[4]
        const rows = db.cmsVersions
            .filter((v) => v.page_id === id)
            .sort((a, b) => b.version - a.version)
            .map((v) => ({
                id: v.id,
                page_id: v.page_id,
                version: v.version,
                slug: v.slug,
                title: v.title,
                excerpt: v.excerpt,
                created_by_user_id: v.created_by_user_id,
                created_at: v.created_at,
                is_published: v.is_published,
                is_current: v.is_current,
            }))
        return page(rows, 1, 20)
    }],

    ['GET', /^\/admin\/cms\/pages\/[^/]+\/preview$/, (req) => {
        const id = req.path.split('/')[4]
        const p = db.cmsPages.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'صفحه یافت نشد')]

        const wanted = req.query.get('version')
        const v = wanted
            ? db.cmsVersions.find((x) => x.page_id === id && x.version === Number(wanted))
            : db.cmsVersions.find((x) => x.page_id === id && x.is_current)
        if (wanted && !v) return [404, fail('NOT_FOUND', 'نسخه یافت نشد')]

        return ok({
            ...p,
            version: v?.version ?? p.version_counter,
            content_raw: v?.content_raw ?? p.content_raw,
            content_html: v?.content_html ?? p.content_html,
            version_created_at: v?.created_at ?? null,
            version_created_by_user_id: v?.created_by_user_id ?? null,
            is_published_version: Boolean(v?.is_published),
        })
    }],

    ['POST', /^\/admin\/cms\/pages\/[^/]+\/publish$/, (req) => {
        const id = req.path.split('/')[4]
        const p = db.cmsPages.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'صفحه یافت نشد')]
        if (p.deleted_at) return [409, fail('CONFLICT', 'صفحه‌ی حذف‌شده منتشر نمی‌شود')]
        if (!p.permissions.can_publish) {
            return [403, fail('FORBIDDEN', 'اجازه‌ی انتشار ندارید')]
        }

        db.cmsVersions.filter((v) => v.page_id === id).forEach((v) => { v.is_published = false })
        const current = db.cmsVersions.find((v) => v.page_id === id && v.is_current)
        if (current) {
            current.is_published = true
            p.published_version_id = current.id
        }

        p.status = 'PUBLISHED'
        p.published_at = new Date().toISOString()
        p.published_slug = p.slug
        p.has_unpublished_changes = false
        p.updated_at = new Date().toISOString()
        console.log(`   🚀 صفحه «${p.title}» منتشر شد`)
        return ok(p)
    }],

    ['POST', /^\/admin\/cms\/pages\/[^/]+\/restore$/, (req) => {
        const id = req.path.split('/')[4]
        const p = db.cmsPages.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'صفحه یافت نشد')]
        if (!p.deleted_at) return [409, fail('CONFLICT', 'این صفحه حذف نشده است')]
        p.deleted_at = null
        p.updated_at = new Date().toISOString()
        console.log(`   ♻️ صفحه «${p.title}» برگردانده شد`)
        return ok(p)
    }],

    ['GET', /^\/admin\/cms\/pages\/[^/]+$/, (req) => {
        const id = req.path.split('/')[4]
        const p = db.cmsPages.find((x) => x.id === id)
        return p ? ok(p) : [404, fail('NOT_FOUND', 'صفحه یافت نشد')]
    }],

    /* PUT — هر ویرایش یک نسخه‌ی تازه می‌سازد و اگر صفحه منتشر شده بود
       `has_unpublished_changes` را true می‌کند. */
    ['PUT', /^\/admin\/cms\/pages\/[^/]+$/, (req) => {
        const id = req.path.split('/')[4]
        const p = db.cmsPages.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'صفحه یافت نشد')]
        if (p.deleted_at) return [409, fail('CONFLICT', 'صفحه‌ی حذف‌شده ویرایش نمی‌شود')]
        if (!p.permissions.can_edit) {
            return [403, fail('FORBIDDEN', 'اجازه‌ی ویرایش ندارید')]
        }

        const b = req.body ?? {}
        if (b.slug != null) {
            const slug = slugify(b.slug)
            if (db.cmsPages.some((x) => x.id !== id && x.slug === slug && !x.deleted_at)) {
                return [409, fail('CONFLICT', 'صفحه‌ی دیگری این اسلاگ را دارد')]
            }
            p.slug = slug
        }

        for (const k of ['title', 'excerpt', 'content_format', 'content_raw', 'is_public', 'robots']) {
            if (b[k] != null) p[k] = b[k]
        }
        if (b.content_raw != null) p.content_html = b.content_raw
        /* `CmsBlockIn` فقط `key`/`fields`/`items` دارد — نه `type` و
           نه `version`. پس آن دو باید از قالب و از بلوک قبلی
           نگه داشته شوند، وگرنه بعد از هر ذخیره نوع بلوک گم می‌شود و
           `CmsBlockOut` که `type` را الزامی می‌داند نقض می‌شود. */
        if (b.blocks != null) {
            const schema = STRUCTURED_SCHEMAS.find((x) => x.key === p.schema_key)

            p.blocks = b.blocks.map((incoming) => {
                const prev = (p.blocks ?? []).find((x) => x.key === incoming.key)
                const spec = schema?.blocks.find((x) => x.key === incoming.key)

                return {
                    key: incoming.key,
                    type: prev?.type ?? spec?.type ?? 'TEXT',
                    version: (prev?.version ?? 0) + 1,
                    fields: incoming.fields ?? {},
                    /* ورودی `items` آرایه‌ای از `{fields}` است ولی
                       خروجی `CmsBlockOut.items` آرایه‌ای از خودِ
                       فیلدهاست. */
                    items: (incoming.items ?? []).map((it) => it?.fields ?? it),
                }
            })
        }
        if (b.tags != null) {
            p.tags = b.tags.map((t) => ({ id: cmsId(), name: t, slug: slugify(t) }))
        }

        p.seo = {
            meta_title: b.meta_title ?? p.seo?.meta_title ?? null,
            meta_description: b.meta_description ?? p.seo?.meta_description ?? null,
            og_image_url: b.og_image_url ?? p.seo?.og_image_url ?? null,
            canonical_url: b.canonical_url ?? p.seo?.canonical_url ?? null,
            robots: p.robots,
        }

        p.version_counter += 1
        p.updated_at = new Date().toISOString()
        p.updated_by_user_id = 1
        if (p.status === 'PUBLISHED') p.has_unpublished_changes = true

        snapshotCmsVersion(p)
        p.current_version_id = db.cmsVersions.at(-1).id
        console.log(`   ✏️ صفحه «${p.title}» به نسخه‌ی ${p.version_counter} رفت`)
        return ok(p)
    }],

    /* DELETE حذف نرم است — رکورد می‌ماند و `deleted_at` پر می‌شود */
    ['DELETE', /^\/admin\/cms\/pages\/[^/]+$/, (req) => {
        const id = req.path.split('/')[4]
        const p = db.cmsPages.find((x) => x.id === id)
        if (!p) return [404, fail('NOT_FOUND', 'صفحه یافت نشد')]
        if (!p.permissions.can_delete) {
            return [403, fail('FORBIDDEN', 'اجازه‌ی حذف ندارید')]
        }
        p.deleted_at = new Date().toISOString()
        p.updated_at = p.deleted_at
        console.log(`   🗑️ صفحه «${p.title}» حذف (نرم) شد`)
        return ok(p)
    }],

    /* ── مسیرهای عمومی CMS ── */

    ['GET', /^\/cms\/pages$/, (req) => {
        const tag = req.query.get('tag')
        /* فقط **مقاله** — اسپک می‌گوید «List published articles».
           صفحه‌ی ساختاریافته (مثل صفحه‌ی اصلی) محتوای مستقل نیست و
           نباید در فهرست مقاله‌ها بیاید. */
        let rows = db.cmsPages.filter(
            (p) =>
                !p.deleted_at &&
                p.status === 'PUBLISHED' &&
                p.is_public &&
                p.kind === 'ARTICLE'
        )
        if (tag) rows = rows.filter((p) => (p.tags ?? []).some((t) => t.slug === tag))
        return page(
            rows.map((p) => ({
                id: p.id,
                /* `kind` در `CmsPagePublicListItemOut` الزامی است */
                kind: p.kind,
                slug: p.slug,
                title: p.title,
                excerpt: p.excerpt,
                published_at: p.published_at,
                tags: p.tags,
                permissions: p.permissions,
            }))
        )
    }],

    ['GET', /^\/cms\/redirects\/[^/]+$/, (req) => {
        const from = decodeURIComponent(req.path.split('/')[3])
        const r = db.cmsRedirects.find((x) => x.from_slug === from)
        return r ? ok({ to_slug: r.to_slug }) : [404, fail('NOT_FOUND', 'ریدایرکتی نیست')]
    }],

    ['GET', /^\/cms\/pages\/[^/]+$/, (req) => {
        const slug = decodeURIComponent(req.path.split('/')[3])
        const p = db.cmsPages.find(
            (x) =>
                x.published_slug === slug &&
                !x.deleted_at &&
                x.status === 'PUBLISHED' &&
                x.is_public
        )
        if (!p) return [404, fail('NOT_FOUND', 'صفحه یافت نشد')]

        /* عمومی باید **نسخه‌ی منتشرشده** را بدهد نه نسخه‌ی جاری؛
           وگرنه پیش‌نویسِ ذخیره‌نشده روی سایت دیده می‌شود. */
        const pub = db.cmsVersions.find((v) => v.id === p.published_version_id)
        return ok({
            id: p.id,
            kind: p.kind,
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            content_html: pub?.content_html ?? '',
            blocks: pub?.structure ?? [],
            published_at: p.published_at,
            tags: p.tags,
            seo: p.seo,
        })
    }],

    /* حذف گروهی اعلان — `DELETE /notifications/bulk` با بدنه.

       ⚠️ بدنه‌ی DELETE: `MarkReadRequest` با `notification_ids` و سقف
       ۱۰۰. حذف **نرم** است، پس رکورد می‌ماند و فقط از فهرست می‌رود. */
    ['DELETE', /^\/notifications\/bulk$/, (req) => {
        const ids = req.body?.notification_ids
        if (!Array.isArray(ids) || ids.length === 0) {
            return [422, fail('VALIDATION_ERROR', 'notification_ids الزامی است')]
        }
        if (ids.length > 100) {
            return [422, fail('VALIDATION_ERROR', 'حداکثر ۱۰۰ مورد در هر درخواست')]
        }

        const set = new Set(ids)
        const before = db.notifications.length
        db.notifications = db.notifications.filter((n) => !set.has(n.id))
        const removed = before - db.notifications.length
        console.log(`   🔕 ${removed} اعلان حذف شد`)
        return ok({ deleted: removed })
    }],

    /* علامت‌زدن گروهی — سقف ۱۰۰ */
    ['PATCH', /^\/notifications\/bulk\/read$/, (req) => {
        const ids = req.body?.notification_ids
        if (!Array.isArray(ids) || ids.length === 0) {
            return [422, fail('VALIDATION_ERROR', 'notification_ids الزامی است')]
        }
        if (ids.length > 100) {
            return [422, fail('VALIDATION_ERROR', 'حداکثر ۱۰۰ مورد در هر درخواست')]
        }

        const set = new Set(ids)
        let n = 0
        for (const x of db.notifications) {
            if (set.has(x.id) && !x.read_at) {
                x.read_at = new Date().toISOString()
                n++
            }
        }
        return ok({ updated: n })
    }],

    /* کدهای تخفیف در دسترس کاربر.

       ⚠️ `UserDiscountOut` با `DiscountListItemOut` فرق دارد: فقط
       id/code/discount_type/value/valid_until/remaining_usage دارد —
       نه `used_count`، نه `is_revoked`، نه دامنه. */
    ['GET', /^\/user\/discount\/$/, () => {
        const now = Date.now()
        const usable = db.discounts.filter(
            (d) => !d.is_revoked && new Date(d.valid_until).getTime() >= now
        )

        return ok(
            usable.map((d) => ({
                id: d.id,
                code: d.code,
                discount_type: d.discount_type,
                value: d.value,
                valid_until: d.valid_until,
                /* `max_usage` تهی یعنی نامحدود، که اینجا `null` است */
                remaining_usage:
                    d.max_usage == null
                        ? null
                        : Math.max(0, d.max_usage - (d.used_count ?? 0)),
            }))
        )
    }],

    ['GET', /^\/admin\/notifications\/templates$/, () => page(db.templates)],

    ['POST', /^\/admin\/notifications\/templates$/, (req) => {
        const b = req.body ?? {}
        if (!b.key || !b.title || !b.body) {
            return [422, fail('VALIDATION_ERROR', 'key, title و body الزامی‌اند')]
        }
        if (db.templates.some((t) => t.key === b.key)) {
            return [409, fail('CONFLICT', 'این کلید قبلاً ثبت شده')]
        }

        const t = {
            id: db.nextTemplateId++,
            key: b.key,
            type: b.type ?? 'system',
            title: b.title,
            body: b.body,
            sms_body: b.sms_body ?? null,
            default_channels: b.default_channels ?? ['in_app'],
            variables: b.variables ?? [],
            is_active: b.is_active ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
        db.templates.push(t)
        console.log(`   🧩 قالب ${t.key} ساخته شد`)
        return [201, ok(t)]
    }],

    ['PATCH', /^\/admin\/notifications\/templates\/\d+$/, (req) => {
        const id = Number(req.path.split('/').pop())
        const t = db.templates.find((x) => x.id === id)
        if (!t) return [404, fail('NOT_FOUND', 'قالب پیدا نشد')]

        /* `key` عمداً نادیده گرفته می‌شود — `NotificationTemplateUpdate`
           آن را ندارد چون اعلان‌های موجود به همان کلید وصل‌اند. */
        const { key, ...rest } = req.body ?? {}
        void key
        Object.assign(t, rest, { updated_at: new Date().toISOString() })
        console.log(`   ✏️  قالب ${t.key} ویرایش شد`)
        return ok(t)
    }],

    ['DELETE', /^\/admin\/notifications\/templates\/\d+$/, (req) => {
        const id = Number(req.path.split('/').pop())
        const i = db.templates.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'قالب پیدا نشد')]
        const [gone] = db.templates.splice(i, 1)
        console.log(`   🗑️  قالب ${gone.key} حذف شد`)
        return [204, null]
    }],

    /* ── دسته‌بندی ──
       ⚠️ عنوان دسته `title` است نه `name` (برخلاف محصول و ویژگی). */

    ['GET', /^\/admin\/product-categories$/, () => page(db.categories)],

    ['POST', /^\/admin\/product-categories$/, (req) => {
        const b = req.body ?? {}
        if (!b.code || !b.title) {
            return [422, fail('VALIDATION_ERROR', 'code و title الزامی‌اند')]
        }
        if (db.categories.some((c) => c.code === b.code)) {
            return [409, fail('CONFLICT', 'دسته‌ای با این کد موجود است')]
        }

        const now = new Date().toISOString()
        const c = {
            id: db.nextCatalogId++,
            code: b.code,
            title: b.title,
            description: b.description ?? null,
            is_active: b.is_active ?? true,
            sort_order: b.sort_order ?? 0,
            created_at: now,
            updated_at: now,
        }
        db.categories.push(c)
        console.log(`   🗂️  دسته‌ی ${c.title} ساخته شد`)
        return [201, ok(c)]
    }],

    ['GET', /^\/admin\/product-categories\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const c = db.categories.find((x) => x.id === id)
        return c ? ok(c) : [404, fail('NOT_FOUND', 'دسته‌بندی پیدا نشد')]
    }],

    ['PATCH', /^\/admin\/product-categories\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const c = db.categories.find((x) => x.id === id)
        if (!c) return [404, fail('NOT_FOUND', 'دسته‌بندی پیدا نشد')]

        const b = req.body ?? {}
        if (b.code && db.categories.some((x) => x.id !== id && x.code === b.code)) {
            return [409, fail('CONFLICT', 'دسته‌ی دیگری این کد را دارد')]
        }
        for (const k of ['code', 'title', 'description', 'is_active', 'sort_order']) {
            if (b[k] != null) c[k] = b[k]
        }
        c.updated_at = new Date().toISOString()
        return ok(c)
    }],

    ['DELETE', /^\/admin\/product-categories\/\d+$/, (req) => {
        const id = Number(req.path.split('/')[3])
        const i = db.categories.findIndex((x) => x.id === id)
        if (i === -1) return [404, fail('NOT_FOUND', 'دسته‌بندی پیدا نشد')]
        /* دسته‌ای که محصول دارد حذف نمی‌شود — وگرنه محصول به دسته‌ی
           ناموجود اشاره می‌کند. */
        if (db.products.some((p) => p.category_id === id)) {
            return [409, fail('CONFLICT', 'این دسته محصول دارد و حذف نمی‌شود')]
        }
        db.categories.splice(i, 1)
        return ok({ message: 'deleted' })
    }],

    /* اعلان و فاکتور و لاگ */

    /* `read_only=true` فقط نخوانده‌ها را می‌دهد — فرانت با همین و
       `limit=1` تعداد نخوانده‌ها را از `pagination.total` می‌گیرد،
       پس `total` باید تعدادِ **فیلترشده** باشد نه کل. */
    ['GET', /^\/notifications\/$/, (req) => {
        if (!req.user) return [401, fail('UNAUTHORIZED', 'no token')]

        const unreadOnly = req.query.get('read_only') === 'true'
        const p = Number(req.query.get('page')) || 1
        const limit = Number(req.query.get('limit')) || 10

        const all = unreadOnly
            ? db.notifications.filter((n) => !n.read_at)
            : db.notifications

        const slice = all.slice((p - 1) * limit, p * limit)
        return ok(slice, {
            pagination: {
                page: p,
                limit,
                total: all.length,
                total_pages: Math.max(1, Math.ceil(all.length / limit)),
                has_previous: p > 1,
                has_next: p * limit < all.length,
            },
        })
    }],

    /* ⚠️ قبل از الگوی `/{id}/read` بیاید، وگرنه «bulk» به‌عنوان
       شناسه خوانده می‌شود و ۴۰۴ می‌گیرد. */
    ['PATCH', /^\/notifications\/bulk\/read$/, (req) => {
        const ids = req.body?.notification_ids ?? []
        for (const id of ids) {
            const n = db.notifications.find((x) => x.id === Number(id))
            if (n) n.read_at = new Date().toISOString()
        }
        return ok({ message: 'read', count: ids.length })
    }],

    ['PATCH', /^\/notifications\/[^/]+\/read$/, (req) => {
        const id = Number(req.path.split('/')[2])
        const n = db.notifications.find((x) => x.id === id)
        if (!n) return [404, fail('NOT_FOUND', 'notification not found')]
        n.read_at = new Date().toISOString()
        return ok({ message: 'read' })
    }],

    ['DELETE', /^\/notifications\/[^/]+$/, (req) => {
        const id = Number(req.path.split('/')[2])
        db.notifications = db.notifications.filter((x) => x.id !== id)
        return ok({ message: 'deleted' })
    }],
    ['GET', /^\/invoice\/$/, () => page(db.invoices)],
    ['GET', /^\/audit\/$/, () => page([])],

    /* لایسنس — اسپک ۱۷.

       ⚠️ `LicenseListOutput` نه کد لایسنس دارد نه نام کاربر نه سرور
       متصل؛ فقط همین پنج فیلد. جدول ادمین هم بر اساس همین ساخته شده.

       ⚠️ نام پارامتر فیلتر در اسپک `is_acitve` است (غلط املایی در خود
       بک‌اند) — عیناً همان پذیرفته می‌شود تا فرانت درست تست شود. */
    ['GET', /^\/license\/$/, (req) => {
        /* بک‌اند `user_id` را از query حذف کرد — کاربر از JWT شناخته
           می‌شود. و `is_acitve` به `is_active` اصلاح شد. */
        const activeParam = req.query.get('is_active')
        const list = activeParam == null
            ? db.licenses
            : db.licenses.filter((l) => String(l.is_active) === activeParam)
        return page(list)
    }],

    ['GET', /^\/license\/[^/]+$/, (req) => {
        const num = req.path.split('/')[2]
        const l = db.licenses.find((x) => x.order_number === num)
        if (!l) return [404, fail('NOT_FOUND', 'license not found')]
        /* جزئیات برخلاف لیست `plan_type` و `is_pilot_mode` هم می‌دهد */
        return ok({ ...l, order_id: uuid(), plan_type: 'pro', is_pilot_mode: false, meta: {} })
    }],

    /* لندینگ */
    ['POST', /^\/landing\/(contact|subscribe)$/, () => ok({ message: 'ثبت شد' })],

    /* دانلود فایل — `POST /dl/{file_id}` لینک presigned می‌دهد.

       لینک واقعی روی S3 است؛ اینجا به یک data-URL کوچک اشاره می‌کنیم
       تا مسیر دانلود بدون وابستگی به سرویس بیرونی قابل تست باشد. */
    ['POST', /^\/dl\/[^/]+$/, (ctx) => {
        const fileId = ctx.path.split('/').pop()
        const body = `فایل نمونه — ${fileId}`
        return ok({
            file_id: fileId,
            filename: `${fileId}.txt`,
            content_type: 'text/plain',
            size_bytes: body.length,
            download_url:
                'data:text/plain;charset=utf-8,' + encodeURIComponent(body),
            checksum_sha256: '0'.repeat(64),
            expires_in: 3600,
        })
    }],
]

/* ─── سرور ─── */
const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const path = url.pathname

    /* CORS — با credentials نمی‌توان * گذاشت */
    const origin = req.headers.origin
    res.setHeader('Access-Control-Allow-Origin', isLocalOrigin(origin) ? origin : 'http://localhost:5173')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Upload-Token,X-Captcha-Token')

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end()
        return
    }

    /* ابزارهای کنترل mock */
    if (path === '/__mock/captcha/on' || path === '/__mock/captcha/off') {
        captchaRequired = path.endsWith('/on')
        console.log(`   🔒 کپچا ${captchaRequired ? 'روشن' : 'خاموش'} شد`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ captchaRequired }))
        return
    }

    if (path === '/__mock/reset') {
        db.users.clear(); db.orders.length = 0; db.tickets.length = 0
        /* اعلان و فاکتور دوباره seed می‌شوند نه خالی — وگرنه بعد از
           reset آن صفحه‌ها خالی می‌مانند و نمی‌شود تستشان کرد. */
        seedNotifications(); seedInvoices(); seedTerms(); seedLicenses()
        db.planPrices.length = 0
        db.nextOrderNum = 1001
        db.nextPriceId = 1
        db.nextUserId = 1
        forcedErrors.clear()
        /* کوکی هم باید منقضی شود، وگرنه مرورگر هنوز `session_id` کاربرِ
           پاک‌شده را می‌فرستد: رفرش ۲۰۰ می‌دهد ولی توکنش برای کاربری
           است که دیگر وجود ندارد، و بعد `/auth/me` ۴۰۱ می‌شود —
           حلقه‌ای که تشخیصش سخت است و شبیه باگ اپ به نظر می‌رسد. */
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie':
                'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        })
        res.end(JSON.stringify({ message: 'reset' }))
        console.log('🔄 داده پاک شد')
        return
    }
    /* ابزار تست: کاربر را ادمین کن — /__mock/promote/<username> */
    const pr = path.match(/^\/__mock\/promote\/([^/]+)$/)
    if (pr) {
        const u = db.users.get(pr[1])
        if (u) u.roles = ['admin']
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ promoted: pr[1], roles: u?.roles ?? null }))
        console.log(`   👑 ${pr[1]} ادمین شد`)
        return
    }

    const fx = path.match(/^\/__mock\/fail(\/.+)\/(\d{3})$/)
    if (fx) {
        forcedErrors.set(fx[1], Number(fx[2]))
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ forced: fx[1], status: Number(fx[2]) }))
        console.log(`💥 خطای ${fx[2]} روی ${fx[1]} تزریق شد`)
        return
    }

    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
        let body = {}
        try { body = raw ? JSON.parse(raw) : {} } catch { /* multipart یا خالی */ }

        const cookies = Object.fromEntries(
            (req.headers.cookie || '').split(';').map((c) => {
                const [k, ...v] = c.trim().split('=')
                return [k, v.join('=')]
            }).filter(([k]) => k)
        )

        /* کاربر از توکن — sub داخل payload */
        let user = null
        const auth = req.headers.authorization
        if (auth?.startsWith('Bearer mock.')) {
            try {
                const p = JSON.parse(
                    Buffer.from(auth.split('.')[1], 'base64url').toString()
                )
                user = db.users.get(p.sub) ?? null
            } catch { /* توکن خراب */ }
        }

        const ctx = { body, cookies, user, path, query: url.searchParams }

        /* کپچا — آینه‌ی رفتار بک‌اند واقعی.

           فقط مسیرهای عمومیِ POST توکن می‌خواهند؛ مسیرهای احرازهویت‌شده
           و همه‌ی GETها نه. پیش‌فرض خاموش است چون در توسعه کلید
           Turnstile روی localhost کار نمی‌کند؛ با
           `/__mock/captcha/on` روشن می‌شود تا مسیر خطا تست شود.

           شکل خطا عمداً همانی است که سند بک‌اند می‌گوید:
           `{ error: "captcha_invalid" }` — یعنی رشته‌ی خام، نه شیء.
           mock نباید نرم‌تر از اسپک باشد وگرنه باگ را پنهان می‌کند. */
        if (
            captchaRequired &&
            req.method === 'POST' &&
            CAPTCHA_ROUTES.some((re) => re.test(path)) &&
            !req.headers['x-captcha-token']
        ) {
            console.log(`  ⚠ ${req.method} ${path} → 400 (captcha_invalid)`)
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                success: false,
                error: 'captcha_invalid',
                message: 'Captcha verification failed',
            }))
            return
        }

        /* خطای تزریق‌شده؟ */
        const forced = forcedErrors.get(path)
        if (forced) {
            forcedErrors.delete(path)
            console.log(`  ${req.method} ${path} → ${forced} (تزریق‌شده)`)
            res.writeHead(forced, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(fail('FORCED', 'خطای آزمایشی')))
            return
        }

        for (const [method, re, handler] of routes) {
            if (req.method === method && re.test(path)) {
                let out
                try { out = handler(ctx) } catch (e) {
                    out = [500, fail('INTERNAL_SERVER_ERROR', e.message)]
                }
                const [status, payload] = Array.isArray(out) ? out : [200, out]
                const icon = status < 300 ? '✓' : status < 500 ? '⚠' : '✖'
                console.log(`  ${icon} ${req.method} ${path} → ${status}`)

                /* کوکی نشست بعد از ورود/ثبت‌نام */
                if (status < 300 && /\/auth\/(login|register)$/.test(path)) {
                    const sub = body.username || [...db.users.keys()].pop()
                    res.setHeader('Set-Cookie',
                        `session_id=${sub}; Path=/; HttpOnly; SameSite=Lax`)
                }
                res.writeHead(status, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(payload))
                return
            }
        }

        console.log(`  ✖ ${req.method} ${path} → 404 (در mock تعریف نشده)`)
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(fail('NOT_FOUND', `mock: ${req.method} ${path}`)))
    })
})

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║  سرور تقلبی بک‌اند — فقط برای تست                    ║
╠══════════════════════════════════════════════════════╣
║  آدرس:  http://localhost:${PORT}                        ║
║  کد OTP همیشه:  111111                               ║
║                                                      ║
║  در .env بگذارید:                                    ║
║    VITE_API_BASE_URL=http://localhost:${PORT}           ║
║    VITE_USE_MOCK_PRODUCTS=false                      ║
╚══════════════════════════════════════════════════════╝
`)
})
