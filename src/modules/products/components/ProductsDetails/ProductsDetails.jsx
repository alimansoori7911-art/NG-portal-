import { productAnchor } from '../../utils/productAnchor'
import { richTextToParagraphs } from '../../../../utils/richText'
import styles from './ProductsDetails.module.css'
import assetImg from '../../../../assets/images/products/asset.png'
import complianceImg from '../../../../assets/images/products/compliance.png'
import hardeningImg from '../../../../assets/images/products/hardening.png'
import riskImg from '../../../../assets/images/products/risk.png'

const SHARED_P1 =
    'بسیاری از سازمان ها بخشی از تجهیزات، سرویس ها، سیستم عامل ها و نرم افزار ها به صورت کامل مستند سازی نشده‌اند، این موضوع باعث ایجاد نقاط کور امنیتی و افزایش ریسک عملیاتی می شود.'
const SHARED_P2 =
    'با ایجاد یک دید متمرکز و به روز از تمامی دارایی های زیر ساخت، پایه تصمیم گیری امنیتی را فراهم می کند.'

/* شکل همان آیتم `details` در CMS است (`title_fa`, `title_en`,
   `subtitle`, `body`, `image_url`)، فقط تصویرش فایل محلی است. */
const DETAILS = [
    {
        image_url: assetImg,
        title_fa: 'مدیریت دارایی ها',
        title_en: 'Asset management',
        subtitle: 'امنیت از شناخت دارایی ها آغاز می شود',
        body: `<p>${SHARED_P1}</p><p>${SHARED_P2}</p>`,
    },
    {
        image_url: complianceImg,
        title_fa: 'انطباق امنیتی',
        title_en: 'Security compliance',
        subtitle: 'آنچه اندازه گیری نمی شود قابل به بهبود نیست',
        body: `<p>${SHARED_P1}</p><p>${SHARED_P2}</p>`,
    },
    {
        image_url: hardeningImg,
        title_fa: 'مقاوم سازی خودکار',
        title_en: 'hardening & Remediation',
        subtitle: 'پیدا کردن مشکل کافی نیست، باید آن را اصلاح کنید',
        body: `<p>${SHARED_P1}</p><p>${SHARED_P2}</p>`,
    },
    {
        image_url: riskImg,
        title_fa: 'هوشمندی ریسک',
        title_en: 'Risk intelligence',
        subtitle: 'از داده های امنیتی تا تصمیم گیری هوشمند',
        body: `<p>${SHARED_P1}</p><p>${SHARED_P2}</p>`,
    },
]

/* `image_url` در CMS اختیاری است؛ نبودش یعنی تصویر محلیِ همان
   محصول (از روی لنگر)، وگرنه تصویر همان ردیف. */
const imageFor = (item, i) =>
    item.image_url ||
    DETAILS.find((d) => productAnchor(d) === productAnchor(item))?.image_url ||
    DETAILS[i]?.image_url

function ProductsDetails({ cms }) {
    const details = cms?.items?.('details', DETAILS) ?? DETAILS

    return (
        <div className={styles.wrapper}>
            {details.map((item, i) => {
                const image = imageFor(item, i)
                /* `body` متن غنی است و چند پاراگراف دارد؛ هر پاراگراف
                   با کلاس خودش رندر می‌شود، نه HTML خام. */
                const paragraphs = richTextToParagraphs(item.body)

                return (
                    <section
                        key={`${item.title_fa}-${i}`}
                        id={productAnchor(item)}
                        className={styles.section}
                    >

                        {/* عکس — سمت چپ (در RTL flex-direction: row یعنی چپ) */}
                        {image && (
                            <div className={styles.imageWrapper}>
                                <img src={image} alt={item.title_fa} className={styles.image} />
                            </div>
                        )}

                        {/* محتوا — سمت راست */}
                        <div className={styles.content}>
                            <h3 className={styles.title}>
                                <span className={styles.bullet} />
                                {item.title_fa}
                                {item.title_en && (
                                    <>
                                        {' '}
                                        <span dir="ltr">({item.title_en})</span>
                                    </>
                                )}
                            </h3>
                            {item.subtitle && (
                                <p className={styles.subtitle}>{item.subtitle}</p>
                            )}
                            {paragraphs.map((p, j) => (
                                <p key={j} className={styles.paragraph}>{p}</p>
                            ))}
                        </div>

                    </section>
                )
            })}
        </div>
    )
}

export default ProductsDetails
