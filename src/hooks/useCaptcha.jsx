import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    isCaptchaEnabled,
    renderWidget,
    removeWidget,
    resetWidget,
    getToken,
} from '../services/captcha'
import styles from './useCaptcha.module.css'

/**
 * کپچای Turnstile برای یک فرم.
 *
 * استفاده:
 *   const { Captcha, execute } = useCaptcha()
 *   ...
 *   <Captcha />          // هر جای فرم؛ خودش آخر می‌نشیند
 *   // در onSubmit:
 *   const token = await execute()
 *   await someService.call(payload, { captchaToken: token })
 *
 * `Captcha` ظرف آماده‌ای با استایل مشترک است تا ویجت در همه‌ی فرم‌ها
 * یک‌جور و **زیر** فیلدها بنشیند؛ قبلاً هر صفحه یک `<div>` خام
 * می‌گذاشت و چون اولین فرزند فرم بود، بالای همه‌چیز می‌افتاد و
 * چیدمان را به‌هم می‌ریخت.
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

    /* ظرف آماده. `useMemo` لازم است وگرنه هر رندر یک نوع کامپوننت
       تازه می‌سازد، React درخت را دور می‌ریزد و ویجت هر بار از نو
       ساخته می‌شود. */
    const Captcha = useMemo(
        () =>
            function Captcha({ className = '' }) {
                return (
                    <div
                        ref={containerRef}
                        className={`${styles.captcha} ${className}`.trim()}
                    />
                )
            },
        []
    )

    return { Captcha, containerRef, execute, captchaError, setCaptchaError }
}
