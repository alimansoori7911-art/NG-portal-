import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldCheck } from 'lucide-react'
import { identifierOf } from '../../../../services/adminUserService'
import styles from './UserPermissionsDialog.module.css'

const MODULE_LABEL = {
    auth: 'کاربران و دسترسی‌ها',
    cms: 'مدیریت محتوا',
    orders: 'سفارش‌ها',
    payments: 'پرداخت‌ها',
    ticketing: 'تیکتینگ',
    notifications: 'اعلان‌ها',
    discount: 'کد تخفیف',
    license: 'لایسنس',
    products: 'محصولات',
}

const ACTION_LABEL = {
    read: 'مشاهده',
    create: 'ساخت',
    update: 'ویرایش',
    delete: 'حذف',
    publish: 'انتشار',
    verify: 'تأیید',
    reply: 'پاسخ',
    close: 'بستن',
    send: 'ارسال',
    revoke: 'باطل کردن',
}

/**
 * دسترسی مستقیم یک کاربر — خارج از نقش.
 *
 * ⚠️ این دسترسی‌ها **جدا از نقش** هستند و رویش سوار می‌شوند. اسپک
 * مسیری برای خواندن دسترسی مستقیمِ کاربر ندارد (فقط `POST`)، پس
 * وضعیت فعلی از خودِ رکورد کاربر (`permissions`) خوانده می‌شود که
 * فهرست کاربران می‌دهد.
 *
 * ⚠️ `POST` کل مجموعه را **جایگزین** می‌کند، نه اضافه.
 */
export default function UserPermissionsDialog({
    user,
    permissions = [],
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    /* فقط تغییرات کاربر نگه داشته می‌شود و انتخاب نهایی از آن مشتق
       می‌شود — همان الگوی RoleForm، تا همگام‌سازی داخل افکت لازم نشود. */
    const [changed, setChanged] = useState(() => new Map())

    /* دسترسی‌های فعلی از رکورد کاربر؛ `UserPermissionResponseSchema`
       هر مورد را داخل `permission` می‌پیچد. */
    const current = (user?.permissions ?? []).map(
        (p) => p.permission?.key ?? p.key
    )

    /* ⚠️ `user` اینجا رکورد خام API است، نه ردیف جدول — پس
       `username` تخت ندارد و باید از `identifiers` بیرون کشیده شود. */
    const userLabel =
        identifierOf(user, 'username') ||
        identifierOf(user, 'email') ||
        `کاربر ${user?.id ?? ''}`

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [onClose])

    const keys = new Set(
        permissions
            .map((p) => p.key)
            .filter((k) => (changed.has(k) ? changed.get(k) : current.includes(k)))
    )

    const toggle = (key) =>
        setChanged((prev) => {
            const next = new Map(prev)
            next.set(key, !keys.has(key))
            return next
        })

    const groups = {}
    for (const p of permissions) {
        ;(groups[p.module] = groups[p.module] || []).push(p)
    }

    const toggleModule = (module, on) =>
        setChanged((prev) => {
            const next = new Map(prev)
            for (const p of groups[module]) next.set(p.key, on)
            return next
        })

    const submit = (e) => {
        e.preventDefault()
        const chosen = permissions
            .filter((p) => keys.has(p.key))
            .map(({ module, resource, action }) => ({ module, resource, action }))
        onSubmit?.(chosen)
    }

    return createPortal(
        <div
            className={styles.overlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.()
            }}
        >
            <form
                className={styles.modal}
                onSubmit={submit}
                role="dialog"
                aria-modal="true"
                aria-label="دسترسی‌های مستقیم کاربر"
            >
                <header className={styles.header}>
                    <span className={styles.headTitle}>
                        <ShieldCheck size={17} aria-hidden="true" />
                        دسترسی مستقیم «{userLabel}»
                    </span>

                    <button
                        type="button"
                        className={styles.close}
                        onClick={onClose}
                        aria-label="بستن"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                </header>

                <div className={styles.scroll}>
                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}

                    <p className={styles.intro}>
                        این دسترسی‌ها <strong>علاوه بر</strong> دسترسی‌های نقش
                        کاربر هستند. برای دادن دسترسی به یک گروه از کاربران،
                        بهتر است به‌جای این‌جا یک نقش بسازید.
                    </p>

                    {permissions.length === 0 ? (
                        <p className={styles.state}>دسترسی‌ای تعریف نشده است.</p>
                    ) : (
                        <div className={styles.groups}>
                            {Object.entries(groups).map(([module, list]) => {
                                const all = list.every((p) => keys.has(p.key))
                                const some = list.some((p) => keys.has(p.key))

                                return (
                                    <section key={module} className={styles.group}>
                                        <header className={styles.groupHead}>
                                            <label className={styles.groupToggle}>
                                                <input
                                                    type="checkbox"
                                                    checked={all}
                                                    ref={(el) => {
                                                        if (el) {
                                                            el.indeterminate = !all && some
                                                        }
                                                    }}
                                                    onChange={(e) =>
                                                        toggleModule(
                                                            module,
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                <span className={styles.groupName}>
                                                    {MODULE_LABEL[module] ?? module}
                                                </span>
                                            </label>

                                            <span className={styles.groupKey} dir="ltr">
                                                {module}
                                            </span>
                                        </header>

                                        <div className={styles.perms}>
                                            {list.map((p) => (
                                                <label key={p.key} className={styles.perm}>
                                                    <input
                                                        type="checkbox"
                                                        checked={keys.has(p.key)}
                                                        onChange={() => toggle(p.key)}
                                                    />
                                                    <span className={styles.permAction}>
                                                        {ACTION_LABEL[p.action] ??
                                                            p.action}
                                                    </span>
                                                    <span
                                                        className={styles.permResource}
                                                        dir="ltr"
                                                    >
                                                        {p.resource}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                )
                            })}
                        </div>
                    )}
                </div>

                <footer className={styles.footer}>
                    <span className={styles.count}>
                        {keys.size.toLocaleString('fa-IR')} انتخاب شده — ذخیره،
                        فهرست را <strong>جایگزین</strong> می‌کند
                    </span>

                    <div className={styles.actions}>
                        <button
                            type="submit"
                            className={styles.submit}
                            disabled={busy || keys.size === 0}
                            title={
                                keys.size === 0
                                    ? 'اسپک حداقل یک دسترسی می‌خواهد'
                                    : undefined
                            }
                        >
                            {busy ? 'در حال ذخیره…' : 'ذخیره'}
                        </button>

                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={onClose}
                            disabled={busy}
                        >
                            انصراف
                        </button>
                    </div>
                </footer>
            </form>
        </div>,
        document.body
    )
}
