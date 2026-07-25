import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

import Header from '../../../components/layout/Header/Header'
import Button from '../../../components/ui/Button/Button'
import { MOCK_TICKETS } from '../data/mockTickets'
import styles from './TicketsPage.module.css'

const PAGE_SIZE = 9

function TicketsPage() {
    const navigate = useNavigate()
    const [showHint, setShowHint] = useState(true)
    const [page, setPage] = useState(1)

    // TODO: با اتصال بک‌اند، صفحه‌بندی به سمت سرور منتقل می‌شود
    const tickets = MOCK_TICKETS
    const pageCount = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE))

    const rows = useMemo(
        () => tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [tickets, page]
    )

    // TODO: مسیر صفحه‌ی جزئیات تیکت بعداً مشخص می‌شود
    const openTicket = (id) => {
        console.log('open ticket:', id)
    }

    return (
        <>
            <Header />

            <main className={styles.page}>
                {showHint && (
                    <div className={styles.hint} role="status">
                        <span className={styles.hintText}>
                            جهت اطلاع بیشتر از وضعیت تیکت روی آن کلیک کنید
                        </span>
                        <button
                            type="button"
                            className={styles.hintClose}
                            onClick={() => setShowHint(false)}
                            aria-label="بستن پیام"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                )}

                <div className={styles.card}>
                    <div className={styles.tableScroll}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th scope="col">ردیف</th>
                                <th scope="col">تاریخ</th>
                                <th scope="col">دپارتمان</th>
                                <th scope="col">وضعیت</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((ticket, index) => (
                                <tr
                                    key={ticket.id}
                                    className={styles.row}
                                    tabIndex={0}
                                    role="button"
                                    onClick={() => openTicket(ticket.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            openTicket(ticket.id)
                                        }
                                    }}
                                >
                                    <td data-label="ردیف">
                                        {(page - 1) * PAGE_SIZE + index + 1}
                                    </td>
                                    <td data-label="تاریخ">{ticket.date}</td>
                                    <td data-label="دپارتمان">{ticket.department}</td>
                                    <td data-label="وضعیت">{ticket.status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.footer}>
                    <nav className={styles.pagination} aria-label="صفحه‌بندی">
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                            <button
                                key={n}
                                type="button"
                                className={`${styles.pageBtn} ${n === page ? styles.pageActive : ''}`}
                                onClick={() => setPage(n)}
                                aria-current={n === page ? 'page' : undefined}
                            >
                                {n}
                            </button>
                        ))}
                    </nav>

                    <div className={styles.backWrapper}>
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            رفتن به صفحه قبل
                        </Button>
                    </div>
                </div>
            </main>
        </>
    )
}

export default TicketsPage