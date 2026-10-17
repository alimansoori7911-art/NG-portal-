import { Link } from 'react-router-dom'
import { Home, LifeBuoy, SearchX } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import styles from './NotFoundPage.module.css'

/**
 * صفحه‌ی ۴۰۴.
 *
 * ⚠️ تا پیش از این، راوتر هیچ مسیر `*` نداشت: هر آدرس اشتباهی یک
 * صفحه‌ی **کاملاً سفید** می‌داد — نه خطا، نه راه برگشت. کاربر فکر
 * می‌کرد سایت خراب است.
 *
 * عمداً لینک‌های برگشت می‌دهد نه فقط پیام خطا، چون کاربری که اینجا
 * می‌رسد معمولاً لینک قدیمی یا تایپ اشتباه داشته.
 */
export default function NotFoundPage() {
    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <span className={styles.icon} aria-hidden="true">
                    <SearchX size={40} />
                </span>

                <p className={styles.code}>۴۰۴</p>
                <h1 className={styles.title}>این صفحه پیدا نشد</h1>

                <p className={styles.text}>
                    ممکن است نشانی را اشتباه وارد کرده باشید یا این صفحه جابه‌جا
                    شده باشد.
                </p>

                <div className={styles.actions}>
                    <Link to="/" className={styles.primaryBtn}>
                        <Home size={18} />
                        بازگشت به صفحه‌ی اصلی
                    </Link>

                    <Link to="/helpdesk" className={styles.ghostBtn}>
                        <LifeBuoy size={18} />
                        ارتباط با پشتیبانی
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    )
}
