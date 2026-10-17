import { useCmsContent } from '../../../hooks/useCmsContent'
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
    /* ✅ محتوای صفحه‌ی اصلی از CMS.

       یک‌بار اینجا خوانده می‌شود و به بخش‌ها پاس داده می‌شود؛ اگر
       هر بخش خودش صدا می‌زد، یک صفحه چند درخواست یکسان می‌زد.

       خطا عمداً نادیده گرفته می‌شود: هر بخش متن پیش‌فرض خودش را
       دارد و صفحه‌ی فروش نباید به‌خاطر CMS سفید شود. */
    const cms = useCmsContent('home')

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
                <HeroSection cms={cms} />
                <div className={styles.section}>
                    <ProductIntro cms={cms} />
                </div>
                <div className={styles.section}>
                    <Features cms={cms} />
                </div>
                <div className={styles.section}>
                    <WhyNG cms={cms} />
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