import { useCallback, useEffect, useState } from 'react'
import {
    ticketService,
    isTicketOpen,
    MESSAGE_TYPE,
} from '../../../services/ticketService'

/**
 * تبدیل TicketMessageOutSchema به حباب گفتگو.
 *
 * author_type سه مقدار دارد: customer | staff | system
 * در نمای کاربر، پیام‌های سیستمی هم سمت کارشناس نشان داده می‌شوند.
 */
const toBubble = (m) => ({
    id: m.id,
    author: m.author_type === 'customer' ? 'user' : 'agent',
    text: m.body,
    createdAt: m.created_at,
})

/* یادداشت داخلی بین کارشناسان است و نباید به کاربر نشان داده شود.
   بک‌اند هم فیلتر می‌کند ولی این لایه‌ی دوم برای اطمینان است. */
const isVisibleToCustomer = (m) => m.message_type !== MESSAGE_TYPE.INTERNAL

/**
 * گفتگوی یک تیکت.
 *
 * پیام‌ها از /tickets/{id} می‌آیند (که messages را هم برمی‌گرداند)
 * تا وضعیت تیکت هم در همان درخواست به دست بیاید — برای اینکه بدانیم
 * کاربر اجازه‌ی پاسخ دادن دارد یا تیکت بسته شده است.
 */
export function useTicketChat(ticketId) {
    const [ticket, setTicket] = useState(null)
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState(null)

    useEffect(() => {
        if (!ticketId) return
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const data = await ticketService.getTicket(ticketId)
                if (cancelled) return

                setTicket(data)
                setMessages(
                    (data?.messages ?? []).filter(isVisibleToCustomer).map(toBubble)
                )
            } catch (err) {
                if (!cancelled) setError(err?.message || 'دریافت گفتگو ناموفق بود')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [ticketId])

    /* ارسال پیام. پاسخ سرور خودِ پیام ساخته‌شده است، پس همان را به
       فهرست اضافه می‌کنیم و نیازی به گرفتن دوباره‌ی کل گفتگو نیست. */
    const send = useCallback(
        async (text) => {
            const body = text.trim()
            if (!body || !ticketId) return false

            setSending(true)
            setSendError(null)
            try {
                const created = await ticketService.reply(ticketId, body)
                setMessages((prev) => [...prev, toBubble(created)])
                return true
            } catch (err) {
                setSendError(err?.message || 'ارسال پیام ناموفق بود')
                return false
            } finally {
                setSending(false)
            }
        },
        [ticketId]
    )

    return {
        ticket,
        messages,
        loading,
        error,
        sending,
        sendError,
        send,
        /* تیکت بسته/لغوشده اجازه‌ی پیام جدید نمی‌دهد */
        canReply: isTicketOpen(ticket?.status_code),
    }
}
