import { useState } from 'react'
import { Trash2, CheckSquare, Square } from 'lucide-react'
import NotificationCard from '../components/NotificationCard/NotificationCard'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useNotifications } from '../hooks/useNotifications'
import styles from './NotificationsPage.module.css'

/**
 * اعلان‌های کاربر — شبکه‌ی سه‌ستونه از کارت‌های باز/بسته‌شونده.
 *
 * در فیگما چند کارت هم‌زمان باز هستند، پس چند اعلان می‌توانند
 * همزمان باز باشند (نه فقط یکی).
 *
 * باز کردن یک کارت آن را «خوانده» می‌کند.
 */
export default function NotificationsPage() {
    const {
        items,
        page,
        pageCount,
        unreadCount,
        loading,
        error,
        setPage,
        markRead,
        markAllRead,
        removeMany,
        bulkLimit,
    } = useNotifications()

    /* مجموعه‌ی شناسه‌های باز */
    const [expanded, setExpanded] = useState(() => new Set())

    /* حالت انتخاب — پیش‌فرض خاموش است تا صفحه‌ی روزمره شلوغ نشود و
       حذف تصادفی سخت‌تر باشد. */
    const [picking, setPicking] = useState(false)
    const [picked, setPicked] = useState(() => new Set())
    const [confirming, setConfirming] = useState(false)
    const [busy, setBusy] = useState(false)

    const togglePick = (id) =>
        setPicked((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const exitPicking = () => {
        setPicking(false)
        setPicked(new Set())
    }

    /* «همه» یعنی همه‌ی اعلان‌های همین صفحه، نه کل سیستم */
    const allPicked = items.length > 0 && items.every((n) => picked.has(n.id))

    const toggleAll = () =>
        setPicked(allPicked ? new Set() : new Set(items.map((n) => n.id)))

    const confirmDelete = async () => {
        setBusy(true)
        const ok = await removeMany([...picked])
        setBusy(false)
        setConfirming(false)
        if (ok) exitPicking()
    }

    const toggle = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
                /* باز کردن یعنی کاربر آن را دید */
                markRead(id)
            }
            return next
        })
    }

    /* خروج زودهنگام بعد از همه‌ی هوک‌هاست تا ترتیب هوک‌ها بین
       رندرها ثابت بماند (Rules of Hooks). */
    if (loading) return <p className={styles.state}>در حال دریافت اعلان‌ها…</p>
    if (error) return <p className={styles.state} role="alert">{error}</p>

    return (
        <div className={styles.page}>
            {items.length > 0 && (
                <div className={styles.toolbar}>
                    {unreadCount > 0 && (
                        <span className={styles.unread}>
                            {unreadCount} اعلان نخوانده
                        </span>
                    )}

                    <div className={styles.toolbarActions}>
                        {picking ? (
                            <>
                                <button
                                    type="button"
                                    className={styles.markAllBtn}
                                    onClick={toggleAll}
                                >
                                    {allPicked ? (
                                        <CheckSquare size={15} aria-hidden="true" />
                                    ) : (
                                        <Square size={15} aria-hidden="true" />
                                    )}
                                    {allPicked
                                        ? 'برداشتن انتخاب همه'
                                        : 'انتخاب همه‌ی این صفحه'}
                                </button>

                                <button
                                    type="button"
                                    className={styles.deleteBtn}
                                    onClick={() => setConfirming(true)}
                                    disabled={picked.size === 0 || busy}
                                >
                                    <Trash2 size={15} aria-hidden="true" />
                                    حذف
                                    {picked.size > 0 &&
                                        ` (${picked.size.toLocaleString('fa-IR')})`}
                                </button>

                                <button
                                    type="button"
                                    className={styles.markAllBtn}
                                    onClick={exitPicking}
                                    disabled={busy}
                                >
                                    انصراف
                                </button>
                            </>
                        ) : (
                            <>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        className={styles.markAllBtn}
                                        onClick={markAllRead}
                                    >
                                        علامت‌گذاری همه به‌عنوان خوانده‌شده
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className={styles.markAllBtn}
                                    onClick={() => setPicking(true)}
                                >
                                    <Trash2 size={15} aria-hidden="true" />
                                    حذف اعلان‌ها
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <p className={styles.state}>اعلانی برای نمایش وجود ندارد</p>
            ) : (
                <div className={styles.grid}>
                    {items.map((item) =>
                        picking ? (
                            /* در حالت انتخاب، کارت باز نمی‌شود — کلیک
                               یعنی انتخاب، نه خواندن. */
                            <label key={item.id} className={styles.pickWrap}>
                                <input
                                    type="checkbox"
                                    className={styles.pickBox}
                                    checked={picked.has(item.id)}
                                    onChange={() => togglePick(item.id)}
                                />
                                <span className={styles.pickCard}>
                                    <NotificationCard
                                        item={item}
                                        expanded={false}
                                        onToggle={() => togglePick(item.id)}
                                    />
                                </span>
                            </label>
                        ) : (
                            <NotificationCard
                                key={item.id}
                                item={item}
                                expanded={expanded.has(item.id)}
                                onToggle={toggle}
                            />
                        )
                    )}
                </div>
            )}

            <ConfirmDialog
                open={confirming}
                title="حذف اعلان‌ها"
                message={`${picked.size.toLocaleString('fa-IR')} اعلان حذف شود؟ این کار برگشت‌پذیر نیست.${
                    picked.size > bulkLimit
                        ? ` (حداکثر ${bulkLimit.toLocaleString('fa-IR')} مورد در هر بار)`
                        : ''
                }`}
                confirmLabel="حذف کن"
                cancelLabel="انصراف"
                loading={busy}
                onConfirm={confirmDelete}
                onClose={() => setConfirming(false)}
            />

            {pageCount > 1 && (
                <nav className={styles.pagination} aria-label="صفحه‌بندی">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            type="button"
                            className={`${styles.pageBtn} ${
                                n === page ? styles.pageBtnActive : ''
                            }`}
                            onClick={() => setPage(n)}
                            aria-current={n === page ? 'page' : undefined}
                        >
                            {n}
                        </button>
                    ))}
                </nav>
            )}
        </div>
    )
}
