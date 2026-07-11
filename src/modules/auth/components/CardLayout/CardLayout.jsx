import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/Button/Button";
import styles from "./CardLayout.module.css";
import logo from "../../../../assets/images/logo/logowhite.png";

/**
 * کارت تکی وسط صفحه برای مراحل ثبت‌نام و بازیابی رمز.
 *  wide: حالت عریض (فرم ثبت اطلاعات)
 *  showLogo: لوگو + خط جداکننده بالای کارت
 *  onBack: رفتار دکمه‌ی برگشت؛ null یعنی دکمه حذف شود
 */
export default function CardLayout({ wide = false, showLogo = false, onBack, children }) {
    const navigate = useNavigate();
    const showBack = onBack !== null;

    return (
        <main className={styles.page}>
            <section className={`${styles.card} ${wide ? styles.wide : ""}`}>
                {showLogo && (
                    <header className={styles.logoHeader}>
                        <img src={logo} alt="NG Corion" className={styles.logo} />
                    </header>
                )}

                {showBack && (
                    <Button
                        variant="ghost"
                        className={styles.back}
                        onClick={onBack ?? (() => navigate("/"))}
                    >
                        برگشت
                    </Button>
                )}

                <div className={styles.content}>{children}</div>
            </section>
        </main>
    );
}