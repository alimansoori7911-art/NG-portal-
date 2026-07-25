import Header from '../../../components/layout/Header/Header'
import orbImage from '../../../assets/images/helpdesk/helpdesk-orb.png'
import { useNavigate } from 'react-router-dom'
import styles from './HelpdeskPage.module.css'

function HelpdeskPage() {
    const navigate = useNavigate()
    return (
        <>
            <Header />

            <main className={styles.page}>
                {/* گوی نورانی — هاله با CSS ساخته می‌شود، PNG فقط حباب مرکزی است */}
                <div className={styles.orb}>
                    <span className={styles.glowOuter} aria-hidden="true" />
                    <span className={styles.glowMid} aria-hidden="true" />
                    <span className={styles.glowCore} aria-hidden="true" />
                    <img src={orbImage} alt="" className={styles.orbImage} />
                </div>

                <h1 className={styles.title}>چطور می‌توانیم به شما کمک کنیم؟</h1>

                <p className={styles.description}>
                    برای پیگیری سفارش، مشاوره فنی یا گزارش مشکلات، تیکت جدید ثبت کنید.
                    کارشناسان ما آماده پاسخگویی به درخواست‌های شما هستند.
                </p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => navigate('/helpdesk/new')}
                    >
                        ثبت تیکت
                    </button>
                    {/* TODO: مسیر لیست تیکت‌ها بعداً مشخص می‌شود */}
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => navigate('/helpdesk/tickets')}
                    >
                        مشاهده تیکت ها
                    </button>
                </div>
            </main>
        </>
    )
}

export default HelpdeskPage