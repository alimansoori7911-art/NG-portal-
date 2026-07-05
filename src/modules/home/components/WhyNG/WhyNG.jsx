import styles from './WhyNG.module.css'
import whyImage from '../../../../assets/images/sections/why-ng.png'

function WhyNG() {
    return (
        <section className={styles.section}>
            <div className={styles.imageWrapper}>
                <img src={whyImage} alt="چرا NG CORION" className={styles.image} />
            </div>

            <div className={styles.content}>
                <h2 className={styles.title}>
                    چرا NG CORION
                </h2>
                <p className={styles.description}>
                    در بسیاری از سازمان‌ها، اطلاعات دارایی‌ها در یک سامانه نگهداری می‌شود،
                    ممیزی‌های امنیتی با ابزار دیگری انجام می‌شود، فرآیندهای سخت‌سازی در قالب
                    چک‌لیست‌های دستی اجرا می‌شوند و شناسایی ریسک‌ها و ضعف‌های امنیتی نیز
                    به ابزارها و گزارش‌های جداگانه وابسته است.
                </p>
                <button className={styles.ctaBtn}>درخواست مشاوره</button>
            </div>
        </section>
    )
}

export default WhyNG