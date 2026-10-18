import { useEffect, useState } from 'react'
import styles from './AboutIntro.module.css'
import bgImage from '../../../../assets/images/backgrounds/about-intro-bg.png'

const AUTO_ADVANCE_MS = 5000

const REASONS = [
    {
        title: 'عدم شناخت ریسک واقعی',
        description: 'سازمان‌ها همیشه نمی‌دانند کدام دارایی بیشترین ریسک عملیاتی و امنیتی را دارد.',
    },
    {
        title: 'نبود بکاپ ساختاریافته',
        description: 'بدون یک برنامه‌ی منظم و مستند، بازیابی اطلاعات در زمان بحران با شکست مواجه می‌شود.',
    },
    {
        title: 'هاردنینگ زمان‌بر',
        description: 'اجرای دستی فرآیندهای سخت‌سازی ساعت‌ها زمان کارشناسان امنیتی را می‌گیرد و اغلب ناقص باقی می‌ماند.',
    },
    {
        title: 'ممیزی دستی',
        description: 'ممیزی‌های مبتنی بر چک‌لیست کاغذی، مستعد خطای انسانی و فراموش‌شدن موارد حیاتی هستند.',
    },
    {
        title: 'نبود دید متمرکز',
        description: 'پراکندگی داده‌ها در ابزارهای مختلف، تصمیم‌گیری سریع و دقیق را برای مدیران دشوار می‌کند.',
    },
]

function AboutIntro({ cms }) {
    const [activeIndex, setActiveIndex] = useState(0)

    /* سرنامه و کارت‌ها از CMS؛ مقادیر فعلی پیش‌فرض‌اند.

       ⚠️ کاروسل به طول آرایه وابسته است، پس اگر ادمین تعداد
       کارت‌ها را کم کند، ایندکس فعلی ممکن است بیرون از محدوده
       بیفتد و صفحه خالی شود. پس محدودش می‌کنیم. */
    const head = cms?.fields?.('intro', {
        section_title: 'چرا NGCORION ساخته شده؟',
        body: '- امنیت زیرساخت باید ساده، قابل مشاهده و قابل کنترل باشد',
    }) ?? {}
    const cards = cms?.items?.('intro', REASONS) ?? REASONS
    const safeIndex = Math.min(activeIndex, Math.max(0, cards.length - 1))

    /* پیشروی خودکار هر ۵ ثانیه؛ با هر تغییر index (چه خودکار چه با
       کلیک) تایمر از نو شروع می‌شود.

       ⚠️ دور زدن روی تعداد کارت‌های **CMS** است، نه ۵ کارت پیش‌فرض.
       قبلاً با کارت کمتر، کاروسل چند دور روی کارت آخر می‌ماند و هیچ
       دکمه‌ای فعال نبود. */
    const count = cards.length
    useEffect(() => {
        if (count < 2) return
        const timer = setTimeout(() => {
            setActiveIndex((prev) => (Math.min(prev, count - 1) + 1) % count)
        }, AUTO_ADVANCE_MS)
        return () => clearTimeout(timer)
    }, [activeIndex, count])

    const handleSelect = (index) => {
        setActiveIndex(index)
    }

    return (
        <section
            className={styles.section}
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <h2 className={styles.title}>{head.section_title}</h2>
            <p className={styles.subtitle}>{head.body}</p>

            {/* کارت‌های کاروسل: فقط همسایه‌های بلافصل کارت فعال دیده می‌شوند */}
            <div className={styles.carousel}>
                {cards.map((reason, index) => {
                    const offset = index - safeIndex
                    const isActive = offset === 0
                    const isVisible = Math.abs(offset) <= 1

                    if (!isVisible) return null

                    return (
                        <div
                            key={`${reason.title}-${index}`}
                            className={`${styles.card} ${isActive ? styles.cardActive : styles.cardDimmed}`}
                            style={{ transform: `translateX(${offset * -50}%)` }}
                        >
                            <h3 className={styles.cardTitle}>{reason.title}</h3>
                            <p className={styles.cardDesc}>{reason.description}</p>
                        </div>
                    )
                })}
            </div>

            {/* دکمه‌های انتخاب + نوار پیشرفت زیر دکمه‌ی فعال */}
            <div className={styles.tabs}>
                {cards.map((reason, index) => (
                    <button
                        key={`${reason.title}-${index}`}
                        className={`${styles.tabBtn} ${index === safeIndex ? styles.tabBtnActive : ''}`}
                        onClick={() => handleSelect(index)}
                    >
                        {reason.title}
                        {index === safeIndex && (
                            <span className={styles.progressTrack}>
                                {/* key باعث می‌شود انیمیشن با هر تغییر از نو شروع شود */}
                                <span key={safeIndex} className={styles.progressFill} />
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </section>
    )
}

export default AboutIntro