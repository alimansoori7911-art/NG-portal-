import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import DataTable from '../../dashboard/components/DataTable/DataTable'
import { MOCK_ORDERS } from '../data/mockOrders'
import styles from './OrderListPage.module.css'

/* عرض ستون‌ها از SVG (از راست): 335 | 330 | 316 | 267 از ۱۲۴۸
   متن‌ها راست‌چین با padding-right ۹۷ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '26.84%' },
    { key: 'date', label: 'تاریخ', width: '26.44%', ltr: true },
    { key: 'plan', label: 'پلن', width: '25.32%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '21.39%' },
]

export default function OrderListPage() {
    const navigate = useNavigate()

    // TODO: صفحه‌بندی واقعی پس از اتصال به بک‌اند
    const [page, setPage] = useState(1)

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.tableArea}>
                    <DataTable
                        columns={COLUMNS}
                        rows={MOCK_ORDERS}
                        page={page}
                        pageCount={2}
                        onPageChange={setPage}
                        align="right"
                        headerHeight={90}
                        paginationIndent={0}
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