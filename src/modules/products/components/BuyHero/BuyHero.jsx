import { useNavigate } from 'react-router-dom'
import styles from './BuyHero.module.css'

export default function BuyHero() {
    const navigate = useNavigate()

    // TODO: مسیر صفحه‌ی ثبت سفارش پس از دریافت فیگمایش مشخص می‌شود
    const handleNewOrder = () => navigate('/products/buy/new')
    return (
        <section className={styles.hero}>
            <h1 className={styles.title}>سفارش سریع، دقیق و هوشمند</h1>

            <p className={styles.subtitle}>
                تمام فرآیندهای خرید، سفارش‌گذاری، مدیریت فاکتورها را در یک سیستم
                یکپارچه مدیریت کنید.
            </p>

            <div className={styles.actions}>
                <button type="button" className={styles.actionBtn} onClick={handleNewOrder}>
                    ثبت درخواست سفارش
                </button>
                <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => navigate('/products/buy/orders')}
                >
                    لیست درخواست سفارش ها
                </button>
            </div>
        </section>
    )
}