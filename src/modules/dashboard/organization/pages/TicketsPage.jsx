import { useState } from 'react'
import DataTable from '../../components/DataTable/DataTable'
import { MOCK_TICKETS } from '../data/mockTickets'

/* عرض ستون‌ها از SVG (از راست): 226 | 242 | 285 | 267  از ۱۰۲۰ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '22.16%' },
    { key: 'date', label: 'تاریخ', width: '23.73%', ltr: true },
    { key: 'type', label: 'نوع درخواست', width: '27.94%' },
    { key: 'status', label: 'وضعیت', width: '26.18%' },
]

export default function TicketsPage() {
    // TODO: صفحه‌بندی واقعی پس از اتصال به بک‌اند (meta.total / meta.per_page)
    const [page, setPage] = useState(1)

    return (
        <DataTable
            columns={COLUMNS}
            rows={MOCK_TICKETS}
            page={page}
            pageCount={2}
            onPageChange={setPage}
        />
    )
}