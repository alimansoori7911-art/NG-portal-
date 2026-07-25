import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import ProductsHero from '../components/ProductsHero/ProductsHero'
import ProductsWhatIs from '../components/ProductsWhatIs/ProductsWhatIs'
import ProductsDetails from '../components/ProductsDetails/ProductsDetails'
import ProductsPlans from '../components/ProductsPlans/ProductsPlans'
import ProductsDemo from '../components/Productsdemo/ProductsDemo.jsx'
import styles from './ProductsPage.module.css'

function ProductsPage() {
    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <ProductsHero />

                <div id="what-is-it" className={styles.section}>
                    <ProductsWhatIs />
                </div>

                <ProductsDetails />

                {/* placeholder — بخش پلن‌ها و درخواست دمو با فیگمای خودشان ساخته می‌شوند */}
                <div id="plans" className={styles.section}>
                    <ProductsPlans />
                </div>
                <div id="demo" className={styles.section}>
                    <ProductsDemo />
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default ProductsPage