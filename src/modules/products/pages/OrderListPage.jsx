import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import DataTable from '../../dashboard/components/DataTable/DataTable'
import { useOrders } from '../hooks/useOrders'
import styles from './OrderListPage.module.css'

/* وضعیت‌هایی که در آن‌ها کاربر باید بتواند پیش‌فاکتور را ببیند و
   رسید بپردازد. طبق فلو، پرداخت از «صدور پیش‌فاکتور» شروع می‌شود و
   تا وقتی فاکتور صادر نشده ادامه دارد. */
const PAYABLE = new Set([
    'QUOTATION_ISSUED',
    'AWAITING_PAYMENT',
    'PAID_CONFIRMED',
])

export default function OrderListPage() {
    const navigate = useNavigate()
    const { rows, page, pageCount, loading, error, setPage } = useOrders()

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
            render: (row) =>
                PAYABLE.has(row.rawStatus) ? (
                    <button
                        type="button"
                        className={styles.payBtn}
                        onClick={() =>
                            navigate(`/products/buy/orders/${row.id}/payment`)
                        }
                    >
                        پیش‌فاکتور و پرداخت
                    </button>
                ) : null,
        },
    ]

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.tableArea}>
                    {error && <p className={styles.message} role="alert">{error}</p>}

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
        </div>
    )
}