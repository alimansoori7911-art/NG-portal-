import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationService } from '../../../../services/notificationService'
import { formatJalaliDateTime } from '../../../../utils/datetime'

/* هر صفحه ۹ کارت — شبکه‌ی سه‌ستونه‌ی فیگما */
export const NOTIFICATIONS_PER_PAGE = 9

/* فاصله‌ی تازه‌سازی خودکار — بک‌اند گفته ۳۰ ثانیه */
const POLL_MS = 30_000

/**
 * تبدیل NotificationResponse به کارت.
 *
 * فیگما سه چیز می‌خواهد: عنوان، خلاصه (کنار عنوان)، متن کامل.
 * بک‌اند فقط title و body دارد، پس خلاصه از زمان ساخته می‌شود
 * (همان چیزی که در فیگما «همین الان» بود).
 *
 * بنر تصویر در بک‌اند وجود ندارد؛ کارت بدون تصویر رندر می‌شود.
 */
function toCard(n) {
    const { date, time } = formatJalaliDateTime(n.created_at)

    return {
        id: n.id,
        title: n.title,
        summary: date ? `${date} — ${time}` : '',
        body: n.body,
        image: null,
        type: n.type,
        read: Boolean(n.read_at),
    }
}

/**
 * اعلان‌های کاربر جاری.
 *
 * هر ۳۰ ثانیه خودش تازه می‌شود. وقتی تب مخفی است پولینگ متوقف
 * می‌شود تا درخواست بی‌مورد به سرور نرود، و با برگشت کاربر
 * بلافاصله یک‌بار تازه‌سازی می‌کند.
 */
export function useNotifications({ poll = true } = {}) {
    const [items, setItems] = useState([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    /* برای تازه‌سازی بی‌صدا (بدون نمایش «در حال دریافت») */
    const firstLoad = useRef(true)

    /* شناسه‌هایی که همین حالا در حال «خوانده شدن» هستند.
       StrictMode در حالت توسعه هندلرها را دوبار صدا می‌زند؛ بدون این
       نگهبان، شمارنده به‌ازای یک کلیک دو واحد کم می‌شد. */
    const marking = useRef(new Set())

    const load = useCallback(
        async ({ silent = false } = {}) => {
            if (!silent) setLoading(true)
            try {
                const { items: data, pagination } =
                    await notificationService.getNotifications({
                        page,
                        limit: NOTIFICATIONS_PER_PAGE,
                    })

                setItems((data ?? []).map(toCard))
                setPageCount(pagination?.total_pages ?? 1)
                setError(null)
            } catch (err) {
                /* در تازه‌سازی خودکار خطا را نشان نمی‌دهیم تا کارت‌های
                   موجود با یک قطعی لحظه‌ای شبکه ناپدید نشوند. */
                if (!silent) setError(err?.message || 'دریافت اعلان‌ها ناموفق بود')
            } finally {
                if (!silent) setLoading(false)
                firstLoad.current = false
            }
        },
        [page]
    )

    useEffect(() => {
        load()
    }, [load])

    /* شمارش نخوانده‌ها — درخواست جدا با read_only=true چون تعداد کل
       نخوانده‌ها ممکن است بیشتر از صفحه‌ی جاری باشد. */
    const loadUnread = useCallback(async () => {
        try {
            const { pagination } = await notificationService.getNotifications({
                page: 1,
                limit: 1,
                read_only: true,
            })
            setUnreadCount(pagination?.total ?? 0)
        } catch {
            /* شمارنده حیاتی نیست؛ با خطا بی‌صدا رد می‌شویم */
        }
    }, [])

    useEffect(() => {
        loadUnread()
    }, [loadUnread])

    /* پولینگ ۳۰ ثانیه‌ای — فقط وقتی تب دیده می‌شود */
    useEffect(() => {
        if (!poll) return

        let timer = null

        const start = () => {
            if (timer) return
            timer = setInterval(() => {
                load({ silent: true })
                loadUnread()
            }, POLL_MS)
        }

        const stop = () => {
            if (timer) clearInterval(timer)
            timer = null
        }

        const onVisibility = () => {
            if (document.hidden) {
                stop()
            } else {
                /* بلافاصله بعد از برگشت، یک‌بار تازه کن */
                load({ silent: true })
                loadUnread()
                start()
            }
        }

        if (!document.hidden) start()
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            stop()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [poll, load, loadUnread])

    /* خواندن یک اعلان — خوش‌بینانه به‌روز می‌شود تا کارت فوراً
       حالت خوانده بگیرد و منتظر پاسخ سرور نماند.

       شمارنده به‌جای کم‌کردن دستی، از روی خود آیتم‌ها حساب می‌شود.
       دلیلش این است که در StrictMode هندلر دوبار اجرا می‌شود و
       `c => c - 1` دوبار کم می‌کرد؛ ولی مقدار مطلق چندبار هم که
       اجرا شود همان نتیجه را می‌دهد. */
    const markRead = useCallback(
        async (id) => {
            const target = items.find((n) => n.id === id)
            if (!target || target.read) return
            if (marking.current.has(id)) return
            marking.current.add(id)

            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
            setUnreadCount((c) => Math.max(0, c - 1))

            try {
                await notificationService.markRead(id)
            } catch {
                /* برگرداندن به حالت قبل در صورت شکست */
                setItems((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read: false } : n))
                )
                loadUnread()
            } finally {
                marking.current.delete(id)
            }
        },
        [items, loadUnread]
    )

    /* خواندن همه‌ی نخوانده‌های صفحه‌ی جاری */
    const markAllRead = useCallback(async () => {
        const ids = items.filter((n) => !n.read).map((n) => n.id)
        if (ids.length === 0) return

        /* همان نگهبان markRead — جلوگیری از کم شدن دوباره‌ی شمارنده */
        const fresh = ids.filter((id) => !marking.current.has(id))
        if (fresh.length === 0) return
        fresh.forEach((id) => marking.current.add(id))

        setItems((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount((c) => Math.max(0, c - fresh.length))

        try {
            await notificationService.markManyRead(fresh)
        } catch {
            load({ silent: true })
            loadUnread()
        } finally {
            fresh.forEach((id) => marking.current.delete(id))
        }
    }, [items, load, loadUnread])

    const remove = useCallback(
        async (id) => {
            const snapshot = items
            setItems((prev) => prev.filter((n) => n.id !== id))

            try {
                await notificationService.remove(id)
                load({ silent: true })
            } catch {
                setItems(snapshot)
            }
        },
        [items, load]
    )

    return {
        items,
        page,
        pageCount,
        unreadCount,
        loading,
        error,
        setPage,
        markRead,
        markAllRead,
        remove,
        reload: () => load(),
    }
}
