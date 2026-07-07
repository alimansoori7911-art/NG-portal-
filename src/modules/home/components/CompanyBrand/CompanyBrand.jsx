import styles from './CompanyBrand.module.css'
import logoMotion from '../../../../assets/images/sections/logo-motion.png'

const LEFT_ITEMS = [
    { id: 1, label: 'چشم انداز و ماموریت' },
    { id: 2, label: 'تیم مدیریتی' },
    { id: 3, label: 'افتخارات' },
]

const RIGHT_ITEMS = [
    { id: 1, label: 'NGCORION' },
    { id: 2, label: 'معرفی شرکت' },
    { id: 3, label: 'تاریخچه' },
]

function CompanyBrand() {
    return (
        <section className={styles.section}>
            <h2 className={styles.mainTitle}>معرفی شرکت و برند</h2>

            {/* بخش بالا — لوگو و باتن‌ها */}
            <div className={styles.topWrapper}>

                {/* ستون چپ */}
                <div className={styles.leftItems}>
                    {LEFT_ITEMS.map(item => (
                        <button key={item.id} className={styles.itemBtn}>
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
                    {RIGHT_ITEMS.map(item => (
                        <button key={item.id} className={styles.itemBtn}>
                            {item.label}
                        </button>
                    ))}
                </div>

            </div>

            {/* بخش پایین — متن */}
            <div className={styles.bottomWrapper}>
                <h3 className={styles.subtitle}>
                    امنیت زیرساخت باید ساده، قابل مشاهده و قابل کنترل باشد
                </h3>
                <p className={styles.description}>
                    NGCorion با این نگاه طراحی شده که مدیریت امنیت زیرساخت نباید فقط به
                    ابزارهای پیچیده، فایل‌های اکسل، ممیزی‌های دستی و گزارش‌های پراکنده وابسته
                    باشد.
                </p>
                <button className={styles.ctaBtn}>مشاهده صفحه درباره ما</button>
            </div>

        </section>
    )
}

export default CompanyBrand