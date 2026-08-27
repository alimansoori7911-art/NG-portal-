import { useCallback, useEffect, useRef, useState } from 'react'
import { invoiceService } from '../../../../services/invoiceService'

/* هر صفحه ۱۰ ردیف — هم‌راستا با بقیه‌ی جدول‌های داشبورد */
export const INVOICES_PER_PAGE = 10

/**
 * فاکتورهای کاربر جاری.
 *
 * علاوه بر لیست، باز کردن PDF را هم مدیریت می‌کند: لینک دانلود
 * presigned و کوتاه‌عمر است، پس هر بار تازه گرفته می‌شود و ذخیره نمی‌شود.
 */
export function useInvoices() {
    const [invoices, setInvoices] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    /* شناسه‌ی فاکتوری که همین حالا PDF‌اش در حال گرفته شدن است —
       برای نشان دادن حالت انتظار روی همان ردیف، نه کل جدول. */
    const [openingId, setOpeningId] = useState(null)
    const [openError, setOpenError] = useState(null)

    /* جلوگیری از باز شدن دوبار یک فاکتور با دابل‌کلیک */
    const opening = useRef(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { items, pagination } = await invoiceService.getInvoices({
                page,
                limit: INVOICES_PER_PAGE,
            })
            setInvoices(items ?? [])
            setPageCount(pagination?.total_pages ?? 1)
            setError(null)
        } catch (err) {
            setError(err?.message || 'دریافت فاکتورها ناموفق بود')
        } finally {
            setLoading(false)
        }
    }, [page])

    useEffect(() => {
        load()
    }, [load])

    /**
     * باز کردن PDF فاکتور در تب جدید.
     *
     * تب **قبل از** درخواست باز می‌شود و بعد آدرسش ست می‌شود. اگر بعد
     * از await باز می‌کردیم، مرورگر آن را پاپ‌آپ ناخواسته می‌دید و
     * بلاک می‌کرد، چون دیگر مستقیماً حاصل کلیک کاربر نبود.
     */
    const openPdf = useCallback(async (invoice) => {
        if (!invoice?.pdf_file_id) {
            setOpenError('فایل PDF این فاکتور هنوز آماده نشده است')
            return
        }
        if (opening.current) return
        opening.current = true

        setOpeningId(invoice.id)
        setOpenError(null)

        const tab = window.open('', '_blank', 'noopener,noreferrer')

        try {
            const url = await invoiceService.getPdfUrl(invoice.pdf_file_id)
            if (!url) throw new Error('لینک دانلود دریافت نشد')

            if (tab) {
                tab.location.href = url
            } else {
                /* پاپ‌آپ بلاک شده — در همین تب باز می‌کنیم تا کاربر
                   دست‌کم فاکتورش را ببیند. */
                window.location.href = url
            }
        } catch (err) {
            tab?.close()
            setOpenError(err?.message || 'باز کردن فاکتور ناموفق بود')
        } finally {
            setOpeningId(null)
            opening.current = false
        }
    }, [])

    return {
        invoices,
        page,
        pageCount,
        loading,
        error,
        openingId,
        openError,
        setPage,
        openPdf,
        dismissOpenError: () => setOpenError(null),
        reload: load,
    }
}
