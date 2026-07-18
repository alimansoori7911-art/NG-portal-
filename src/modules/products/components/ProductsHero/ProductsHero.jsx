import { useNavigate } from 'react-router-dom'
import styles from './ProductsHero.module.css'

function ProductsHero() {
    const navigate = useNavigate()

    const scrollToWhatIsIt = () => {
        document.getElementById('what-is-it')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <section className={styles.hero}>
            <h1 className={styles.title}>
                آیا می دانید همین حالا چه ریسک هایی در زیرساخت شما وجود دارد؟
            </h1>

            <p className={styles.desc}>
                بیشتر سازمان‌ها تصور می‌کنند دید مناسبی به دارایی‌ها، وضعیت امنیتی و
                ریسک‌های خود دارند، اما در عمل بسیاری از نقاط ضعف، تغییرات ناخواسته و
                دارایی‌های ناشناخته تا زمان وقوع حادثه شناسایی نمی‌شوند.
            </p>

            <div className={styles.actions}>
                {/* در RTL اولین عنصر سمت راست می‌نشیند — دکمه‌ی آبی طبق فیگما راست است */}
                <button className={styles.btnPrimary} onClick={scrollToWhatIsIt}>
                    محصول ngcorion چیست؟
                </button>
                {/* مقصد این دکمه هنوز مشخص نیست — فعلاً placeholder */}
                <button className={styles.btnSecondary} onClick={() => navigate('/products/buy')}>
                    رفتن به صفحه خرید محصول
                </button>
            </div>
        </section>
    )
}

export default ProductsHero