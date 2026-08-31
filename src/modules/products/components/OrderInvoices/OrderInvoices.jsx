import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { invoiceService } from '../../../../services/invoiceService'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import styles from './OrderInvoices.module.css'

/**
 * فاکتورهای یک سفارش — `GET /orders/{id}/invoices` (اسپک ۱۵).
 *
 * فلو می‌گوید کاربر بعد از تأیید پرداخت فاکتورش را می‌گیرد
 * (`a_invoice -> c_invoice`)، ولی تا اسپک ۱۵ راهی نبود از سفارش به
 * فاکتورش رسید.
 *
 * ⚠️ اسپک خروجی را «اقلام فاکتور» تایپ کرده نه خود فاکتور، پس ممکن
 * است `invoice_number` و `pdf_file_id` نداشته باشد. کد هر دو حالت را
 * تحمل می‌کند: اگر شماره‌ی فاکتور بود لینک دانلود می‌سازد، وگرنه فقط
 * عنوان قلم را نشان می‌دهد.
 */
export default function OrderInvoices({ orderId }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [opening, setOpening] = useState(null)

    useEffect(() => {
        if (!orderId) return
        let cancelled = false

        invoiceService
            .getOrderInvoices(orderId)
            .then((data) => {
                if (!cancelled) setItems(data ?? [])
            })
            .catch((err) => {
                /* نبودِ فاکتور خطا نیست — سفارشی که هنوز پرداخت نشده
                   طبیعتاً فاکتور ندارد. فقط خطای واقعی نشان داده شود. */
                if (!cancelled && err?.status !== 404) {
                    setError(err?.message || 'دریافت فاکتور ناموفق بود')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [orderId])

    /* همان الگوی صفحه‌ی فاکتورها: تب قبل از درخواست باز می‌شود تا
       پاپ‌آپ‌بلاکر جلویش را نگیرد. */
    const openPdf = async (invoice) => {
        if (!invoice.pdf_file_id || opening) return
        setOpening(invoice.id)

        const tab = window.open('', '_blank', 'noopener,noreferrer')
        try {
            const url = await invoiceService.getPdfUrl(invoice.pdf_file_id)
            if (!url) throw new Error('لینک دانلود دریافت نشد')
            /* assign به‌جای انتساب به href — نتیجه یکی است ولی قاعده‌ی
               immutability لینتر انتساب را تغییر مقدار می‌بیند. */
            if (tab) tab.location.assign(url)
            else window.location.assign(url)
        } catch (err) {
            tab?.close()
            setError(err?.message || 'باز کردن فاکتور ناموفق بود')
        } finally {
            setOpening(null)
        }
    }

    if (loading || (items.length === 0 && !error)) return null

    return (
        <section className={styles.box}>
            <h3 className={styles.title}>
                <FileText size={16} className={styles.icon} />
                فاکتور این سفارش
            </h3>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <ul className={styles.list}>
                {items.map((inv) => {
                    const { date } = formatJalaliDateTime(inv.issued_at)
                    const label =
                        inv.invoice_number || inv.title_snapshot || 'فاکتور'

                    return (
                        <li key={inv.id} className={styles.row}>
                            <span className={styles.name} dir="ltr">
                                {label}
                            </span>

                            {date && <span className={styles.date}>{date}</span>}

                            {inv.pdf_file_id && (
                                <button
                                    type="button"
                                    className={styles.viewBtn}
                                    onClick={() => openPdf(inv)}
                                    disabled={opening === inv.id}
                                >
                                    {opening === inv.id ? '…' : 'مشاهده PDF'}
                                </button>
                            )}
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
