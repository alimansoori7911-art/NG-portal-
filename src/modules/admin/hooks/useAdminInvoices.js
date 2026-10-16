import { useCallback, useEffect, useState } from 'react'
import { invoiceService } from '../../../services/invoiceService'
import { formatJalaliDateTime } from '../../../utils/datetime'
import { formatToman } from '../../../utils/currency'
import { ROWS_PER_PAGE } from '../components/AdminTable/AdminTable'

/**
 * فاکتورهای سیستم برای پنل ادمین — `GET /admin/invoice/`.
 *
 * ✅ اسپک ۲۲ این را اضافه کرد. تا پیش از آن کل تب زیر پوشش «به‌زودی»
 * بود و جدولش `rows={[]}` هاردکد داشت.
 */
export function useAdminInvoices() {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    /* شمارنده‌ی تلاش — برای تازه‌سازی بعد از صدور فاکتور */
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items, pagination } =
                    await invoiceService.getAdminInvoices({
                        page,
                        limit: ROWS_PER_PAGE,
                    })
                if (cancelled) return

                const offset = (page - 1) * ROWS_PER_PAGE

                /* اسپک ترتیبی را تضمین نمی‌کند، ولی فاکتور تازه باید
                   بالا باشد — وگرنه ادمین بعد از صدور، فاکتورش را
                   در صفحه پیدا نمی‌کند. */
                const sorted = [...(items ?? [])].sort(
                    (a, b) =>
                        new Date(b.issued_at || b.created_at || 0) -
                        new Date(a.issued_at || a.created_at || 0)
                )

                setRows(
                    sorted.map((inv, i) => {
                        const { date } = formatJalaliDateTime(
                            inv.issued_at || inv.created_at
                        )
                        return {
                            id: inv.id,
                            index: offset + i + 1,
                            serial: inv.invoice_number || '—',
                            type:
                                inv.invoice_type === 'proforma'
                                    ? 'پیش‌فاکتور'
                                    : 'فاکتور',
                            amount: formatToman(inv.total_amount),
                            issuedAt: date || '—',
                            raw: inv,
                        }
                    })
                )
                setPageCount(pagination?.total_pages ?? 1)
            } catch (err) {
                if (!cancelled) {
                    setRows([])
                    setError(err?.message || 'دریافت فاکتورها ناموفق بود')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [page, attempt])

    return { rows, page, pageCount, loading, error, setPage, reload }
}

/**
 * صدور فاکتور — `POST /admin/invoice/`.
 *
 * خطای ۴۲۲ به فیلدهای فرم نگاشت می‌شود تا کاربر بفهمد کدام فیلد را
 * باید درست کند، نه فقط یک پیام کلی.
 */
export function useInvoiceActions(onDone) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)

    const create = useCallback(
        async (payload) => {
            setBusy(true)
            setError(null)
            try {
                await invoiceService.createInvoice(payload)
                onDone?.()
                return true
            } catch (err) {
                setError(err?.message || 'صدور فاکتور ناموفق بود')
                return false
            } finally {
                setBusy(false)
            }
        },
        [onDone]
    )

    return { busy, error, create, clearError: () => setError(null) }
}
