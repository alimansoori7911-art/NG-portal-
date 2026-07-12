import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import AboutHero from '../components/AboutHero/AboutHero'
import AboutIntro from '../components/AboutIntro/AboutIntro'
import AboutVision from '../components/AboutVision/AboutVision'
import AboutHistory from '../components/AboutHistory/AboutHistory'
import styles from './AboutPage.module.css'

function AboutPage() {
    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <AboutHero />

                <div id="intro" className={styles.section}>
                    <AboutIntro />
                </div>

                <div id="vision" className={styles.section}>
                    <AboutVision />
                </div>

                <div id="history" className={styles.section}>
                    <AboutHistory />
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default AboutPage