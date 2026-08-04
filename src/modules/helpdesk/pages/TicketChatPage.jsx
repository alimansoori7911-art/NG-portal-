import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../../components/layout/Header/Header'
import { MOCK_MESSAGES } from '../data/mockMessages'
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

    // TODO: پیام‌ها از بک‌اند بیایند و ارسال واقعی انجام شود
    const [messages, setMessages] = useState(MOCK_MESSAGES)
    const [draft, setDraft] = useState('')

    const send = () => {
        const text = draft.trim()
        if (!text) return

        setMessages((prev) => [
            ...prev,
            { id: Date.now(), author: 'user', text },
        ])
        setDraft('')
    }

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

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

                    <div className={styles.messages}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`${styles.bubble} ${
                                    msg.author === 'agent' ? styles.agent : styles.user
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    <div className={styles.composer}>
                        <button
                            type="button"
                            className={styles.sendBtn}
                            onClick={send}
                            aria-label="ارسال پیام"
                        >
                            <SendIcon />
                        </button>

                        <input
                            className={styles.input}
                            placeholder="متن خود را اینجا تایپ کنید"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onKeyDown}
                        />
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