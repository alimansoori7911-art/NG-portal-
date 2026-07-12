import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import bgMain from '../../../assets/images/backgrounds/bg-main.png'
import styles from './ContactPage.module.css'

function ContactPage() {
    return (
        <div
            className={styles.page}
            style={{
                backgroundImage: `url(${bgMain})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <Header />
            <main className={styles.main}>
                <div className={styles.placeholder}>صفحه تماس با ما — به‌زودی</div>
            </main>
            <Footer />
        </div>
    )
}

export default ContactPage