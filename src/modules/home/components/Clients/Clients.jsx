import { useCmsContent } from '../../../../hooks/useCmsContent'
import { useFileUrl } from '../../../../hooks/useFileUrl'
import styles from './Clients.module.css'
import clientsImage from '../../../../assets/images/logo/sec6.png'

/**
 * نوار لوگوی مشتریان — بلوک `clients` از صفحه‌ی `home`.
 *
 * صفحه‌ی اصلی `cms` خودش را پاس می‌دهد. صفحه‌های دیگری که همین
 * نوار را نشان می‌دهند (خدمات، منابع، قوانین) آن را ندارند، پس اینجا
 * خودمان `home` را می‌خوانیم تا تصویر همه‌جا یکی باشد؛ با `cms`
 * پاس‌داده‌شده درخواست دوم زده نمی‌شود.
 */
function Clients({ cms }) {
    const own = useCmsContent(cms ? null : 'home')
    const source = cms ?? own

    const { image_url, alt } = source?.fields?.('clients', {
        image_url: clientsImage,
        alt: 'مشتریان ما',
    }) ?? { image_url: clientsImage, alt: 'مشتریان ما' }

    /* نشانی CMS ممکن است `/dl/{file_id}` باشد. تا لینکش برسد چیزی
       نشان داده نمی‌شود (نه لوگوی قدیمی که ناگهان عوض شود) و اگر نرسید
       همان تصویر پیش‌فرض می‌آید. */
    const image = useFileUrl(image_url)
    const src = image.failed ? clientsImage : image.url

    return (
        <section className={styles.section}>

            <div className={styles.logosWrapper}>
                {src && <img src={src} alt={alt} className={styles.clientsImg} />}
            </div>
        </section>
    )
}

export default Clients
