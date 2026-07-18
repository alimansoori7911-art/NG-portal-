import styles from './ProductsDetails.module.css'

const SHARED_P1 =
    'بسیاری از سازمان ها بخشی از تجهیزات، سرویس ها، سیستم عامل ها و نرم افزار ها به صورت کامل مستند سازی نشده‌اند، این موضوع باعث ایجاد نقاط کور امنیتی و افزایش ریسک عملیاتی می شود.'
const SHARED_P2 =
    'با ایجاد یک دید متمرکز و به روز از تمامی دارایی های زیر ساخت، پایه تصمیم گیری امنیتی را فراهم می کند.'

const DETAILS = [
    {
        id: 'detail-asset',
        titleFa: 'مدیریت دارایی ها',
        titleEn: 'Asset management',
        subtitle: 'امنیت از شناخت دارایی ها آغاز می شود',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
    {
        id: 'detail-compliance',
        titleFa: 'انطباق امنیتی',
        titleEn: 'Security compliance',
        subtitle: 'آنچه اندازه گیری نمی شود قابل به بهبود نیست',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
    {
        id: 'detail-hardening',
        titleFa: 'مقاوم سازی خودکار',
        titleEn: 'hardening & Remediation',
        subtitle: 'پیدا کردن مشکل کافی نیست، باید آن را اصلاح کنید',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
    {
        id: 'detail-risk',
        titleFa: 'هوشمندی ریسک',
        titleEn: 'Risk intelligence',
        subtitle: 'از داده های امنیتی تا تصمیم گیری هوشمند',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
]

function ProductsDetails() {
    return (
        <div className={styles.wrapper}>
            {DETAILS.map((item) => (
                <section key={item.id} id={item.id} className={styles.section}>
                    <div className={styles.content}>
                        <h3 className={styles.title}>
                            <span className={styles.bullet} />
                            {item.titleFa} <span dir="ltr">({item.titleEn})</span>
                        </h3>
                        <p className={styles.subtitle}>{item.subtitle}</p>
                        {item.paragraphs.map((p, i) => (
                            <p key={i} className={styles.paragraph}>{p}</p>
                        ))}
                    </div>
                    {/* جای تصویر — اگر بعداً آیکون/عکس آماده شد، اینجا اضافه می‌شود */}
                    <div className={styles.imageWrapper} aria-hidden="true" />
                </section>
            ))}
        </div>
    )
}

export default ProductsDetails