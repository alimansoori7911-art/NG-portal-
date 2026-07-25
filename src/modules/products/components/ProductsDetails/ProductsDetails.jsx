import styles from './ProductsDetails.module.css'
import assetImg from '../../../../assets/images/products/asset.png'
import complianceImg from '../../../../assets/images/products/compliance.png'
import hardeningImg from '../../../../assets/images/products/hardening.png'
import riskImg from '../../../../assets/images/products/risk.png'

const SHARED_P1 =
    'بسیاری از سازمان ها بخشی از تجهیزات، سرویس ها، سیستم عامل ها و نرم افزار ها به صورت کامل مستند سازی نشده‌اند، این موضوع باعث ایجاد نقاط کور امنیتی و افزایش ریسک عملیاتی می شود.'
const SHARED_P2 =
    'با ایجاد یک دید متمرکز و به روز از تمامی دارایی های زیر ساخت، پایه تصمیم گیری امنیتی را فراهم می کند.'

const DETAILS = [
    {
        id: 'detail-asset',
        image: assetImg,
        titleFa: 'مدیریت دارایی ها',
        titleEn: 'Asset management',
        subtitle: 'امنیت از شناخت دارایی ها آغاز می شود',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
    {
        id: 'detail-compliance',
        image: complianceImg,
        titleFa: 'انطباق امنیتی',
        titleEn: 'Security compliance',
        subtitle: 'آنچه اندازه گیری نمی شود قابل به بهبود نیست',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
    {
        id: 'detail-hardening',
        image: hardeningImg,
        titleFa: 'مقاوم سازی خودکار',
        titleEn: 'hardening & Remediation',
        subtitle: 'پیدا کردن مشکل کافی نیست، باید آن را اصلاح کنید',
        paragraphs: [SHARED_P1, SHARED_P2],
    },
    {
        id: 'detail-risk',
        image: riskImg,
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

                    {/* عکس — سمت چپ (در RTL flex-direction: row یعنی چپ) */}
                    <div className={styles.imageWrapper}>
                        <img src={item.image} alt={item.titleFa} className={styles.image} />
                    </div>

                    {/* محتوا — سمت راست */}
                    <div className={styles.content}>
                        <h3 className={styles.title}>
                            <span className={styles.bullet} />
                            {item.titleFa}
                            {' '}
                            <span dir="ltr">({item.titleEn})</span>
                        </h3>
                        <p className={styles.subtitle}>{item.subtitle}</p>
                        {item.paragraphs.map((p, i) => (
                            <p key={i} className={styles.paragraph}>{p}</p>
                        ))}
                    </div>

                </section>
            ))}
        </div>
    )
}

export default ProductsDetails