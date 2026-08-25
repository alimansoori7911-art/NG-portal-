import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import DataTable from '../../dashboard/components/DataTable/DataTable'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useOrders } from '../hooks/useOrders'
import { orderService } from '../../../services/orderService'
import styles from './OrderListPage.module.css'

/* وضعیت‌هایی که در آن‌ها کاربر باید بتواند پیش‌فاکتور را ببیند و
   رسید بپردازد. طبق فلو، پرداخت از «صدور پیش‌فاکتور» شروع می‌شود و
   تا وقتی فاکتور صادر نشده ادامه دارد. */
const PAYABLE = new Set([
    'QUOTATION_ISSUED',
    'AWAITING_PAYMENT',
    'PAID_CONFIRMED',
])

/* لغو فقط کار کاربر است (رد کردن کار ادمین) و تا قبل از شروع کار فنی
   معنا دارد؛ بعد از آن محصول در حال تحویل است. */
const CANCELABLE = new Set([
    'REQUESTED',
    'AWAITING_ADMIN_REVIEW',
    'QUOTATION_ISSUED',
    'AWAITING_PAYMENT',
])

export default function OrderListPage() {
    const navigate = useNavigate()
    const { rows, page, pageCount, loading, error, setPage, reload } = useOrders()

    const [pendingCancel, setPendingCancel] = useState(null)
    const [canceling, setCanceling] = useState(false)
    const [cancelError, setCancelError] = useState(null)

    const confirmCancel = async () => {
        setCanceling(true)
        setCancelError(null)
        try {
            await orderService.cancelOrder(pendingCancel.id)
            setPendingCancel(null)
            reload()
        } catch (err) {
            setCancelError(err?.message || 'لغو سفارش ناموفق بود')
        } finally {
            setCanceling(false)
        }
    }

    /* ستون عملیات — DataTable کلیک روی ردیف ندارد و چون کامپوننت
       مشترک است تغییرش نمی‌دهیم؛ دکمه‌ی صریح هم برای کاربر روشن‌تر
       است که کجا باید کلیک کند. */
    const COLUMNS = [
        { key: 'index', label: 'ردیف', width: '20%' },
        { key: 'date', label: 'تاریخ', width: '20%', ltr: true },
        { key: 'plan', label: 'پلن', width: '22%', ltr: true },
        { key: 'status', label: 'وضعیت', width: '20%' },
        {
            key: 'action',
            label: '',
            width: '18%',
            render: (row) => (
                <div className={styles.rowActions}>
                    {PAYABLE.has(row.rawStatus) && (
                        <button
                            type="button"
                            className={styles.payBtn}
                            onClick={() =>
                                navigate(`/products/buy/orders/${row.id}/payment`)
                            }
                        >
                            پیش‌فاکتور و پرداخت
                        </button>
                    )}

                    {CANCELABLE.has(row.rawStatus) && (
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => setPendingCancel(row)}
                        >
                            لغو
                        </button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.tableArea}>
                    {(error || cancelError) && (
                        <p className={styles.message} role="alert">
                            {error || cancelError}
                        </p>
                    )}

                    <DataTable
                        columns={COLUMNS}
                        rows={rows}
                        page={page}
                        pageCount={pageCount}
                        onPageChange={setPage}
                        align="right"
                        headerHeight={90}
                        paginationIndent={0}
                        emptyMessage={
                            loading ? 'در حال بارگذاری…' : 'هنوز سفارشی ثبت نکرده‌اید'
                        }
                    />
                </div>

                <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => navigate('/products/buy')}
                >
                    بازگشت صفحه خرید
                </button>
            </main>

            <ConfirmDialog
                open={pendingCancel !== null}
                title="لغو سفارش"
                message={`سفارش ${pendingCancel?.orderNumber ?? ''} لغو می‌شود. برای خرید دوباره باید سفارش جدیدی ثبت کنید. ادامه می‌دهید؟`}
                confirmLabel="لغو سفارش"
                cancelLabel="انصراف"
                onConfirm={confirmCancel}
                onClose={() => !canceling && setPendingCancel(null)}
                loading={canceling}
            />
        </div>
    )
}