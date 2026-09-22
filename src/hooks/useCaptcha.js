import { useCallback, useEffect, useRef, useState } from 'react'
import {
    isCaptchaEnabled,
    renderWidget,
    removeWidget,
    resetWidget,
    getToken,
} from '../services/captcha'

/**
 * کپچای Turnstile برای یک فرم.
 *
 * استفاده:
 *   const { containerRef, execute, captchaError } = useCaptcha()
 *   ...
 *   <div ref={containerRef} />
 *   // در onSubmit:
 *   const token = await execute()
 *   await someService.call(payload, { captchaToken: token })
 *
 * `execute()` هر بار توکن **تازه** می‌گیرد چون توکن‌ها یک‌بارمصرف‌اند.
 * اگر کلید سایت تنظیم نشده باشد null برمی‌گرداند و فرم عادی کار می‌کند.
 */
export function useCaptcha() {
    const containerRef = useRef(null)
    const widgetIdRef = useRef(null)
    const [captchaError, setCaptchaError] = useState(null)

    useEffect(() => {
        if (!isCaptchaEnabled() || !containerRef.current) return

        let cancelled = false

        /* هر بار داخل یک المان **تازه** render می‌کنیم، نه خود
           containerRef.

           Turnstile به‌طور داخلی نگه می‌دارد که کدام المان قبلاً ویجت
           گرفته و اگر دوباره روی همان صدا زده شود
           «already been rendered in this container» می‌دهد و ویجت
           ساخته نمی‌شود. در StrictMode (توسعه) افکت دوبار اجرا می‌شود
           و چون render غیرهمزمان است، پاک‌سازی نوبت اول بعد از شروع
           نوبت دوم می‌رسد — پس خالی کردن innerHTML کافی نیست.
           المان تازه این تداخل را به‌کلی حذف می‌کند. */
        const node = document.createElement('div')
        containerRef.current.appendChild(node)

        renderWidget(node)
            .then((id) => {
                if (cancelled) {
                    removeWidget(id)
                    return
                }
                widgetIdRef.current = id
            })
            .catch(() => {
                /* لود نشدن اسکریپت نباید فرم را قفل کند؛ موقع ارسال
                   پیام مناسب نشان داده می‌شود. */
                if (!cancelled) widgetIdRef.current = null
            })

        return () => {
            cancelled = true
            removeWidget(widgetIdRef.current)
            widgetIdRef.current = null
            node.remove()
        }
    }, [])

    const execute = useCallback(async () => {
        setCaptchaError(null)
        if (!isCaptchaEnabled()) return null

        try {
            const token = await getToken(widgetIdRef.current)
            /* توکن یک‌بارمصرف است: بلافاصله ویجت را reset می‌کنیم تا
               برای ارسال بعدی توکن تازه آماده شود. اگر اینجا reset
               نکنیم، تلاش دوم همان توکن سوخته را می‌فرستد و بک‌اند
               `captcha_invalid` می‌دهد. */
            resetWidget(widgetIdRef.current)
            return token
        } catch {
            resetWidget(widgetIdRef.current)
            setCaptchaError(
                'تأیید امنیتی انجام نشد. لطفاً دوباره تلاش کنید.'
            )
            throw new Error('captcha-failed')
        }
    }, [])

    return { containerRef, execute, captchaError, setCaptchaError }
}
