import DataTable from '../../components/DataTable/DataTable'
import { useMyPayments } from '../hooks/useMyPayments'
import styles from './PaymentsPage.module.css'

/* عرض ستون‌ها متناسب با محتوا — فیگمایی برای این صفحه نرسیده بود. */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '8%' },
    { key: 'orderNumber', label: 'شماره سفارش', width: '18%', ltr: true },
    { key: 'amount', label: 'مبلغ', width: '18%', ltr: true },
    { key: 'method', label: 'روش', width: '14%' },
    { key: 'tracking', label: 'شماره پیگیری', width: '18%', ltr: true },
    {
        key: 'statusLabel',
        label: 'وضعیت',
        width: '12%',
        render: (row) => (
            <span
                className={`${styles.badge} ${
                    row.verified ? styles.badgeOk : styles.badgeWait
                }`}
            >
                {row.statusLabel}
            </span>
        ),
    },
    { key: 'date', label: 'تاریخ', width: '12%', ltr: true },
]

/**
 * تاریخچه‌ی پرداخت‌های کاربر.
 *
 * وصل به `GET /orders/payments` که همه‌ی رسیدهای کاربر را **تخت**
 * می‌دهد — برخلاف مسیر ادمین که هر سفارش را با رسیدهای تودرتویش
 * برمی‌گرداند.
 *
 * تا پیش از این، کاربر رسیدهایش را فقط داخل صفحه‌ی همان سفارش
 * می‌دید و هیچ نمای یکجایی نداشت.
 */
export default function PaymentsPage() {
    const { rows, page, pageCount, loading, error, setPage } = useMyPayments()

    return (
        <div className={styles.page}>
            <p className={styles.intro}>
                همه‌ی رسیدهایی که ثبت کرده‌اید. رسید «در انتظار بررسی» یعنی
                هنوز توسط تیم مالی تأیید نشده است.
            </p>

            {error && (
                <p className={styles.state} role="alert">
                    {error}
                </p>
            )}

            <DataTable
                columns={COLUMNS}
                rows={rows}
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                emptyMessage={
                    loading ? 'در حال دریافت…' : 'پرداختی ثبت نشده است'
                }
            />
        </div>
    )
}
