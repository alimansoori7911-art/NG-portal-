import { useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import TicketChatModal from '../components/TicketChatModal/TicketChatModal'
import { useDepartments } from '../../helpdesk/hooks/useDepartments'
import { useAdminTickets } from '../hooks/useAdminTickets'
import { useAdminTicketChat } from '../hooks/useAdminTicketChat'
import { TICKET_STATUS } from '../../../services/ticketService'
import styles from './SupportPage.module.css'

/* عرض ستون‌ها از SVG (از راست): 133.4 | 189 | 181.4 | 177.5 | 216 | 146.8
   از مجموع ۱۰۴۴ (جدول از x=72.5 تا x=1116.5) */
const TICKET_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '12.77%' },
    { key: 'username', label: 'نام کاربری', width: '18.10%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '17.38%' },
    { key: 'department', label: 'دپارتمان', width: '17.00%' },
    { key: 'date', label: 'تاریخ', width: '20.69%', ltr: true },
    { key: 'agent', label: 'کارشناس تخصیص یافته', width: '14.06%', ltr: true },
]

/* ستون‌های مشخصات کاربر — از tab22.
   بک‌اند در خروجی تیکت فقط user_id می‌دهد؛ تا اضافه شدن اندپوینت
   کاربرِ تیکت، همان چیزی که داریم نشان داده می‌شود. */
const SENDER_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '12.79%' },
    { key: 'username', label: 'نام کاربری', width: '18.87%', ltr: true },
    { key: 'ticketNumber', label: 'شماره تیکت', width: '19.33%', ltr: true },
    { key: 'department', label: 'دپارتمان', width: '18.23%' },
    { key: 'subject', label: 'موضوع', width: '16.96%' },
    { key: 'status', label: 'وضعیت', width: '13.82%' },
]

const TABS = [
    { id: 'list', label: 'لیست تیکت‌ها' },
    { id: 'detail', label: 'جزئیات تیکت' },
]

/* گزینه‌های تغییر وضعیت — همان enum بک‌اند با برچسب فارسی */
const STATUS_OPTIONS = Object.entries(TICKET_STATUS)

/**
 * پشتیبانی و تیکتینگ — دو تب: لیست تیکت‌ها و جزئیات تیکت.
 *
 * ردیف انتخاب‌شده در تب لیست، محتوای تب جزئیات را مشخص می‌کند.
 */
export default function SupportPage() {
    const [tab, setTab] = useState('list')
    const [showSender, setShowSender] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const [selected, setSelected] = useState(null)

    const { nameOf } = useDepartments()
    const { rows, page, pageCount, loading, error, setPage, reload } =
        useAdminTickets(nameOf)

    const chat = useAdminTicketChat(chatOpen ? selected?.id : null)

    /* کلیک روی ردیف: انتخاب و رفتن به تب جزئیات */
    const openDetail = (row) => {
        setSelected(row)
        setShowSender(false)
        setTab('detail')
    }

    const changeStatus = async (status) => {
        setStatusOpen(false)
        const ok = await chat.setStatus(selected.id, status)
        if (ok) {
            setSelected((s) => ({ ...s, rawStatus: status, status: TICKET_STATUS[status] }))
            reload()
        }
    }

    const detailRows = selected ? [selected] : []

    return (
        <div className={styles.page}>
            <div className={styles.tabs}>
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
                        onClick={() => setTab(id)}
                        aria-current={tab === id ? 'true' : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'list' ? (
                <AdminTable
                    columns={TICKET_COLUMNS}
                    rows={rows}
                    page={page}
                    pageCount={pageCount}
                    onPageChange={setPage}
                    selectedId={selected?.id ?? null}
                    onRowClick={openDetail}
                    emptyMessage={
                        loading
                            ? 'در حال دریافت تیکت‌ها…'
                            : error || 'تیکتی ثبت نشده است'
                    }
                />
            ) : (
                <>
                    {/* سه دکمه‌ی عملیات — در RTL اولین فرزند سمت راست است */}
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setChatOpen(true)}
                            disabled={!selected}
                        >
                            رفتن به صفحه پاسخگویی
                        </button>

                        <div className={styles.statusWrap}>
                            <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => setStatusOpen((v) => !v)}
                                disabled={!selected || chat.updating}
                                aria-expanded={statusOpen}
                            >
                                {chat.updating ? 'در حال تغییر…' : 'تغییر وضعیت تیکت'}
                            </button>

                            {statusOpen && (
                                <ul className={styles.statusMenu} role="listbox">
                                    {STATUS_OPTIONS.map(([code, label]) => (
                                        <li key={code}>
                                            <button
                                                type="button"
                                                className={styles.statusOption}
                                                onClick={() => changeStatus(code)}
                                                role="option"
                                                aria-selected={selected?.rawStatus === code}
                                            >
                                                {label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            type="button"
                            className={`${styles.actionBtn} ${
                                showSender ? styles.actionBtnActive : ''
                            }`}
                            onClick={() => setShowSender((v) => !v)}
                            disabled={!selected}
                            aria-pressed={showSender}
                        >
                            {showSender && <X size={16} className={styles.actionIcon} />}
                            مشاهده مشخصات کاربر ارسال‌کننده.
                        </button>
                    </div>

                    <AdminTable
                        columns={showSender ? SENDER_COLUMNS : TICKET_COLUMNS}
                        rows={detailRows}
                        paginate={false}
                        emptyMessage="از تب «لیست تیکت‌ها» یک تیکت انتخاب کنید"
                    />

                    {chat.updateError && (
                        <p className={styles.error} role="alert">
                            {chat.updateError}
                        </p>
                    )}
                </>
            )}

            <TicketChatModal
                open={chatOpen}
                messages={chat.messages}
                loading={chat.loading}
                error={chat.error}
                sending={chat.sending}
                sendError={chat.sendError}
                onClose={() => setChatOpen(false)}
                onSend={chat.send}
            />
        </div>
    )
}
