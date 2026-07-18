import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import styles from './ProductsBuyPage.module.css'

function ProductsBuyPage() {
    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.placeholder}>صفحه خرید محصول — به‌زودی</div>
            </main>
            <Footer />
        </div>
    )
}

export default ProductsBuyPage