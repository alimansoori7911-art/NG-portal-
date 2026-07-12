import styles from './AboutHero.module.css'

// ترتیب آرایه از راست به چپ رندر می‌شود (RTL)، بنابراین اولین آیتم راست‌ترین دکمه است
const NAV_BUTTONS = [
    { label: 'معرفی شرکت', targetId: 'intro' },
    { label: 'چشم انداز و ماموریت', targetId: 'vision' },
    { label: 'تاریخچه', targetId: 'history' },
]

function AboutHero() {
    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <section className={styles.hero}>
            <div className={styles.logoMask} aria-label="NGcorion" role="img" />

            <div className={styles.navButtons}>
                {NAV_BUTTONS.map(btn => (
                    <button
                        key={btn.targetId}
                        className={styles.navBtn}
                        onClick={() => scrollToSection(btn.targetId)}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </section>
    )
}

export default AboutHero