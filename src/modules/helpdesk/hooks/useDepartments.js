import { useCallback, useEffect, useState } from 'react'
import { ticketService } from '../../../services/ticketService'

/**
 * لیست دپارتمان‌های تیکتینگ.
 *
 * کامپوننت Select پروژه فقط آرایه‌ی رشته می‌گیرد، ولی بک‌اند برای
 * ساخت تیکت شناسه‌ی UUID می‌خواهد. برای همین دو خروجی داده می‌شود:
 *   names — برای نمایش در Select
 *   idOf(name) — تبدیل نام انتخاب‌شده به شناسه هنگام ارسال فرم
 *
 * اگر دو دپارتمان هم‌نام باشند اولی برنده می‌شود؛ چون در بک‌اند
 * slug یکتاست این حالت عملاً پیش نمی‌آید.
 */
export function useDepartments() {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const items = await ticketService.getDepartments()
                if (!cancelled) setDepartments(items ?? [])
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'دریافت دپارتمان‌ها ناموفق بود')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    const names = departments.map((d) => d.name)

    const idOf = useCallback(
        (name) => departments.find((d) => d.name === name)?.id ?? null,
        [departments]
    )

    /* پایدار نگه داشته می‌شود چون useTickets آن را در وابستگی‌های
       useEffect دارد؛ تابع تازه در هر رندر یعنی حلقه‌ی بی‌پایان درخواست. */
    const nameOf = useCallback(
        (id) => departments.find((d) => d.id === id)?.name ?? '',
        [departments]
    )

    return { departments, names, idOf, nameOf, loading, error }
}
