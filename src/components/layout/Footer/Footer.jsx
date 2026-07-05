import styles from './Footer.module.css'
import logo from '../../../assets/images/logo/logowhite.png'
import { Mail, Phone, Send } from 'lucide-react'

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>

                {/* ستون راست — لوگو + توضیحات + اطلاعات تماس */}
                <div className={styles.col}>
                    <img src={logo} alt="NGcorion" className={styles.logo} />
                    <p className={styles.description}>
                        لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
                        استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در
                        ستون و سطرآنچنان موجود در ارائه راهکارها، و شرایط سخت تایپ به پایان
                        سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.
                    </p>
                    <div className={styles.contactItems}>
                        <div className={styles.contactItem}>
                            <div className={styles.contactInfo}>
                                <span className={styles.contactLabel}>آدرس ایمیل</span>
                                <span className={styles.contactValue}>www.ng.com</span>
                            </div>
                            <div className={styles.contactIconBox}>
                                <Mail size={18} />
                            </div>
                        </div>
                        <div className={styles.contactItem}>
                            <div className={styles.contactInfo}>
                                <span className={styles.contactLabel}>شماره تماس</span>
                                <span className={styles.contactValue}>09141234567</span>
                            </div>
                            <div className={styles.contactIconBox}>
                                <Phone size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ستون وسط — لینک‌های سریع */}
                <div className={styles.col}>
                    <h4 className={`${styles.colTitle} ${styles.withBorder}`}>لینک های سریع</h4>                    <ul className={styles.linkList}>
                        <li><button className={styles.link}>تماس با ما</button></li>
                        <li><button className={styles.link}>درباره ما</button></li>
                        <li><button className={styles.link}>سوالات متداول</button></li>
                    </ul>
                </div>

                {/* ستون چپ — خبرنامه + شبکه‌های اجتماعی */}
                <div className={styles.col}>
                    <h4 className={styles.colTitle}>عضویت در خبرنامه</h4>
                    <div className={styles.newsletter}>
                        <input
                            type="email"
                            placeholder="آدرس ایمیل خود را وارد کنید"
                            className={styles.input}
                        />
                        <button className={styles.inputBtn}>
                            <Send size={16} />
                        </button>
                    </div>
                    <div className={styles.socialWrapper}>
                        <span className={styles.socialLabel}>ما را در شبکه های اجتماعی دنبال کنید</span>
                        <div className={styles.socialIcons}>
                            <button className={styles.socialBtn} aria-label="اینستاگرام">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                    <circle cx="12" cy="12" r="4"/>
                                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                                </svg>
                            </button>
                            <button className={styles.socialBtn} aria-label="واتساپ">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                            </button>
                            <button className={styles.socialBtn} aria-label="تلگرام">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    )
}

export default Footer