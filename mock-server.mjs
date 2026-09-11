/**
 * سرور تقلبی بک‌اند — فقط برای تست و دیباگ فرانت.
 *
 * چرا وجود دارد: بک‌اند واقعی پشت VPN است و وقتی به آن وصل می‌شویم
 * دسترسی به بیرون قطع می‌شود، پس نمی‌توان همزمان تست کرد. این سرور
 * طبق `openapi (15).json` رفتار می‌کند و روی همین کامپیوتر اجرا
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
    terms: [],
    otps: new Map(), // identifier -> code
    nextOrderNum: 1001,
    nextTermId: 3,
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

const uuid = () =>
    '01930000-0000-7000-8000-' + String(Date.now()).slice(-12).padStart(12, '0')

/* بعد از `uuid` صدا زده می‌شوند چون `seedInvoices` از آن استفاده
   می‌کند و `const` قبل از تعریفش قابل دسترسی نیست. */
seedNotifications()
seedInvoices()
seedTerms()

/* توکن تقلبی با exp واقعی تا tokenManager درست بخواندش */
function makeToken(sub, minutes = 7) {
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
        /* بک‌اند گفت `/auth/me` نقش‌ها را می‌دهد و می‌خواهد همین
           منبعِ اصلی باشد (نه JWT). پس mock هم می‌دهد.

           ⚠️ شمای `Profile` در اسپک ۱۵ این فیلد را ندارد؛ در اسپک
           بعدی باید بیاید. تا آن‌موقع فرانت اگر نبود از JWT
           می‌خواند تا ادمین با رفرش صفحه بیرون نیفتد. */
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
        prices: [{ id: 1, term_code: 'trial', amount: '0', currency: 'IRR', is_active: true }],
        features: planFeatures(5, 2, 2),
    },
    {
        id: 2, product_id: 1, code: 'base', name: 'Base',
        description: 'مناسب برای کسب و کار های کوچک',
        external_plan_code: 'NGC-LIC-base-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 2,
        prices: [{ id: 2, term_code: 'yearly', amount: '480000000', currency: 'IRR', is_active: true }],
        features: planFeatures(15, 15, 15),
    },
    {
        id: 3, product_id: 1, code: 'pro', name: 'Pro',
        description: 'مناسب برای سازمان های متوسط و تیم های فناوری اطلاعات',
        external_plan_code: 'NGC-LIC-PRO-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 3,
        prices: [{ id: 3, term_code: 'yearly', amount: '960000000', currency: 'IRR', is_active: true }],
        features: planFeatures(50, 50, 50),
    },
    {
        id: 4, product_id: 1, code: 'plus', name: 'Plus',
        description: 'مناسب برای سازمان های بزرگ و مراکز داده',
        external_plan_code: 'NGC-LIC-PLUS-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 4,
        prices: [{ id: 4, term_code: 'yearly', amount: '1920000000', currency: 'IRR', is_active: true }],
        features: planFeatures(150, 150, 150),
    },
    {
        id: 5, product_id: 1, code: 'unlimited', name: 'Unlimited',
        description: 'مناسب برای enterprise،MSSP و محیط های چند عملیاتی',
        external_plan_code: 'NGC-LIC-unlimited-1Y',
        is_pilot: false, is_active: true, is_public: true, sort_order: 5,
        prices: [{ id: 5, term_code: 'perpetual', amount: '5000000000', currency: 'IRR', is_active: true }],
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

    ['POST', /^\/auth\/otp\/verify$/, (req) => {
        const id = req.body.phone_number || req.body.email || req.body.username
        if (req.body.otp !== db.otps.get(id) && req.body.otp !== '111111') {
            return [400, fail('BAD_REQUEST', 'invalid otp')]
        }
        return ok({ message: 'verified', claim_token: 'mock-claim-token' })
    }],

    ['POST', /^\/auth\/otp\/reset-password\/verify$/, () =>
        ok({ message: 'verified', claim_token: 'mock-claim-token' }),
    ],

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

    ['GET', /^\/auth\/sessions$/, (req) =>
        page(req.user ? [{
            id: 1, session_id: uuid(), is_current: true, revoked: false,
            ip_address: '127.0.0.1', user_agent: 'Mock/1.0',
            session_started_at: new Date().toISOString(),
        }] : []),
    ],
    ['DELETE', /^\/auth\/sessions(\/.*)?$/, () => ok({ message: 'revoked' })],

    /* محصولات */
    ['GET', /^\/products\/$/, () => page([{
        id: 1, slug: 'ng-corion', code: 'NGC', name: 'NG Corion',
        description: 'نرم‌افزار پایش شبکه', is_active: true, is_public: true,
    }])],

    ['GET', /^\/products\/plans$/, () => page([
        { id: 1, code: 'basic', name: 'پایه', external_plan_code: 'B1', is_active: true, is_public: true,
          prices: [{ id: 1, term_code: 'monthly', amount: '50000000', currency: 'IRR' }], features: [] },
        { id: 2, code: 'pro', name: 'حرفه‌ای', external_plan_code: 'P1', is_active: true, is_public: true,
          prices: [{ id: 2, term_code: 'yearly', amount: '480000000', currency: 'IRR' }], features: [] },
    ])],

    ['GET', /^\/products\/(features|categories)$/, () => page([])],

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

    ['GET', /^\/orders\/payments$/, () => page([])],
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
    ['GET', /^\/ticketing\/departments$/, () =>
        ok([{ id: uuid(), slug: 'tech', name: 'فنی' }, { id: uuid(), slug: 'fin', name: 'مالی' }]),
    ],
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
    ['GET', /^\/ticketing\/tickets\/[^/]+\/messages$/, () => ok([])],
    ['POST', /^\/ticketing\/tickets\/[^/]+\/reply$/, (req) => [201, ok({
        id: uuid(), ticket_id: uuid(), author_type: 'customer',
        message_type: 'public', body: req.body.message,
        created_at: new Date().toISOString(), attachments: [],
    })],
    ],
    ['GET', /^\/ticketing\/tickets\/[^/]+$/, (req) => {
        const t = db.tickets.find((x) => req.path.includes(x.id))
        return t ? ok(t) : [404, fail('NOT_FOUND', 'ticket not found')]
    }],

    /* ─── ادمین ─── */
    ['GET', /^\/admin\/auth\/users$/, () =>
        page([...db.users.values()].map((u, i) => ({
            id: i + 1,
            identifiers: [
                { id: 1, type: 'username', value: u.username, status: 'active', is_verified: true, verified_at: null },
                { id: 2, type: 'email', value: u.email, status: 'active', is_verified: false, verified_at: null },
                { id: 3, type: 'phone', value: u.phone, status: 'active', is_verified: true, verified_at: null },
            ],
            is_active: true,
            created_at: new Date().toISOString(),
            roles: u.roles.map((r) => ({ role: { id: 1, name: r }, assigned_at: null, assigned_by: null })),
            permissions: [],
            kyc_profile: null,
        }))),
    ],
    ['GET', /^\/admin\/auth\/(admins|permissions)$/, () => page([])],
    ['GET', /^\/admin\/auth\/roles$/, () =>
        page([
            { id: 1, name: 'admin', description: 'مدیر سیستم', is_active: true, is_system: true, created_at: null, updated_at: null },
            { id: 2, name: 'support', description: 'پشتیبانی', is_active: true, is_system: false, created_at: null, updated_at: null },
        ]),
    ],
    ['POST', /^\/admin\/auth\/users\/[^/]+\/roles$/, () => ok({ message: 'assigned' })],
    ['PATCH', /^\/admin\/auth\/users\/[^/]+$/, () => ok({ message: 'updated' })],
    ['DELETE', /^\/admin\/auth\/users\/[^/]+$/, () => ok({ message: 'deleted' })],

    ['GET', /^\/admin\/orders\/payments$/, () => page([])],
    ['GET', /^\/admin\/orders\/$/, () => page(db.orders)],
    ['POST', /^\/admin\/orders\/[^/]+\/(quote|status)$/, (req) => {
        const o = db.orders.find((x) => req.path.includes(x.id))
        if (o && req.path.endsWith('/status')) o.status = req.body.status
        if (o && req.path.endsWith('/quote')) {
            o.status = 'QUOTATION_ISSUED'
            o.quoted_amount = String(req.body.quoted_amount ?? 0)
            o.payable_amount = String(req.body.quoted_amount ?? 0)
        }
        return ok(o ?? {})
    }],
    ['POST', /^\/admin\/orders\/[^/]+\/payments\/[^/]+\/verify$/, () => ok({ message: 'verified' })],
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
    ['GET', /^\/admin\/departments\/[^/]+\/members$/, () => ok([])],

    ['GET', /^\/admin\/products$/, () => page([
        { id: 1, code: 'NGC', slug: 'ng-corion', name: 'NG Corion', is_active: true, is_public: true },
    ])],
    ['GET', /^\/admin\/plans$/, () => page([
        { id: 1, code: 'basic', name: 'پایه', external_plan_code: 'B1', is_active: true, is_public: true, prices: [], features: [] },
    ])],
    ['GET', /^\/admin\/features$/, () => page([])],
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
        const { code, name } = req.body ?? {}
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
    ['GET', /^\/admin\/notifications\/templates$/, () => page([])],
    ['GET', /^\/admin\/product-categories$/, () => page([])],

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

    /* لندینگ */
    ['POST', /^\/landing\/(contact|subscribe)$/, () => ok({ message: 'ثبت شد' })],
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Upload-Token')

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end()
        return
    }

    /* ابزارهای کنترل mock */
    if (path === '/__mock/reset') {
        db.users.clear(); db.orders.length = 0; db.tickets.length = 0
        /* اعلان و فاکتور دوباره seed می‌شوند نه خالی — وگرنه بعد از
           reset آن صفحه‌ها خالی می‌مانند و نمی‌شود تستشان کرد. */
        seedNotifications(); seedInvoices(); seedTerms()
        db.nextOrderNum = 1001
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
