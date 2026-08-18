import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, X } from 'lucide-react'

import Header from '../../../components/layout/Header/Header'
import TicketDetailModal from '../components/TicketDetailModal/TicketDetailModal'
import { useDepartments } from '../hooks/useDepartments'
import { useTickets, TICKETS_PER_PAGE } from '../hooks/useTickets'
import styles from './TicketsPage.module.css'

/**
 * لیست تیکت‌ها.
 *
 * اعداد از SVG فیگما (فریم ۱۴۴۰×۱۰۲۴):
 *   نوار راهنما  x=239.5 y=122.5، ۹۶۱×۷۳، radius 5.5
 *                #000814 + border 1px #7AB0FF | ضربدر ۲۴px در x=1160
 *   کارت جدول    x=95، از y=239 (بالای هدر) تا y=901 → ۱۲۵۰×۶۶۲
 *                radius 31، border 2px #132239
 *   هدر جدول     y 239→313 یعنی ارتفاع ۷۴، fill #0D1726
 *   ردیف         ۶۴px، جداکننده 2px #0D1726
 *   صفحه‌بندی     x=95.5 y=911.5، ۲۵×۲۵، radius 5.5، gap 7 — چسبیده به لبه‌ی چپ
 *   دکمه         x=507 y=927، ۴۲۶×۵۰، radius 11، border 2px #4073BF
 *   دکمه‌ی خرید   x=1230 y=120، ۱۱۴×۵۶، radius 5، #0F2C57
 */

const COLUMNS = [
    { key: 'index', label: 'ردیف' },
    { key: 'date', label: 'تاریخ' },
    { key: 'department', label: 'دپارتمان' },
    { key: 'status', label: 'وضعیت' },
]

function TicketsPage() {
    const navigate = useNavigate()
    const [showHint, setShowHint] = useState(true)
    const [activeTicket, setActiveTicket] = useState(null)

    /* نام دپارتمان از این هوک می‌آید چون خروجی تیکت فقط
       department_id دارد. */
    const { nameOf } = useDepartments()
    const { rows, page, pageCount, loading, error, setPage, reload } =
        useTickets(nameOf)

    const openTicket = (ticket) => setActiveTicket(ticket)

    return (
        <div className={styles.page}>
            <Header />

            {/* نشانگر تزئینی زیر هدر — مطابق فیگما، کلیک‌پذیر نیست */}
            <div className={styles.buyBadge} aria-hidden="true">
                <ShoppingCart size={22} />
                <span>خرید</span>
            </div>

            <main className={styles.main}>
                {showHint && (
                    <div className={styles.hint} role="status">
                        <button
                            type="button"
                            className={styles.hintClose}
                            onClick={() => setShowHint(false)}
                            aria-label="بستن پیام"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                        <span className={styles.hintText}>
                            جهت اطلاع بیشتر از وضعیت تیکت روی آن کلیک کنید
                        </span>
                    </div>
                )}

                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                        <tr className={styles.headRow}>
                            {COLUMNS.map((col) => (
                                <th key={col.key} className={styles.headCell} scope="col">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading && (
                            <tr className={styles.row}>
                                <td className={styles.cell} colSpan={COLUMNS.length}>
                                    در حال دریافت تیکت‌ها…
                                </td>
                            </tr>
                        )}

                        {!loading && error && (
                            <tr className={styles.row}>
                                <td className={styles.cell} colSpan={COLUMNS.length}>
                                    {error}
                                </td>
                            </tr>
                        )}

                        {!loading && !error && rows.length === 0 && (
                            <tr className={styles.row}>
                                <td className={styles.cell} colSpan={COLUMNS.length}>
                                    هنوز تیکتی ثبت نکرده‌اید
                                </td>
                            </tr>
                        )}

                        {!loading && !error && rows.map((ticket) => (
                            <tr
                                key={ticket.id}
                                className={styles.row}
                                tabIndex={0}
                                role="button"
                                onClick={() => openTicket(ticket)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        openTicket(ticket)
                                    }
                                }}
                            >
                                <td className={styles.cell}>{ticket.index}</td>
                                <td className={styles.cell}>{ticket.date}</td>
                                <td className={styles.cell}>{ticket.department}</td>
                                <td className={styles.cell}>{ticket.status}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.footer}>
                    {pageCount > 1 && (
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
                    )}

                    <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => navigate(-1)}
                    >
                        رفتن به صفحه قبل
                    </button>
                </div>
            </main>

            <TicketDetailModal
                ticketId={activeTicket?.id}
                summary={activeTicket}
                open={Boolean(activeTicket)}
                onClose={() => setActiveTicket(null)}
                onClosed={reload}
                onOpenChat={() =>
                    navigate(`/helpdesk/tickets/${activeTicket.id}/chat`)
                }
            />
        </div>
    )
}

export default TicketsPage