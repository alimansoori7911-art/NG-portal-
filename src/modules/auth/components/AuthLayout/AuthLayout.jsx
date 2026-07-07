import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/Button/Button";
import styles from "./AuthLayout.module.css";
import banner from "../../../../assets/images/backgrounds/auth-banner.png";
import logo from "../../../../assets/images/logo/logowhite.png";

export default function AuthLayout({ children }) {
    const navigate = useNavigate();

    return (
        <main className={styles.page}>
            <section
                className={styles.banner}
                style={{ backgroundImage: `url(${banner})` }}
                aria-hidden="true"
            >
                <img src={logo} alt="" className={styles.logo} />
            </section>

            <section className={styles.card}>
                <Button
                    variant="ghost"
                    className={styles.back}
                    onClick={() => navigate("/")}
                >
                    برگشت
                </Button>
                <div className={styles.content}>{children}</div>
            </section>
        </main>
    );
}