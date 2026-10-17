import styles from './AboutVision.module.css'
import bgImage from '../../../../assets/images/backgrounds/about-vision-bg.png'

function AboutVision({ cms }) {
    /* متن از CMS؛ متن فعلی پیش‌فرض می‌ماند */
    const mission = cms?.fields?.('mission', {
        heading: 'ماموریت(mission)',
        body:
            'ماموریت NGCorion این است که امنیت زیرساخت را از یک فرآیند پراکنده، دستی و دشوار، به یک چرخه ساده، قابل مشاهده، قابل اندازه‌گیری و قابل اقدام تبدیل کند.',
    }) ?? {}

    const vision = cms?.fields?.('vision', {
        heading: 'چشم انداز(vision)',
        body:
            'ما باور داریم تیم‌های امنیت شبکه و امنیت باید به‌جای صرف زمان زیاد روی جمع‌آوری داده، بتوانند سریع‌تر وضعیت را ببینند، اولویت‌ها را تشخیص دهند و اقدام اصلاحی انجام دهند. NGCorion برای همین ساخته شده است: دید بهتر، کنترل بیشتر، ریسک کمتر.',
    }) ?? {}

    /* متن غنی ممکن است HTML باشد (بلوک RICH_TEXT)؛ تگ‌ها را
       برمی‌داریم چون این دو کادر متن ساده می‌خواهند و
       تزریق HTML خام ایمن نیست. */
    const plain = (v) => String(v ?? '').replace(/<[^>]*>/g, '').trim()

    return (
        <section
            className={styles.section}
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className={styles.missionBlock}>
                <h3 className={styles.title}>{mission.heading}</h3>
                <p className={styles.desc}>{plain(mission.body)}</p>
            </div>

            <div className={styles.visionBlock}>
                <h3 className={styles.title}>{vision.heading}</h3>
                <p className={styles.desc}>{plain(vision.body)}</p>
            </div>
        </section>
    )
}

export default AboutVision