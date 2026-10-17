import { useState } from 'react'
import NamedIcon from '../../../../components/ui/icons/NamedIcon'
import { blockName, fieldLabel } from '../../constants/cmsLabels'
import styles from './CmsBlocksView.module.css'

/* فیلدهایی که متن غنی (HTML) دارند — در پیش‌نمایش رندر می‌شوند، نه
   این‌که تگ‌هایشان (`<p>…</p>`) به‌صورت متن دیده شود. */
const looksLikeHtml = (v) => /<[a-z][\s\S]*>/i.test(v)
const isImageField = (name) => name === 'image_url' || name === 'icon_url'

/* تصویری که باز نشود جای خالی می‌گذاشت؛ حالا نشانی‌اش با هشدار
   دیده می‌شود تا ادمین بفهمد لینک خراب است. */
function Image({ src }) {
    const [failed, setFailed] = useState(false)
    return failed ? (
        <span className={styles.broken}>
            تصویر باز نشد: <span dir="ltr">{src}</span>
        </span>
    ) : (
        <img src={src} alt="" className={styles.image} onError={() => setFailed(true)} />
    )
}

function Value({ name, value }) {
    const v = typeof value === 'string' ? value : JSON.stringify(value)
    if (!String(v ?? '').trim()) return <span className={styles.empty}>— خالی —</span>

    if (name === 'icon') {
        return (
            <span className={styles.icon}>
                <NamedIcon name={v} size={18} aria-hidden="true" />
                <span dir="ltr">{v}</span>
            </span>
        )
    }
    if (isImageField(name) && /^(https?:\/\/|\/)/i.test(v)) {
        return <Image key={v} src={v} />
    }
    if (looksLikeHtml(v)) {
        /* HTML نوشته‌ی خود ادمین است؛ پاک‌سازی سمت سرور. */
        return <div className={styles.html} dangerouslySetInnerHTML={{ __html: v }} />
    }
    return <span className={styles.text}>{v}</span>
}

function Fields({ fields, blockType }) {
    const entries = Object.entries(fields ?? {})
    if (entries.length === 0) return null
    return (
        <dl className={styles.fields}>
            {entries.map(([k, v]) => (
                <div key={k} className={styles.row}>
                    <dt className={styles.key}>{fieldLabel(k, blockType)}</dt>
                    <dd className={styles.value}>
                        <Value name={k} value={v} />
                    </dd>
                </div>
            ))}
        </dl>
    )
}

/**
 * محتوای بلوک‌های یک صفحه‌ی ساختاریافته، خوانا برای ادمین.
 *
 * قبلاً پیش‌نمایش کلیدهای انگلیسی خام و HTML را به‌صورت متن نشان
 * می‌داد و **ردیف‌های کارت (`items`) را اصلاً نشان نمی‌داد** — یعنی
 * مهم‌ترین بخش صفحه‌هایی مثل خدمات در پیش‌نمایش خالی بود.
 *
 * چیدمان واقعی سایت را بازسازی نمی‌کند (آن سمت سایت عمومی است)؛
 * فقط محتوا را مرتب و فارسی نشان می‌دهد.
 */
export default function CmsBlocksView({ blocks }) {
    return (
        <div className={styles.blocks}>
            {blocks.map((b) => {
                const items = (b.items ?? []).map((it) => it?.fields ?? it)
                return (
                    <section key={b.key} className={styles.block}>
                        <h3 className={styles.blockTitle}>
                            {b.title || blockName(b.key)}
                        </h3>

                        <Fields fields={b.fields} blockType={b.type} />

                        {items.length > 0 && (
                            <ol className={styles.items}>
                                {items.map((it, i) => (
                                    <li key={i} className={styles.item}>
                                        <span className={styles.itemIndex}>
                                            ردیف {(i + 1).toLocaleString('fa-IR')}
                                        </span>
                                        <Fields fields={it} blockType={b.type} />
                                    </li>
                                ))}
                            </ol>
                        )}

                        {b.type === 'CARD_LIST' && items.length === 0 && (
                            <p className={styles.note}>
                                ردیفی ثبت نشده؛ روی سایت ردیف‌های پیش‌فرض نمایش داده
                                می‌شوند.
                            </p>
                        )}
                    </section>
                )
            })}
        </div>
    )
}
