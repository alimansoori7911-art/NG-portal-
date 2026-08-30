import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import Header from '../../../components/layout/Header/Header'
import AttachmentLink from '../../../components/ui/AttachmentLink/AttachmentLink'
import { ACCEPT_ATTR } from '../../../services/fileService'
import { useTicketChat } from '../hooks/useTicketChat'
import styles from './TicketChatPage.module.css'

/**
 * صفحه‌ی چت تیکت.
 *
 * اعداد از SVG فیگما (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت        x=80 y=96، ۱۲۸۰×۸۳۲، radius 32، #000814
 *   ضربدر       ۲۴px در x=1312 y=120
 *   پیام کارشناس x=586.5 y=601.5، ۵۹۰×۹۳، radius 7.5
 *               #192D4C با ۵۰٪ شفافیت + border 1px #7AB0FF، متن #ADCFFF
 *   پیام کاربر   x=310 y=719، ۵۷۶×۹۲، radius 8
 *               #000814 با ۹۰٪ شفافیت + border 1px #1474FF، متن #1474FF
 *   نوار ورودی   x=301.5 y=834.5، ۸۸۴×۵۷، radius 8.5
 *               #000814 + border 1px #7AB0FF | آیکون ارسال ۲۳px در x=312
 *   درخشش       دایره #7AB0FF r=140 با blur 150
 *               دایره #005CE0 r=207 با blur 250
 */
export default function TicketChatPage() {
    const navigate = useNavigate()
    const { id: ticketId } = useParams()

    const {
        messages,
        loading,
        error,
        sending,
        sendError,
        partialUpload,
        send,
        clearSendError,
        canReply,
    } = useTicketChat(ticketId)

    const [draft, setDraft] = useState('')
    const [file, setFile] = useState(null)
    const listRef = useRef(null)
    const fileRef = useRef(null)

    /* با هر پیام تازه، انتهای گفتگو دیده شود */
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages.length])

    const submit = async () => {
        if (sending) return
        /* پیش‌نویس فقط وقتی پاک می‌شود که ارسال موفق بوده باشد،
           تا در صورت خطا متن کاربر از دست نرود. */
        const ok = await send(draft, file)
        if (ok) {
            setDraft('')
            setFile(null)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    const pickFile = (e) => {
        setFile(e.target.files?.[0] ?? null)
        clearSendError()
    }

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    const placeholder = canReply
        ? 'متن خود را اینجا تایپ کنید'
        : 'این تیکت بسته شده است'

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.card}>
                    {/* درخشش پس‌زمینه — دو دایره‌ی محو مطابق فیگما */}
                    <span className={styles.glowFar} aria-hidden="true" />
                    <span className={styles.glowNear} aria-hidden="true" />

                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => navigate('/helpdesk/tickets')}
                        aria-label="بستن صفحه چت"
                    >
                        <CloseIcon />
                    </button>

                    <div className={styles.messages} ref={listRef}>
                        {loading && (
                            <div className={`${styles.bubble} ${styles.agent}`}>
                                در حال دریافت گفتگو…
                            </div>
                        )}

                        {!loading && error && (
                            <div className={`${styles.bubble} ${styles.agent}`} role="alert">
                                {error}
                            </div>
                        )}

                        {!loading && !error && messages.length === 0 && (
                            <div className={`${styles.bubble} ${styles.agent}`}>
                                هنوز پیامی در این تیکت ثبت نشده است
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`${styles.bubble} ${
                                    msg.author === 'agent' ? styles.agent : styles.user
                                }`}
                            >
                                {msg.text}

                                {msg.attachments?.length > 0 && (
                                    <div className={styles.bubbleFiles}>
                                        {msg.attachments.map((a) => (
                                            <AttachmentLink
                                                key={a.id}
                                                attachment={a}
                                                label={a.original_filename || 'مشاهده فایل'}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {sendError && (
                            <div className={`${styles.bubble} ${styles.user}`} role="alert">
                                {sendError}
                                {/* پیام رفته و فقط فایل نرفته — کاربر نباید
                                    دوباره بفرستد وگرنه پیام تکراری می‌شود. */}
                                {partialUpload && (
                                    <span className={styles.partialNote}>
                                        {' '}
                                        پیام شما ارسال شد؛ فقط فایل بارگذاری نشد.
                                        پیام را دوباره نفرستید.
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* فایل انتخاب‌شده پیش از ارسال — تا کاربر بداند چه
                        چیزی همراه پیام می‌رود و بتواند حذفش کند. */}
                    {file && (
                        <div className={styles.pending}>
                            <Paperclip size={14} />
                            <span className={styles.pendingName} dir="ltr">
                                {file.name}
                            </span>
                            <button
                                type="button"
                                className={styles.pendingRemove}
                                onClick={() => {
                                    setFile(null)
                                    if (fileRef.current) fileRef.current.value = ''
                                }}
                                aria-label="حذف فایل"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className={styles.composer}>
                        <button
                            type="button"
                            className={styles.sendBtn}
                            onClick={submit}
                            disabled={
                                sending || !canReply || (!draft.trim() && !file)
                            }
                            aria-label="ارسال پیام"
                        >
                            <SendIcon />
                        </button>

                        <input
                            className={styles.input}
                            placeholder={placeholder}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={!canReply || loading}
                        />

                        {/* ورودی فایل پنهان است و دکمه‌ی گیره آن را صدا
                            می‌زند، چون ظاهر بومی‌اش با نوار چت نمی‌خواند. */}
                        <input
                            ref={fileRef}
                            type="file"
                            accept={ACCEPT_ATTR}
                            className={styles.hiddenFile}
                            onChange={pickFile}
                            disabled={!canReply || sending}
                        />
                        <button
                            type="button"
                            className={styles.attachBtn}
                            onClick={() => fileRef.current?.click()}
                            disabled={!canReply || sending}
                            aria-label="پیوست فایل"
                            title="پیوست فایل (تصویر یا PDF، حداکثر ۵ مگابایت)"
                        >
                            <Paperclip size={18} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

/* ضربدر ۲۴×۲۴ مطابق فیگما */
function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path
                d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5"
                stroke="#000814"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </svg>
    )
}

/* آیکون ارسال ۲۳px — مثلث رو به چپ مطابق فیگما */
function SendIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M20 5L4 12L20 19L16.5 12L20 5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    )
}