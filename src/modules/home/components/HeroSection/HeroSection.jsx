import styles from './HeroSection.module.css'
import logo from '../../../../assets/images/logo/logowhite.png'
import heroTop from '../../../../assets/images/hero/hero-top.png'
import heroBottom from '../../../../assets/images/hero/hero-bottom.png'
import { ChevronDown } from 'lucide-react'

function HeroSection() {
    const handleScroll = () => {
        document.getElementById('product-intro')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <section className={styles.hero}>
            <div className={styles.box}>

                <div className={styles.logoWrapper}>
                    <img src={logo} alt="NGcorion" className={styles.logo} />
                </div>

                <div className={styles.textWrapper}>
                    <h1 className={styles.title}>
                        هوشمندتر کار کنید، سریع‌تر رشد کنید
                    </h1>
                    <p className={styles.subtitle}>
                        به جمع کاربران حرفه‌ای بپیوندید و از تمام قابلیت‌های نرم‌افزار بهره‌مند شوید.
                    </p>
                </div>

                <button className={styles.ctaBtn}>
                    همین حالا خرید کنید
                </button>

                <div className={styles.heroImages}>
                    <div className={styles.heroRow4}>
                        <img src={heroTop} alt="داشبورد" />
                    </div>
                    <div className={styles.heroRow3}>
                        <img src={heroBottom} alt="داشبورد" />
                    </div>
                </div>

                <button className={styles.scrollBtn} onClick={handleScroll}>
                    NGcorion چیست؟
                    <span className={styles.scrollBtnIcon}>
    <ChevronDown size={18} />
  </span>
                </button>

            </div>
        </section>
    )
}

export default HeroSection