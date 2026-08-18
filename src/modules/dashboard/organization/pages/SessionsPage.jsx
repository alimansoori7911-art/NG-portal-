import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable/DataTable'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { MOCK_SESSIONS } from '../data/mockSessions'
import { describeDevice } from '../utils/userAgent'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import { useAuthStore } from '../../../../store/authStore'
import { broadcastLogout } from '../../../../services/api'
import styles from './SessionsPage.module.css'

/* عرض ستون‌ها از SVG (از راست): 266.5 | 258.8 | 257.3 | 237.4  از ۱۰۲۰

   ستون «حذف» در فیگما نیست و اینجا اضافه شده تا اندپوینت
   DELETE /auth/sessions/{id} قابل استفاده باشد. عرض ۹۰px آن از ستون
   «ردیف» گرفته شده (که فقط یک رقم دارد) تا چهار ستون دیگر دقیقاً
   همان عرض فیگما بمانند. */
const columnsWith = (onDelete) => [
    { key: 'index', label: 'ردیف', width: '17.30%' },
    { key: 'startedAt', label: 'تاریخ ورود', width: '25.37%', ltr: true },
    { key: 'device', label: 'نام دستگاه', width: '25.23%', ltr: true },
    { key: 'sessionId', label: 'section ID', width: '23.27%', ltr: true },
    {
        key: 'actions',
        label: '',
        width: '8.82%',
        render: (row) => (
            <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => onDelete(row)}
                aria-label={`خروج از نشست ${row.sessionId}`}
                title="خروج از این دستگاه"
            >
                <Trash2 size={18} />
            </button>
        ),
    },
]

/* تاریخ و ساعت در فیگما دو خط جداگانه‌اند */
function DateTimeCell({ iso }) {
    const { date, time } = formatJalaliDateTime(iso)
    if (!date) return null
    return (
        <span className={styles.dateTime}>
            <span>{date}</span>
            <span>{time}</span>
        </span>
    )
}

/** تبدیل RefreshToken بک‌اند به ردیف جدول */
function toRow(session, i) {
    return {
        id: session.id,
        index: i + 1,
        startedAt: <DateTimeCell iso={session.session_started_at} />,
        device: describeDevice(session.user_agent),
        sessionId: session.id,
    }
}

/**
 * مدیریت نشست‌های فعال.
 *
 * TODO: با اتصال به بک‌اند، MOCK_SESSIONS با authService.getSessions()
 *       جایگزین می‌شود — پاسخ { sessions: [...] } است — و حذف‌ها به
 *       authService.removeSession / removeAllSessions وصل می‌شوند.
 *       اندپوینت‌ها آماده‌اند؛ فقط تا وقتی بک‌اند در دسترس نیست
 *       حذف روی state محلی انجام می‌شود.
 */
export default function SessionsPage() {
    const sessionExpired = useAuthStore((s) => s.sessionExpired)

    // TODO: صفحه‌بندی واقعی پس از اتصال — بک‌اند page/per_page می‌گیرد
    const [page, setPage] = useState(1)
    const [sessions, setSessions] = useState(MOCK_SESSIONS)

    /* null یعنی دیالوگی باز نیست؛ 'all' یعنی خروج از همه؛
       در غیر این صورت خود ردیف نگه داشته می‌شود. */
    const [pending, setPending] = useState(null)
    const [working, setWorking] = useState(false)

    const rows = sessions.filter((s) => !s.revoked).map(toRow)

    const confirmDelete = async () => {
        setWorking(true)
        try {
            if (pending === 'all') {
                // await authService.removeAllSessions()

                /* نشستِ خودِ این مرورگر هم جزو همان‌هاست و باطل شده، پس
                   کاربر باید خارج شود. از sessionExpired استفاده می‌کنیم
                   نه logout: چون کوکی سمت سرور از قبل باطل شده و
                   POST /auth/logout فقط یک ۴۰۱ بی‌فایده می‌گیرد.
                   broadcastLogout بقیه‌ی تب‌های باز را هم پاک می‌کند.

                   کاربر به /login می‌رسد نه صفحه‌ی اصلی: به‌محض پاک شدن
                   نشست، ProtectedRoute داشبورد را می‌بندد و ریدایرکت
                   می‌کند. این رفتار درست است — کاربر تازه از همه‌ی
                   دستگاه‌ها خارج شده و قدم بعدی‌اش ورود دوباره است. */
                sessionExpired()
                broadcastLogout()
                return
            }

            // await authService.removeSession(pending.id)
            setSessions((list) => list.filter((s) => s.id !== pending.id))
        } finally {
            setWorking(false)
            setPending(null)
        }
    }

    const isAll = pending === 'all'

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.logoutAllBtn}
                    onClick={() => setPending('all')}
                    disabled={rows.length === 0}
                >
                    خروج از همه دستگاه‌ها
                </button>
            </div>

            <DataTable
                columns={columnsWith(setPending)}
                rows={rows}
                page={page}
                pageCount={2}
                onPageChange={setPage}
            />

            <ConfirmDialog
                open={pending !== null}
                title={isAll ? 'خروج از همه دستگاه‌ها' : 'خروج از این دستگاه'}
                message={
                    isAll
                        ? 'تمام نشست‌های فعال بسته می‌شوند — از جمله همین دستگاه. پس از تأیید از حساب خود خارج شده و به صفحه‌ی ورود هدایت می‌شوید. ادامه می‌دهید؟'
                        : 'این نشست بسته می‌شود و برای استفاده‌ی دوباره از آن دستگاه باید وارد شوید. ادامه می‌دهید؟'
                }
                confirmLabel={isAll ? 'خروج از همه' : 'خروج از دستگاه'}
                cancelLabel="انصراف"
                onConfirm={confirmDelete}
                onClose={() => !working && setPending(null)}
                loading={working}
            />
        </div>
    )
}
