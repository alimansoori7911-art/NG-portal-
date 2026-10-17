import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import styles from './AboutHistory.module.css'

const MILESTONES = [
    { year: 2023, title: 'ایده اولیه', desc: 'تمرکز روی مدیریت دارایی و ممیزی امنیتی.' },
    { year: 2024, title: 'نسخه اول', desc: 'Asset، Audit، Hardening و Backup.' },
    { year: 2025, title: 'Risk Intelligence', desc: 'افزودن تحلیل ریسک و Exposure.' },
    { year: 2026, title: 'Vendor Expansion', desc: 'گسترش پشتیبانی از Vendorها و سرویس‌ها.' },
    { year: 2027, title: 'AI Assistant', desc: 'هوشمندسازی تحلیل و پیشنهاد اقدام اصلاحی.' },
]

function AboutHistory({ cms }) {
    const [activeIndex, setActiveIndex] = useState(0)

    /* تایم‌لاین از CMS؛ مقادیر فعلی پیش‌فرض‌اند.

       نام فیلد در CMS «description» است ولی در کد «desc»؛ هر دو را
       تحمل می‌کنیم تا مقدار پیش‌فرض هم کار کند.

       ⚠️ همه‌ی محاسبات باید روی همین آرایه باشند نه آرایه‌ی
       ثابت؛ اگر ادمین تعداد را عوض کند، دکمه‌ی بعدی و نوار
       پیشرفت وگرنه غلط می‌شوند. */
    const milestones = cms?.items?.('history', MILESTONES) ?? MILESTONES
    const lastIndex = Math.max(0, milestones.length - 1)
    const safeIndex = Math.min(activeIndex, lastIndex)

    const goNext = () => setActiveIndex((i) => Math.min(i + 1, lastIndex))
    const goPrev = () => setActiveIndex((i) => Math.max(i - 1, 0))

    // درصد پرشدگی خط، از مرکز دایره‌ی اول تا مرکز دایره‌ی فعال
    const fillPercent = lastIndex > 0 ? (safeIndex / lastIndex) * 100 : 0

    return (
        <section className={styles.section}>
            <div className={styles.timeline}>

                <div className={styles.lineTrack}>
                    <div className={styles.lineFill} style={{ height: `${fillPercent}%` }} />
                </div>

                {milestones.map((item, index) => {
                    const isLit = index <= safeIndex

                    return (
                        <div key={item.year} className={styles.item}>
                            <div className={`${styles.text} ${isLit ? styles.textLit : ''}`}>
                                <h3 className={styles.title}>{item.title}</h3>
                                <p className={styles.desc}>{item.description ?? item.desc}</p>
                            </div>

                            <div className={`${styles.circle} ${isLit ? styles.circleLit : ''}`}>
                                {item.year}
                            </div>
                        </div>
                    )
                })}

                {/* فلش‌ها همیشه در وسط تایم‌لاین ثابت هستند (مطابق فیگما) */}
                <div className={styles.arrows}>
                    <button
                        className={styles.arrowBtn}
                        onClick={goPrev}
                        disabled={activeIndex === 0}
                        aria-label="مرحله قبل"
                    >
                        <ChevronUp size={15} />
                    </button>
                    <button
                        className={styles.arrowBtn}
                        onClick={goNext}
                        disabled={activeIndex === MILESTONES.length - 1}
                        aria-label="مرحله بعد"
                    >
                        <ChevronDown size={15} />
                    </button>
                </div>

            </div>
        </section>
    )
}

export default AboutHistory