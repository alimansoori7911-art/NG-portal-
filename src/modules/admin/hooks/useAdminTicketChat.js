import { useCallback, useEffect, useState } from 'react'
import { ticketService } from '../../../services/ticketService'

/**
 * تبدیل پیام به حباب گفتگوی پنل ادمین.
 *
 * TicketChatModal برچسب «پشتیبان» و «کاربر» را از فیلد from می‌خواند.
 * برخلاف نمای کاربر، این‌جا یادداشت‌های داخلی هم نشان داده می‌شوند
 * چون مخاطبشان همین کارشناسان‌اند.
 */
const toBubble = (m) => ({
    id: m.id,
    from: m.author_type === 'customer' ? 'user' : 'support',
    text: m.body,
    internal: m.message_type === 'internal_note',
})

/**
 * گفتگوی تیکت در پنل ادمین + تغییر وضعیت.
 *
 * ticketId تهی یعنی مودال بسته است و درخواستی زده نمی‌شود.
 */
export function useAdminTicketChat(ticketId) {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [updateError, setUpdateError] = useState(null)

    useEffect(() => {
        if (!ticketId) {
            setMessages([])
            return
        }
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const items = await ticketService.getMessages(ticketId)
                if (!cancelled) setMessages((items ?? []).map(toBubble))
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

    const send = useCallback(
        async (text) => {
            const body = text?.trim()
            if (!body || !ticketId) return false

            setSending(true)
            setSendError(null)
            try {
                const created = await ticketService.reply(ticketId, body)
                setMessages((prev) => [...prev, toBubble(created)])
                return true
            } catch (err) {
                setSendError(err?.message || 'ارسال پاسخ ناموفق بود')
                return false
            } finally {
                setSending(false)
            }
        },
        [ticketId]
    )

    /* تغییر وضعیت مستقل از مودال چت است، پس شناسه‌ی تیکت را
       جداگانه می‌گیرد و به ticketId این هوک وابسته نیست. */
    const setStatus = useCallback(async (id, status) => {
        setUpdating(true)
        setUpdateError(null)
        try {
            await ticketService.updateTicket(id, { status })
            return true
        } catch (err) {
            setUpdateError(err?.message || 'تغییر وضعیت ناموفق بود')
            return false
        } finally {
            setUpdating(false)
        }
    }, [])

    return {
        messages,
        loading,
        error,
        sending,
        sendError,
        send,
        setStatus,
        updating,
        updateError,
    }
}
