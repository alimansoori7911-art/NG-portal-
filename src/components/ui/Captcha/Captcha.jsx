import styles from './Captcha.module.css'

/**
 * ظرف ویجت Turnstile.
 *
 * `ref` را به `useCaptcha()` وصل کن و این را **آخرِ فرم**، درست بالای
 * دکمه‌ی ارسال، بگذار:
 *
 *   const { containerRef, execute } = useCaptcha()
 *   ...
 *   <Captcha ref={containerRef} />
 *   <Button type="submit">…</Button>
 *
 * جای قرار گرفتن عمداً به خودِ JSX سپرده شده، نه به ترفند CSS مثل
 * `order`: آن فقط داخل والدِ flex/grid کار می‌کند و در فرم‌هایی که
 * چیدمان دیگری دارند بی‌اثر است.
 *
 * دو لایه دارد چون ویجت عرض ثابت ۳۰۰px دارد: لایه‌ی بیرونی «ظرفِ
 * اندازه‌گیری» است و لایه‌ی داخلی همان چیزی که در صورت تنگی جا
 * کوچک می‌شود. یک المان نمی‌تواند هم‌زمان معیار و مقیاس‌شونده باشد.
 */
function Captcha({ ref, className = '' }) {
    return (
        <div className={`${styles.captcha} ${className}`.trim()}>
            <div ref={ref} className={styles.captchaInner} />
        </div>
    )
}

export default Captcha
