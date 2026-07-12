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

function AboutHistory() {
    const [activeIndex, setActiveIndex] = useState(0)

    const goNext = () => setActiveIndex((i) => Math.min(i + 1, MILESTONES.length - 1))
    const goPrev = () => setActiveIndex((i) => Math.max(i - 1, 0))

    // درصد پرشدگی خط، از مرکز دایره‌ی اول تا مرکز دایره‌ی فعال
    const fillPercent = (activeIndex / (MILESTONES.length - 1)) * 100

    return (
        <section className={styles.section}>
            <div className={styles.timeline}>

                <div className={styles.lineTrack}>
                    <div className={styles.lineFill} style={{ height: `${fillPercent}%` }} />
                </div>

                {MILESTONES.map((item, index) => {
                    const isLit = index <= activeIndex

                    return (
                        <div key={item.year} className={styles.item}>
                            <div className={`${styles.text} ${isLit ? styles.textLit : ''}`}>
                                <h3 className={styles.title}>{item.title}</h3>
                                <p className={styles.desc}>{item.desc}</p>
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