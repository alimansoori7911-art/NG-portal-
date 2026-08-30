import { formatToman } from '../../../../utils/currency'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import { PAYMENT_METHODS } from '../../../../services/orderService'
import AttachmentLink from '../../../../components/ui/AttachmentLink/AttachmentLink'
import styles from './PaymentList.module.css'

/**
 * فهرست رسیدهای ثبت‌شده‌ی یک سفارش.
 *
 * چون بک‌اند چند رسید را پشتیبانی می‌کند (payments آرایه است)،
 * کاربر باید ببیند تا حالا چه فرستاده و چقدر مانده.
 *
 * وضعیت هر رسید از `verified_at` می‌آید: پر یعنی ادمین تأیید کرده،
 * تهی یعنی هنوز در انتظار بررسی است.
 *
 * ⚠️ دو مبلغ متفاوت‌اند (اسپک ۱۴): `claimed_amount` چیزی است که کاربر
 * ادعا کرده و `amount` مبلغی که ادمین تأیید کرده. تا وقتی رسید تأیید
 * نشده، مبلغ ادعایی نشان داده می‌شود — نمایش `amount`ِ تأییدنشده به
 * کاربر می‌گوید مبلغی قطعی شده که هنوز نشده.
 */
export default function PaymentList({ payments = [], payableRial, remainingRial }) {
    if (payments.length === 0) return null

    return (
        <section className={styles.box} aria-labelledby="payments-title">
            <h3 className={styles.title} id="payments-title">
                رسیدهای ثبت‌شده
            </h3>

            <ul className={styles.list}>
                {payments.map((p) => {
                    const { date } = formatJalaliDateTime(p.paid_at || p.created_at)
                    const verified = Boolean(p.verified_at)

                    return (
                        <li className={styles.row} key={p.id}>
                            <span className={styles.amount}>
                                {formatToman(
                                    verified ? p.amount : (p.claimed_amount ?? p.amount)
                                )}
                            </span>

                            <span className={styles.meta}>
                                {PAYMENT_METHODS[p.method] ?? p.method}
                                {date && ` · ${date}`}
                            </span>

                            {(p.attachments ?? []).map((a) => (
                                <AttachmentLink key={a.id} attachment={a} />
                            ))}

                            <span
                                className={`${styles.status} ${
                                    verified ? styles.verified : styles.pending
                                }`}
                            >
                                {verified ? '✓ تأیید شد' : '⏳ در انتظار بررسی'}
                            </span>
                        </li>
                    )
                })}
            </ul>

            {/* جمع‌بندی — فقط رسیدهای تأییدشده از باقی‌مانده کم شده‌اند */}
            <div className={styles.summary}>
                <span>
                    مبلغ کل:{' '}
                    <b className={styles.strong}>{formatToman(payableRial)}</b>
                </span>
                <span>
                    باقی‌مانده:{' '}
                    <b className={styles.strong}>{formatToman(remainingRial)}</b>
                </span>
            </div>
        </section>
    )
}
