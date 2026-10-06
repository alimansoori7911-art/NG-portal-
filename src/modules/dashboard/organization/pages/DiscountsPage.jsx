import { useState } from 'react'
import { Copy, Check, TicketPercent } from 'lucide-react'
import { useMyDiscounts } from '../hooks/useMyDiscounts'
import styles from './DiscountsPage.module.css'

/**
 * کدهای تخفیف در دسترس کاربر.
 *
 * وصل به `GET /user/discount/` که فقط کدهای **قابل استفاده** را
 * می‌دهد: باطل‌نشده و منقضی‌نشده. پس اینجا وضعیت «منقضی» یا «باطل»
 * نداریم — اگر کدی در فهرست هست یعنی همین حالا کار می‌کند.
 *
 * کارت به‌جای جدول، چون مهم‌ترین کارِ کاربر **کپی کردن کد** است و در
 * جدول آن دکمه گم می‌شود.
 */
export default function DiscountsPage() {
    const { items, error, loading } = useMyDiscounts()
    /* کدی که همین الان کپی شد — برای بازخورد لحظه‌ای */
    const [copied, setCopied] = useState(null)

    const copy = async (code) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(code)
            setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000)
        } catch {
            /* کلیپ‌بورد در http یا بدون اجازه کار نمی‌کند؛ کد روی کارت
               دیده می‌شود و کاربر می‌تواند دستی انتخابش کند. */
        }
    }

    return (
        <div className={styles.page}>
            <p className={styles.intro}>
                کدهای زیر همین حالا قابل استفاده‌اند. موقع ثبت سفارش، کد را
                در فیلد «کد تخفیف» وارد کنید.
            </p>

            {loading ? (
                <p className={styles.state}>در حال دریافت…</p>
            ) : error ? (
                <p className={styles.state} role="alert">
                    {error}
                </p>
            ) : items.length === 0 ? (
                <div className={styles.empty}>
                    <TicketPercent size={32} aria-hidden="true" />
                    <p className={styles.emptyTitle}>کد تخفیفی ندارید</p>
                    <p className={styles.emptyText}>
                        اگر کد تخفیفی برایتان صادر شود، همین‌جا نمایش داده
                        می‌شود.
                    </p>
                </div>
            ) : (
                <ul className={styles.grid}>
                    {items.map((d) => (
                        <li key={d.id} className={styles.card}>
                            <div className={styles.head}>
                                <span className={styles.value}>{d.valueLabel}</span>
                                <span className={styles.type}>{d.typeLabel}</span>
                            </div>

                            <button
                                type="button"
                                className={styles.codeBtn}
                                onClick={() => copy(d.code)}
                                title="کپی کد"
                            >
                                <span className={styles.code} dir="ltr">
                                    {d.code}
                                </span>
                                {copied === d.code ? (
                                    <Check size={15} aria-hidden="true" />
                                ) : (
                                    <Copy size={15} aria-hidden="true" />
                                )}
                            </button>

                            {copied === d.code && (
                                <span className={styles.copied} role="status">
                                    کپی شد
                                </span>
                            )}

                            <dl className={styles.meta}>
                                <div className={styles.metaRow}>
                                    <dt>معتبر تا</dt>
                                    <dd dir="ltr">{d.validUntilLabel}</dd>
                                </div>
                                <div className={styles.metaRow}>
                                    <dt>دفعات باقی‌مانده</dt>
                                    <dd>{d.remainingLabel}</dd>
                                </div>
                            </dl>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
