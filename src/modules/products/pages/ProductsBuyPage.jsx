import Header from '../../../components/layout/Header/Header'
import BuyHero from '../components/BuyHero/BuyHero'
import FloatingBuyButton from '../components/FloatingBuyButton/FloatingBuyButton'
import styles from './ProductsBuyPage.module.css'

/* صفحه‌ی خرید — تمام‌صفحه، بدون اسکرول و بدون فوتر (مطابق فیگما) */
function ProductsBuyPage() {
    return (
        <div className={styles.page}>
            <Header />
            <FloatingBuyButton />

            {/* درخشش پس‌زمینه — گرادیان شعاعی از SVG */}
            <div className={styles.glow} aria-hidden="true" />

            <main className={styles.main}>
                <BuyHero />
            </main>
        </div>
    )
}

export default ProductsBuyPage