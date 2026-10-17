import styles from './CompanyBrand.module.css'
import logoMotion from '../../../../assets/images/sections/logo-motion.png'

/* برچسب‌های دو طرف لوگو — نیمه‌ی اول ستون راست، نیمه‌ی دوم ستون چپ
   (ترتیب خواندن RTL). از CMS یک فهرست می‌آید و همین‌جا نصف می‌شود. */
const ITEMS = [
    { label: 'NGCORION' },
    { label: 'معرفی شرکت' },
    { label: 'تاریخچه' },
    { label: 'چشم انداز و ماموریت' },
    { label: 'تیم مدیریتی' },
    { label: 'افتخارات' },
]

function CompanyBrand({ cms }) {
    /* متن و برچسب‌ها از CMS؛ متن فعلی پیش‌فرض می‌ماند */
    const head = cms?.fields?.('company_brand', {
        section_title: 'معرفی شرکت و برند',
        heading: 'امنیت زیرساخت باید ساده، قابل مشاهده و قابل کنترل باشد',
        body:
            'NGCorion با این نگاه طراحی شده که مدیریت امنیت زیرساخت نباید فقط به ابزارهای پیچیده، فایل‌های اکسل، ممیزی‌های دستی و گزارش‌های پراکنده وابسته باشد.',
    }) ?? {}
    const labels = cms?.items?.('company_brand', ITEMS) ?? ITEMS

    const half = Math.ceil(labels.length / 2)
    const rightItems = labels.slice(0, half)
    const leftItems = labels.slice(half)

    return (
        <section className={styles.section}>
            <h2 className={styles.mainTitle}>{head.section_title}</h2>

            {/* بخش بالا — لوگو و باتن‌ها */}
            <div className={styles.topWrapper}>

                {/* ستون چپ */}
                <div className={styles.leftItems}>
                    {leftItems.map((item, i) => (
                        <button key={`${item.label}-${i}`} className={styles.itemBtn}>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* لوگو وسط */}
                <div className={styles.logoContainer}>
                    <div className={styles.spinRing}></div>
                    <div className={styles.spinRingInner}></div>
                    <img src={logoMotion} alt="NGcorion" className={styles.logo} />
                </div>

                {/* ستون راست */}
                <div className={styles.rightItems}>
                    {rightItems.map((item, i) => (
                        <button key={`${item.label}-${i}`} className={styles.itemBtn}>
                            {item.label}
                        </button>
                    ))}
                </div>

            </div>

            {/* بخش پایین — متن */}
            <div className={styles.bottomWrapper}>
                <h3 className={styles.subtitle}>{head.heading}</h3>
                <p className={styles.description}>{head.body}</p>
                <button className={styles.ctaBtn}>مشاهده صفحه درباره ما</button>
            </div>

        </section>
    )
}

export default CompanyBrand
