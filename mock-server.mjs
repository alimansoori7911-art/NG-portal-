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
const ORIGIN = 'http://localhost:5173'

/* ─── داده‌ی درون‌حافظه ─── */
const db = {
    users: new Map(), // username -> user
    orders: [],
    tickets: [],
    invoices: [],
    otps: new Map(), // identifier -> code
    nextOrderNum: 1001,
}

/* خطاهای تزریق‌شده: "POST /auth/login" -> 401 */
const forcedErrors = new Map()

const uuid = () =>
    '01930000-0000-7000-8000-' + String(Date.now()).slice(-12).padStart(12, '0')

/* توکن تقلبی با exp واقعی تا tokenManager درست بخواندش */
function makeToken(sub, minutes = 7) {
    const body = Buffer.from(
        JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + minutes * 60 })
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
        roles: u.roles,
    }
}

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
    ['GET', /^\/products\/[^/]+\/plans$/, () => page([])],
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
        const o = {
            id: uuid(),
            order_number: `ORD-${db.nextOrderNum++}`,
            order_type: 'purchase',
            status: 'REQUESTED',
            first_name: u.first_name, last_name: u.last_name,
            product_id: 1, plan_id: req.body.plan_id ?? 1,
            snapshot_product_name: 'NG Corion', snapshot_plan_name: 'پایه',
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
    ['GET', /^\/admin\/billing-term\/$/, () => ok([
        { id: 1, code: 'monthly', name: 'ماهانه', duration_days: 30, is_trial: false, is_active: true },
        { id: 2, code: 'yearly', name: 'سالانه', duration_days: 365, is_trial: false, is_active: true },
    ])],
    ['GET', /^\/admin\/notifications\/templates$/, () => page([])],
    ['GET', /^\/admin\/product-categories$/, () => page([])],

    /* اعلان و فاکتور و لاگ */
    ['GET', /^\/notifications\/$/, () => page([])],
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
    res.setHeader('Access-Control-Allow-Origin', ORIGIN)
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
        forcedErrors.clear()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'reset' }))
        console.log('🔄 داده پاک شد')
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
