import Header from '../../../components/layout/Header/Header'
import Footer from '../../../components/layout/Footer/Footer'
import HeroSection from '../components/HeroSection/HeroSection'
import ProductIntro from '../components/ProductIntro/ProductIntro'
import Features from '../components/Features/Features'
import WhyNG from '../components/WhyNG/WhyNG'
import Plans from '../components/Plans/Plans'
import CompanyBrand from '../components/CompanyBrand/CompanyBrand'
import Clients from '../components/Clients/Clients'
import bgMain from '../../../assets/images/backgrounds/bg-main.png'
import styles from './HomePage.module.css'

function HomePage() {
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
                <HeroSection />
                <div className={styles.section}>
                    <ProductIntro />
                </div>
                <div className={styles.section}>
                    <Features />
                </div>
                <div className={styles.section}>
                    <WhyNG />
                </div>
                <div className={styles.section}>
                    <Plans />
                </div>
                <div className={styles.section}>
                    <CompanyBrand />
                </div>
                <div className={styles.section}>
                    <Clients />
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default HomePage