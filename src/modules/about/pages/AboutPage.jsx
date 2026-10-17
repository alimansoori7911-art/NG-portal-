import { useCmsContent } from '../../../hooks/useCmsContent'
import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import AboutHero from '../components/AboutHero/AboutHero'
import AboutIntro from '../components/AboutIntro/AboutIntro'
import AboutVision from '../components/AboutVision/AboutVision'
import AboutHistory from '../components/AboutHistory/AboutHistory'
import styles from './AboutPage.module.css'

function AboutPage() {
    /* ✅ محتوای صفحه از CMS — یک‌بار اینجا خوانده و به بخش‌ها
       پاس داده می‌شود، تا چند درخواست یکسان نزنیم. */
    const cms = useCmsContent('company')

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <AboutHero cms={cms} />

                <div id="intro" className={styles.section}>
                    <AboutIntro cms={cms} />
                </div>

                <div id="vision" className={styles.section}>
                    <AboutVision cms={cms} />
                </div>

                <div id="history" className={styles.section}>
                    <AboutHistory cms={cms} />
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default AboutPage