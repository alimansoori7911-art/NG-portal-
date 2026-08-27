import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import ProductsHero from '../components/ProductsHero/ProductsHero'
import ProductsWhatIs from '../components/ProductsWhatIs/ProductsWhatIs'
import ProductsDetails from '../components/ProductsDetails/ProductsDetails'
import ProductsPlans from '../components/ProductsPlans/ProductsPlans'
import ProductsDemo from '../components/Productsdemo/ProductsDemo.jsx'
import { useDemoRequest } from '../hooks/useDemoRequest'
import styles from './ProductsPage.module.css'

function ProductsPage() {
    const navigate = useNavigate()

    const {
        isAuthenticated,
        existing,
        checking,
        submitting,
        error,
        created,
        requestDemo,
    } = useDemoRequest()

    /* اندپوینت دمو لاگین می‌خواهد، پس کاربر مهمان اول باید وارد شود.
       بعد از ورود به همین‌جا برمی‌گردد تا دوباره دنبال دکمه نگردد.

       `from` باید شیء شبیه location باشد نه رشته — LoginPage آن را با
       `state.from.pathname` می‌خواند و رشته را نادیده می‌گیرد. */
    const handleRequestDemo = async () => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: { from: { pathname: '/products', hash: '#demo' } },
            })
            return
        }

        const order = await requestDemo()
        if (order) navigate('/products/buy/orders')
    }

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
                    <ProductsDemo
                        onRequestDemo={handleRequestDemo}
                        loading={submitting || checking}
                        alreadyRequested={Boolean(existing)}
                        isAuthenticated={isAuthenticated}
                        error={error}
                        message={created ? 'درخواست دموی شما ثبت شد.' : null}
                    />
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default ProductsPage
