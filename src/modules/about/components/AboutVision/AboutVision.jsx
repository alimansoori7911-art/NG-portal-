import styles from './AboutVision.module.css'
import bgImage from '../../../../assets/images/backgrounds/about-vision-bg.png'

function AboutVision() {
    return (
        <section
            className={styles.section}
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className={styles.missionBlock}>
                <h3 className={styles.title}>ماموریت(mission)</h3>
                <p className={styles.desc}>
                    ماموریت NGCorion این است که امنیت زیرساخت را از یک فرآیند پراکنده،
                    دستی و دشوار، به یک چرخه ساده، قابل مشاهده، قابل اندازه‌گیری و
                    قابل اقدام تبدیل کند.
                </p>
            </div>

            <div className={styles.visionBlock}>
                <h3 className={styles.title}>چشم انداز(vision)</h3>
                <p className={styles.desc}>
                    ما باور داریم تیم‌های امنیت شبکه و امنیت باید به‌جای صرف زمان زیاد
                    روی جمع‌آوری داده، بتوانند سریع‌تر وضعیت را ببینند، اولویت‌ها را
                    تشخیص دهند و اقدام اصلاحی انجام دهند. NGCorion برای همین ساخته
                    شده است: دید بهتر، کنترل بیشتر، ریسک کمتر.
                </p>
            </div>
        </section>
    )
}

export default AboutVision