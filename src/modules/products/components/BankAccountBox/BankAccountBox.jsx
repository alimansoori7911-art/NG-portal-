import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import {
    BANK_ACCOUNT,
    formatCard,
    formatIban,
} from '../../../../constants/bankAccount'
import styles from './BankAccountBox.module.css'

/**
 * اطلاعات حساب جهت واریز.
 *
 * چون پرداخت آنلاین نداریم، کاربر باید بداند به کجا واریز کند.
 * دکمه‌ی کپی ضروری است: کسی ۲۶ رقم شبا را دستی تایپ نمی‌کند و
 * اشتباه تایپ یعنی پول به حساب اشتباه.
 */
export default function BankAccountBox() {
    /* کدام ردیف همین الان کپی شد — برای بازخورد کوتاه روی همان دکمه */
    const [copied, setCopied] = useState(null)

    const copy = async (key, value) => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(key)
            setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800)
        } catch {
            /* اگر مرورگر اجازه نداد، مقدار روی صفحه هست و کاربر
               می‌تواند دستی انتخاب کند. خطا نشان نمی‌دهیم. */
        }
    }

    /* مقدار خام کپی می‌شود نه نسخه‌ی فاصله‌دار — چون فرم بانک
       فاصله را قبول نمی‌کند. */
    const rows = [
        { key: 'bank', label: 'بانک', text: BANK_ACCOUNT.bankName },
        {
            key: 'iban',
            label: 'شماره شبا',
            text: formatIban(BANK_ACCOUNT.iban),
            copyValue: BANK_ACCOUNT.iban,
            ltr: true,
        },
        {
            key: 'card',
            label: 'شماره کارت',
            text: formatCard(BANK_ACCOUNT.cardNumber),
            copyValue: BANK_ACCOUNT.cardNumber,
            ltr: true,
        },
        { key: 'holder', label: 'به نام', text: BANK_ACCOUNT.accountHolder },
    ]

    return (
        <section className={styles.box} aria-labelledby="bank-title">
            <h3 className={styles.title} id="bank-title">
                اطلاعات حساب جهت واریز
            </h3>

            <dl className={styles.list}>
                {rows.map(({ key, label, text, copyValue, ltr }) => (
                    <div className={styles.row} key={key}>
                        <dt className={styles.label}>{label}</dt>
                        <dd className={styles.value}>
                            <span
                                className={styles.text}
                                dir={ltr ? 'ltr' : undefined}
                            >
                                {text}
                            </span>

                            {copyValue && (
                                <button
                                    type="button"
                                    className={styles.copyBtn}
                                    onClick={() => copy(key, copyValue)}
                                    aria-label={`کپی ${label}`}
                                >
                                    {copied === key ? (
                                        <>
                                            <Check size={14} />
                                            کپی شد
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            کپی
                                        </>
                                    )}
                                </button>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
