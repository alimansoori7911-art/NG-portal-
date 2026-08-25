import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable/DataTable'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useSessions, SESSIONS_PER_PAGE } from '../hooks/useSessions'
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
        /* نشست جاری دکمه‌ی حذف ندارد: بستنش یعنی خروج از همان صفحه‌ای
           که کاربر در آن ایستاده. برای این کار «خروج از همه» هست که
           پیامدش را صریح می‌گوید. */
        render: (row) =>
            row.isCurrent ? (
                <span className={styles.currentBadge}>این دستگاه</span>
            ) : (
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

/** تبدیل RefreshToken بک‌اند به ردیف جدول.
 *
 * ⚠️ `id` و `session_id` فرق دارند: نمایش و حذف هر دو با `session_id`
 * انجام می‌شوند، `id` فقط شناسه‌ی رکورد است. */
function toRow(session, i, offset) {
    return {
        id: session.session_id,
        index: offset + i + 1,
        startedAt: <DateTimeCell iso={session.session_started_at} />,
        device: describeDevice(session.user_agent),
        sessionId: session.session_id,
        isCurrent: Boolean(session.is_current),
    }
}

/**
 * مدیریت نشست‌های فعال.
 *
 * وصل به `GET /auth/sessions` و دو اندپوینت حذف. منطق در useSessions
 * است تا این فایل فقط نمایش بماند.
 */
export default function SessionsPage() {
    const sessionExpired = useAuthStore((s) => s.sessionExpired)

    const {
        sessions,
        page,
        pageCount,
        loading,
        error,
        working,
        actionError,
        setPage,
        removeSession,
        removeAllSessions,
    } = useSessions()

    /* null یعنی دیالوگی باز نیست؛ 'all' یعنی خروج از همه؛
       در غیر این صورت خود ردیف نگه داشته می‌شود. */
    const [pending, setPending] = useState(null)

    const offset = (page - 1) * SESSIONS_PER_PAGE
    const rows = sessions.map((s, i) => toRow(s, i, offset))

    const confirmDelete = async () => {
        if (pending === 'all') {
            const ok = await removeAllSessions()
            if (!ok) return

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

        const ok = await removeSession(pending.sessionId)
        if (ok) setPending(null)
    }

    const isAll = pending === 'all'

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.logoutAllBtn}
                    onClick={() => setPending('all')}
                    disabled={rows.length === 0 || working}
                >
                    خروج از همه دستگاه‌ها
                </button>
            </div>

            {actionError && (
                <p className={styles.error} role="alert">
                    {actionError}
                </p>
            )}

            <DataTable
                columns={columnsWith(setPending)}
                rows={rows}
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                emptyMessage={
                    loading
                        ? 'در حال دریافت نشست‌ها…'
                        : error || 'نشست فعالی وجود ندارد'
                }
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
