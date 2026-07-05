import styles from './Features.module.css'

const FEATURES = [
    {
        id: 1,
        title: 'سخت‌سازی هوشمند و خودکار',
        description: 'تبدیل فرآیندهای پیچیده Hardening به عملیات ساده، سریع و قابل تکرار با حداقل خطای انسانی.',
    },
    {
        id: 2,
        title: 'ممیزی مبتنی بر استانداردهای CIS',
        description: 'ارزیابی امنیتی تجهیزات و سرویس‌ها بر اساس استانداردهای معتبر بین‌المللی و ارائه گزارش‌های دقیق انطباق و عدم انطباق.',
    },
    {
        id: 3,
        title: 'پلتفرم یکپارچه به جای چندین ابزار مجزا',
        description: 'قابلیت‌های Asset Management، Security Auditing، Hardening، Configuration Backup و Risk Intelligence را در یک پلتفرم واحد ارائه می‌کند و نیاز به استفاده از چندین محصول مختلف را کاهش می‌دهد.',
    },
    {
        id: 4,
        title: 'توسعه یافته بر اساس نیاز واقعی سازمان‌ها',
        description: 'حاصل تجربه عملی در پروژه‌های شبکه و امنیت بوده و با تمرکز بر چالش‌های واقعی سازمان‌ها طراحی شده است.',
    },
    {
        id: 5,
        title: 'گزارش‌های مدیریتی و فنی',
        description: 'ارائه داشبوردها و گزارش‌های عملیاتی برای کارشناسان، مدیران فناوری اطلاعات و مدیران ارشد سازمان.',
    },
    {
        id: 6,
        title: 'شناسایی مستمر ریسک‌ها و Exposure‌ها',
        description: 'کشف سرویس‌های ناامن، تنظیمات پرخطر، پورت‌های باز غیرضروری و ضعف‌های امنیتی پیش از تبدیل شدن به رخدادهای واقعی.',
    },
]

function Features() {
    return (
        <section className={styles.section}>
            <h2 className={styles.mainTitle}>مزایا و ویژگی‌های رقابتی</h2>

            <div className={styles.grid}>
                {FEATURES.map(feature => (
                    <div key={feature.id} className={styles.card}>
                        <div className={styles.cardInner}>
                            <h3 className={styles.cardTitle}>{feature.title}</h3>
                            <p className={styles.cardDescription}>{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Features