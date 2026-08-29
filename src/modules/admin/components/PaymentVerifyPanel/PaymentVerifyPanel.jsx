import { formatToman } from '../../../../utils/currency'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import { PAYMENT_METHODS } from '../../../../services/orderService'
import styles from './PaymentVerifyPanel.module.css'

/**
 * رسیدهای یک سفارش با امکان تأیید.
 *
 * هر رسید جداگانه تأیید می‌شود چون بک‌اند هم همین‌طور مدل کرده
 * (`verify` شناسه‌ی پرداخت می‌گیرد نه سفارش). دلیلش این است که کاربر
 * ممکن است مبلغ را چند تکه واریز کند.
 *
 * شماره‌ی پیگیری برجسته نشان داده می‌شود چون تنها چیزی است که ادمین
 * با آن می‌تواند واریز را در صورت‌حساب بانک پیدا کند.
 *
 * ⚠️ مبلغ رسیدِ تأییدنشده «ادعای کاربر» است (`claimed_amount`) نه مبلغ
 * قطعی؛ برچسب «ادعایی» می‌گیرد تا ادمین آن را با واریز واقعی مقایسه
 * کند و اشتباهی به‌عنوان مبلغ تأییدشده نخواند.
 */
export default function PaymentVerifyPanel({ payments = [], busy, onVerify }) {
    if (payments.length === 0) {
        return (
            <p className={styles.empty}>
                هنوز رسیدی برای این سفارش ثبت نشده است.
            </p>
        )
    }

    return (
        <ul className={styles.list}>
            {payments.map((p) => {
                const { date, time } = formatJalaliDateTime(p.paid_at || p.created_at)
                const verified = Boolean(p.verified_at)

                return (
                    <li className={styles.row} key={p.id}>
                        <div className={styles.main}>
                            <span className={styles.amount}>
                                {formatToman(
                                    verified ? p.amount : (p.claimed_amount ?? p.amount)
                                )}
                                {!verified && (
                                    <span className={styles.claimed}> (ادعایی)</span>
                                )}
                            </span>
                            <span className={styles.meta}>
                                {PAYMENT_METHODS[p.method] ?? p.method}
                                {date && ` · ${date} ${time}`}
                                {p.payer_name && ` · ${p.payer_name}`}
                                {p.bank_name && ` · ${p.bank_name}`}
                            </span>
                        </div>

                        {p.tracking_number && (
                            <span className={styles.tracking} dir="ltr">
                                {p.tracking_number}
                            </span>
                        )}

                        {verified ? (
                            <span className={styles.verified}>✓ تأیید شده</span>
                        ) : (
                            <button
                                type="button"
                                className={styles.verifyBtn}
                                onClick={() => onVerify(p.id)}
                                disabled={busy}
                            >
                                {busy ? '…' : 'تأیید رسید'}
                            </button>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
