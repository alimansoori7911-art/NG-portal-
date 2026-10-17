import { productAnchor } from '../../utils/productAnchor'
import styles from './ProductsWhatIs.module.css'

const DESC =
    'یک پلتفرم متمرکز برای مشاهده، ارزیابی و بهبود امنیت زیرساخت. این نرم افزار با ایجاد یک دید یکپارچه از دارایی ها، وضعیت انطباق، تنظیمات امنیتی و ریسک های موجود، به سازمان ها کمک می کند تا تصمیمات امنیتی را بر اساس داده های واقعی و قابل اندازه گیری اتخاذ کنند.'

// ترتیب آرایه در RTL از راست به چپ رندر می‌شود — مطابق چیدمان فیگما
const CARDS = [
    {
        title_en: 'Risk intelligence',
        title_fa: 'هوشمندی ریسک',
        description: 'از داده های امنیتی تا تصمیم گیری هوشمند',
    },
    {
        title_en: 'hardening & Remediation',
        title_fa: 'مقاوم سازی خودکار',
        description: 'پیدا کردن مشکل کافی نیست،باید آن را اصلاح کنید',
    },
    {
        title_en: 'security compliance',
        title_fa: 'انطباق امنیتی',
        description: 'آنچه اندازه گیری نمی شود،قابل به بهبود نیست',
    },
    {
        title_en: 'asset management',
        title_fa: 'مدیریت دارایی',
        description: 'امنیت از شناخت دارایی ها شروع می شود',
    },
]

function ProductsWhatIs({ cms }) {
    /* متن و کارت‌ها از CMS؛ متن فعلی پیش‌فرض می‌ماند.

       `section_title` پیش‌فرض ندارد چون عنوان فعلی بخشی لاتین با
       استایل جدا دارد؛ تا CMS عنوانی نداده، همان JSX نشان داده
       می‌شود. */
    const head = cms?.fields?.('what_is', { section_title: '', body: DESC }) ?? {
        body: DESC,
    }
    const cards = cms?.items?.('what_is', CARDS) ?? CARDS

    const scrollTo = (id) => {
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>
                {head.section_title || (
                    <>
                        نرم افزار <span className={styles.titleEn}>NGCORION</span> چیست؟
                    </>
                )}
            </h2>
            <p className={styles.desc}>{head.body}</p>

            <div className={styles.cards}>
                {cards.map((card, i) => (
                    <button
                        key={`${card.title_fa}-${i}`}
                        className={styles.card}
                        onClick={() => scrollTo(productAnchor(card))}
                    >
                        {card.title_en && (
                            <span className={styles.cardTitleEn}>{card.title_en}</span>
                        )}
                        <span className={styles.cardTitleFa}>{card.title_fa}</span>
                        <span className={styles.cardDesc}>{card.description}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}

export default ProductsWhatIs
