import styles from './HeroSection.module.css'
import logo from '../../../../assets/images/logo/logowhite.png'
import heroTop from '../../../../assets/images/hero/hero-top.png'
import heroBottom from '../../../../assets/images/hero/hero-bottom.png'

function HeroSection({ bgImage }) {
    return (
        <section className={styles.hero}>
            <div
                className={styles.box}
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >

                {/* لوگو */}
                <div className={styles.logoWrapper}>
                    <img src={logo} alt="NGcorion" className={styles.logo} />
                </div>

                {/* متن */}
                <div className={styles.textWrapper}>
                    <h1 className={styles.title}>
                        هوشمندتر کار کنید، سریع‌تر رشد کنید
                    </h1>
                    <p className={styles.subtitle}>
                        به جمع کاربران حرفه‌ای بپیوندید و از تمام قابلیت‌های نرم‌افزار بهره‌مند شوید.
                    </p>
                </div>

                {/* دکمه */}
                <button className={styles.ctaBtn}>
                    همین حالا خرید کنید
                </button>

                {/* عکس‌های داشبورد — 3تایی بالا، 4تایی پایین */}
                <div className={styles.heroImages}>
                    <div className={styles.heroRow3}>
                        <img src={heroBottom} alt="نمایش داشبورد" className={styles.heroImg} />
                    </div>
                    <div className={styles.heroRow4}>
                        <img src={heroTop} alt="نمایش داشبورد" className={styles.heroImg} />
                    </div>
                </div>

            </div>
        </section>
    )
}

export default HeroSection