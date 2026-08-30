import { useCallback, useEffect, useState } from 'react'
import {
    ticketService,
    isTicketOpen,
    MESSAGE_TYPE,
} from '../../../services/ticketService'
import { fileService, validateFile } from '../../../services/fileService'

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
    attachments: m.attachments ?? [],
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
    /* پیام رفت ولی فایلش نه — کاربر نباید دوباره بفرستد */
    const [partialUpload, setPartialUpload] = useState(false)

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

    /**
     * ارسال پیام، با پیوست اختیاری.
     *
     * پاسخ سرور خودِ پیام ساخته‌شده است، پس همان به فهرست اضافه
     * می‌شود و نیازی به گرفتن دوباره‌ی کل گفتگو نیست.
     *
     * پیوست سه مرحله دارد و ترتیبش اجباری است: اول پیام ارسال
     * می‌شود، چون اندپوینت توکن `message_id` می‌خواهد و آن شناسه
     * قبل از ارسال وجود ندارد.
     *
     * اگر آپلود شکست بخورد **پیام ارسال‌شده باقی می‌ماند** — پس
     * `partialUpload` را می‌گذاریم تا صفحه بگوید متن رفت ولی فایل نه،
     * و کاربر پیام را دوباره نفرستد.
     */
    const send = useCallback(
        async (text, file) => {
            const body = text.trim()
            if ((!body && !file) || !ticketId) return false

            /* فایل قبل از هر درخواستی بررسی می‌شود تا رفت‌وبرگشت
               بی‌فایده نرود. */
            if (file) {
                const invalid = validateFile(file)
                if (invalid) {
                    setSendError(invalid)
                    return false
                }
            }

            setSending(true)
            setSendError(null)
            setPartialUpload(false)

            let created
            try {
                created = await ticketService.reply(ticketId, body)
                setMessages((prev) => [...prev, toBubble(created)])
            } catch (err) {
                setSendError(err?.message || 'ارسال پیام ناموفق بود')
                setSending(false)
                return false
            }

            if (!file) {
                setSending(false)
                return true
            }

            try {
                const { token } = await ticketService.requestMessageUploadToken(
                    ticketId,
                    created.id
                )
                if (!token) throw new Error('توکن آپلود دریافت نشد')

                const uploaded = await fileService.upload(file, token)

                /* پیوست تازه روی همان حباب نشانده می‌شود تا کاربر
                   بدون تازه‌سازی صفحه ببیندش. */
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === created.id
                            ? {
                                  ...m,
                                  attachments: [
                                      ...m.attachments,
                                      {
                                          id: uploaded?.file_id,
                                          original_filename:
                                              uploaded?.filename ?? file.name,
                                      },
                                  ],
                              }
                            : m
                    )
                )
                return true
            } catch (err) {
                setPartialUpload(true)
                setSendError(
                    err?.status === 413
                        ? 'حجم فایل بیش از حد مجاز است'
                        : err?.status === 415
                          ? 'نوع فایل پذیرفته نشد'
                          : err?.message || 'بارگذاری فایل ناموفق بود'
                )
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
        partialUpload,
        send,
        clearSendError: () => {
            setSendError(null)
            setPartialUpload(false)
        },
        /* تیکت بسته/لغوشده اجازه‌ی پیام جدید نمی‌دهد */
        canReply: isTicketOpen(ticket?.status_code),
    }
}
