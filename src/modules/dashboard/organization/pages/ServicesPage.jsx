import { useState } from 'react'
import DataTable from '../../components/DataTable/DataTable'
import { MOCK_SERVICES } from '../data/mockServices'

/* عرض ستون‌ها از SVG (از راست): 226 | 242 | 285 | 267  از ۱۰۲۰ */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '22.16%' },
    { key: 'date', label: 'تاریخ', width: '23.73%', ltr: true },
    { key: 'plan', label: 'پلن', width: '27.94%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '26.18%' },
]

export default function ServicesPage() {
    // TODO: صفحه‌بندی واقعی پس از اتصال به بک‌اند (meta.total / meta.per_page)
    const [page, setPage] = useState(1)

    return (
        <DataTable
            columns={COLUMNS}
            rows={MOCK_SERVICES}
            page={page}
            pageCount={2}
            onPageChange={setPage}
        />
    )
}