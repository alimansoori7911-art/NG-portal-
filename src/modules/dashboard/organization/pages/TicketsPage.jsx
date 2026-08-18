import DataTable from '../../components/DataTable/DataTable'
import { useDepartments } from '../../../helpdesk/hooks/useDepartments'
import { useTickets } from '../../../helpdesk/hooks/useTickets'

/* عرض ستون‌ها از SVG (از راست): 226 | 242 | 285 | 267  از ۱۰۲۰ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '22.16%' },
    { key: 'date', label: 'تاریخ', width: '23.73%', ltr: true },
    { key: 'type', label: 'نوع درخواست', width: '27.94%' },
    { key: 'status', label: 'وضعیت', width: '26.18%' },
]

/**
 * تیکت‌های کاربر در داشبورد.
 *
 * ستون «نوع درخواست» در بک‌اند فیلد مستقلی ندارد؛ نزدیک‌ترین چیز
 * موضوع تیکت (subject) است که همان را نشان می‌دهیم.
 */
export default function TicketsPage() {
    const { nameOf } = useDepartments()
    const { rows, page, pageCount, loading, error, setPage } = useTickets(nameOf)

    const tableRows = rows.map((t) => ({ ...t, type: t.subject || '—' }))

    if (loading) return <p>در حال دریافت تیکت‌ها…</p>
    if (error) return <p role="alert">{error}</p>

    return (
        <DataTable
            columns={COLUMNS}
            rows={tableRows}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
        />
    )
}
