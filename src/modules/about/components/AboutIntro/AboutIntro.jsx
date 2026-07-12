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

function AboutIntro() {
    const [activeIndex, setActiveIndex] = useState(0)

    // پیشروی خودکار هر ۵ ثانیه؛ با هر تغییر index (چه خودکار چه با کلیک) تایمر از نو شروع می‌شود
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveIndex((prev) => (prev + 1) % REASONS.length)
        }, AUTO_ADVANCE_MS)
        return () => clearTimeout(timer)
    }, [activeIndex])

    const handleSelect = (index) => {
        setActiveIndex(index)
    }

    return (
        <section
            className={styles.section}
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <h2 className={styles.title}>چرا NGCORION ساخته شده؟</h2>
            <p className={styles.subtitle}>
                - امنیت زیرساخت باید ساده، قابل مشاهده و قابل کنترل باشد
            </p>

            {/* کارت‌های کاروسل: فقط همسایه‌های بلافصل کارت فعال دیده می‌شوند */}
            <div className={styles.carousel}>
                {REASONS.map((reason, index) => {
                    const offset = index - activeIndex
                    const isActive = offset === 0
                    const isVisible = Math.abs(offset) <= 1

                    if (!isVisible) return null

                    return (
                        <div
                            key={reason.title}
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
                {REASONS.map((reason, index) => (
                    <button
                        key={reason.title}
                        className={`${styles.tabBtn} ${index === activeIndex ? styles.tabBtnActive : ''}`}
                        onClick={() => handleSelect(index)}
                    >
                        {reason.title}
                        {index === activeIndex && (
                            <span className={styles.progressTrack}>
                                {/* key باعث می‌شود انیمیشن با هر تغییر از نو شروع شود */}
                                <span key={activeIndex} className={styles.progressFill} />
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </section>
    )
}

export default AboutIntro