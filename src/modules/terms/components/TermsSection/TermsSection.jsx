import styles from './TermsSection.module.css'

/**
 * یک بند از سند حقوقی — باکس شماره + متن.
 *
 * ساختار محتوا انعطاف دارد چون بندها یک‌شکل نیستند:
 * `body` پاراگراف‌ها، `definitions` فهرست «اصطلاح: توضیح» (بند
 * تعاریف)، `items` فهرست گلوله‌ای، و `footer` پاراگراف پایانی بعد از
 * فهرست. هر کدام نبود، رندر نمی‌شود.
 */
export default function TermsSection({ section }) {
    const { id, num, title, body, definitions, items, footer } = section

    return (
        <article id={id} className={styles.card}>
            <span className={styles.num} aria-hidden="true">
                {num}
            </span>

            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>

                {body?.map((paragraph, i) => (
                    <p key={i} className={styles.paragraph}>
                        {paragraph}
                    </p>
                ))}

                {definitions && (
                    <dl className={styles.definitions}>
                        {definitions.map((d) => (
                            <div key={d.term} className={styles.definition}>
                                <dt className={styles.term}>{d.term}</dt>
                                <dd className={styles.desc}>{d.desc}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                {items && (
                    <ul className={styles.list}>
                        {items.map((item, i) => (
                            <li key={i} className={styles.listItem}>
                                {item}
                            </li>
                        ))}
                    </ul>
                )}

                {footer?.map((paragraph, i) => (
                    <p key={i} className={styles.paragraph}>
                        {paragraph}
                    </p>
                ))}
            </div>
        </article>
    )
}
