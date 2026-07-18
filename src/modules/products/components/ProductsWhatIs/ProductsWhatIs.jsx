import styles from './ProductsWhatIs.module.css'

// ترتیب آرایه در RTL از راست به چپ رندر می‌شود — مطابق چیدمان فیگما
const CARDS = [
    {
        id: 'detail-risk',
        titleEn: 'Risk intelligence',
        titleFa: 'هوشمندی ریسک',
        desc: 'از داده های امنیتی تا تصمیم گیری هوشمند',
    },
    {
        id: 'detail-hardening',
        titleEn: 'hardening & Remediation',
        titleFa: 'مقاوم سازی خودکار',
        desc: 'پیدا کردن مشکل کافی نیست،باید آن را اصلاح کنید',
    },
    {
        id: 'detail-compliance',
        titleEn: 'security compliance',
        titleFa: 'انطباق امنیتی',
        desc: 'آنچه اندازه گیری نمی شود،قابل به بهبود نیست',
    },
    {
        id: 'detail-asset',
        titleEn: 'asset management',
        titleFa: 'مدیریت دارایی',
        desc: 'امنیت از شناخت دارایی ها شروع می شود',
    },
]

function ProductsWhatIs() {
    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>
                نرم افزار <span className={styles.titleEn}>NGCORION</span> چیست؟
            </h2>
            <p className={styles.desc}>
                یک پلتفرم متمرکز برای مشاهده، ارزیابی و بهبود امنیت زیرساخت. این نرم افزار
                با ایجاد یک دید یکپارچه از دارایی ها، وضعیت انطباق، تنظیمات امنیتی و ریسک
                های موجود، به سازمان ها کمک می کند تا تصمیمات امنیتی را بر اساس داده های
                واقعی و قابل اندازه گیری اتخاذ کنند.
            </p>

            <div className={styles.cards}>
                {CARDS.map((card) => (
                    <button
                        key={card.id}
                        className={styles.card}
                        onClick={() => scrollTo(card.id)}
                    >
                        <span className={styles.cardTitleEn}>{card.titleEn}</span>
                        <span className={styles.cardTitleFa}>{card.titleFa}</span>
                        <span className={styles.cardDesc}>{card.desc}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}

export default ProductsWhatIs