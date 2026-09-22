// captcha.js
// ─────────────────────────────────────────────────────────────
// Cloudflare Turnstile — لایه‌ی پایین، مستقل از React.
//
// سه قاعده‌ی Turnstile که کل طراحی این فایل را تعیین می‌کنند:
//   ۱. هر توکن **یک‌بارمصرف** است
//   ۲. توکن حدود ۵ دقیقه عمر دارد
//   ۳. بعد از هر ارسال باید ویجت reset شود تا توکن بعدی صادر شود
//
// پس توکن را زودتر نمی‌گیریم و نگه نمی‌داریم؛ درست لحظه‌ی ارسال فرم
// یکی تازه می‌گیریم. `execute()` همین کار را می‌کند.
// ─────────────────────────────────────────────────────────────

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

/* بدون کلید، کپچا خاموش است: فرم‌ها مثل قبل کار می‌کنند و توکنی
   فرستاده نمی‌شود. این برای محیط توسعه و mock لازم است، وگرنه هر
   کسی که مخزن را clone می‌کند با فرم‌های از کار افتاده روبه‌رو می‌شود. */
export const isCaptchaEnabled = () => Boolean(siteKey)

/* promise بارگذاری کش می‌شود تا چند فرم همزمان اسکریپت را دوبار
   تزریق نکنند. */
let loadPromise = null

export function loadTurnstile() {
    if (!isCaptchaEnabled()) return Promise.resolve(null)
    if (window.turnstile) return Promise.resolve(window.turnstile)
    if (loadPromise) return loadPromise

    loadPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src^="${SCRIPT_SRC}"]`)
        const script = existing ?? document.createElement('script')

        script.addEventListener('load', () => resolve(window.turnstile))
        script.addEventListener('error', () => {
            /* اگر اسکریپت لود نشد (فیلتر، قطعی شبکه) promise را پاک
               می‌کنیم تا دفعه‌ی بعد دوباره تلاش شود. */
            loadPromise = null
            reject(new Error('turnstile-script-failed'))
        })

        if (!existing) {
            script.src = SCRIPT_SRC
            script.async = true
            script.defer = true
            document.head.appendChild(script)
        }
    })

    return loadPromise
}

/**
 * ویجت را در یک container می‌سازد و widgetId می‌دهد.
 * container باید از قبل در DOM باشد.
 *
 * ⚠️ `size: 'invisible'` اینجا **نیست**.
 *
 * راهنمای بک‌اند آن را پیشنهاد کرده بود، ولی نسخه‌ی فعلی Turnstile
 * آن مقدار را نمی‌پذیرد و صریحاً خطا می‌دهد:
 *   Invalid value for parameter "size", expected "compact",
 *   "flexible", or "normal", got "invisible"
 * نامرئی بودن حالا از روی **حالت ویجت در پنل Cloudflare** تعیین
 * می‌شود (Invisible / Managed / Non-interactive)، نه از این پارامتر.
 *
 * `appearance: 'interaction-only'` یعنی تا وقتی چالشی لازم نشود هیچ
 * چیزی نشان داده نمی‌شود — همان تجربه‌ای که می‌خواستیم، و اگر کلید
 * در پنل روی Managed باشد هم درست کار می‌کند.
 */
export async function renderWidget(container) {
    const turnstile = await loadTurnstile()
    if (!turnstile) return null

    return turnstile.render(container, {
        sitekey: siteKey,
        appearance: 'interaction-only',
    })
}

/**
 * یک توکن تازه می‌گیرد.
 *
 * `execute` چالش را اجرا می‌کند و چون ویجت نامرئی است معمولاً بدون
 * دیده شدن چیزی تمام می‌شود. جواب از طریق callback می‌آید، پس آن را
 * در یک promise می‌پیچیم.
 *
 * قبل از اجرا reset می‌کنیم: اگر توکن قبلی هنوز در ویجت مانده باشد،
 * `execute` بدون چالش همان را برمی‌گرداند و بک‌اند توکن تکراری را
 * رد می‌کند.
 */
export function getToken(widgetId, { timeoutMs = 30000 } = {}) {
    const turnstile = window.turnstile
    if (!turnstile || widgetId == null) return Promise.resolve(null)

    /* اگر توکن معتبری از قبل آماده است همان را می‌دهیم. Turnstile
       به‌محض render (یا بعد از حل چالش) توکن را آماده می‌کند. */
    const existing = safeGetResponse(turnstile, widgetId)
    if (existing) return Promise.resolve(existing)

    return new Promise((resolve, reject) => {
        let settled = false
        const finish = (fn, value) => {
            if (settled) return
            settled = true
            clearInterval(poll)
            clearTimeout(timer)
            fn(value)
        }

        /* توکن بعد از render/حل چالش با تأخیر می‌رسد و ویجت در این
           حالت callback ما را صدا نمی‌زند (callback موقع render ست
           می‌شود، نه اینجا). پس کوتاه‌کوتاه سر می‌زنیم. */
        const poll = setInterval(() => {
            const token = safeGetResponse(turnstile, widgetId)
            if (token) finish(resolve, token)
        }, 200)

        const timer = setTimeout(
            () => finish(reject, new Error('captcha-timeout')),
            timeoutMs
        )
    })
}

function safeGetResponse(turnstile, widgetId) {
    try {
        return turnstile.getResponse(widgetId) || null
    } catch {
        /* ویجت هنوز آماده نیست یا توکنش منقضی شده */
        return null
    }
}

export function resetWidget(widgetId) {
    if (window.turnstile && widgetId != null) {
        window.turnstile.reset(widgetId)
    }
}

export function removeWidget(widgetId) {
    if (window.turnstile && widgetId != null) {
        try {
            window.turnstile.remove(widgetId)
        } catch {
            /* اگر ویجت قبلاً پاک شده باشد اهمیتی ندارد */
        }
    }
}
