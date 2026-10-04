import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { adminUserService, identifierOf } from '../../../../services/adminUserService'
import styles from './UserPicker.module.css'

/* نام نمایشی کاربر: نام و نام خانوادگی از KYC، وگرنه نام کاربری.
   هیچ‌کدام نبود، شناسه‌ی عددی — بهتر از سلول خالی. */
function displayName(user) {
    const kyc = user.kyc_profile
    const full = [kyc?.first_name, kyc?.last_name]
        .filter((p) => p && String(p).trim())
        .join(' ')
        .trim()

    return full || identifierOf(user, 'username') || `کاربر ${user.id}`
}

/* خط دوم هر گزینه — چیزی که ادمین با آن کاربر را تشخیص می‌دهد */
function subtitle(user) {
    return (
        identifierOf(user, 'email') ||
        identifierOf(user, 'phone') ||
        `#${user.id}`
    )
}

/**
 * انتخاب یک یا چند کاربر با جستجو.
 *
 * جایگزین فیلدی که ادمین باید شناسه‌ی عددی را دستی در آن تایپ کند.
 * آن روش یعنی ادمین باید id را از جای دیگری پیدا و رونویسی کند، و
 * یک رقم اشتباه اعلان را به کاربر دیگری می‌فرستد بی‌آنکه خطایی ببیند.
 *
 * `value` آرایه‌ی شناسه‌های عددی است (همان چیزی که
 * `NotificationAdminCreate.recipient_ids` می‌خواهد) و `onChange` همان
 * را برمی‌گرداند، پس مصرف‌کننده درگیر شکل کاربر نمی‌شود.
 */
export default function UserPicker({
    value = [],
    onChange,
    disabled = false,
    label = 'گیرندگان',
    placeholder = 'نام یا ایمیل کاربر را بنویسید…',
}) {
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState([])
    const [picked, setPicked] = useState([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const wrapperRef = useRef(null)

    /* فهرست کاربران یک‌بار گرفته می‌شود و جستجو سمت کلاینت است.

       اندپوینت `/admin/auth/users` پارامتر جستجو ندارد (فقط page و
       limit)، پس تا وقتی بک‌اند `q` اضافه نکند این تنها راه است.
       limit روی ۱۰۰ — سقف خود اسپک. */
    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { items } = await adminUserService.getUsers({
                    page: 1,
                    limit: 100,
                })
                if (!cancelled) setUsers(items ?? [])
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'دریافت فهرست کاربران ناموفق بود')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    /* بستن فهرست با کلیک بیرون */
    useEffect(() => {
        if (!open) return

        const onDocClick = (e) => {
            if (!wrapperRef.current?.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [open])

    const add = (user) => {
        if (value.includes(user.id)) return
        setPicked((prev) => [...prev, user])
        onChange?.([...value, user.id])
        setQuery('')
    }

    const remove = (id) => {
        setPicked((prev) => prev.filter((u) => u.id !== id))
        onChange?.(value.filter((v) => v !== id))
    }

    const q = query.trim().toLowerCase()
    const matches = users
        .filter((u) => !value.includes(u.id))
        .filter((u) => {
            if (!q) return true
            return (
                displayName(u).toLowerCase().includes(q) ||
                subtitle(u).toLowerCase().includes(q) ||
                String(u.id) === q
            )
        })
        .slice(0, 20)

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <div
                className={`${styles.box} ${disabled ? styles.boxDisabled : ''}`}
            >
                <span className={styles.label}>
                    {label}
                    {value.length > 0 && ` (${value.length})`}
                </span>

                {picked.length > 0 && (
                    <div className={styles.chips}>
                        {picked.map((u) => (
                            <span key={u.id} className={styles.chip}>
                                {displayName(u)}
                                <button
                                    type="button"
                                    className={styles.chipRemove}
                                    onClick={() => remove(u.id)}
                                    disabled={disabled}
                                    aria-label={`حذف ${displayName(u)}`}
                                >
                                    <X size={12} strokeWidth={3} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <input
                    className={styles.input}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    disabled={disabled}
                    placeholder={picked.length > 0 ? '' : placeholder}
                />
            </div>

            {open && !disabled && (
                <div className={styles.menu} role="listbox">
                    {loading && <p className={styles.state}>در حال دریافت…</p>}

                    {!loading && error && (
                        <p className={styles.state} role="alert">
                            {error}
                        </p>
                    )}

                    {!loading && !error && matches.length === 0 && (
                        <p className={styles.state}>کاربری پیدا نشد</p>
                    )}

                    {!loading &&
                        !error &&
                        matches.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                className={styles.option}
                                onClick={() => add(u)}
                                role="option"
                                aria-selected="false"
                            >
                                <span className={styles.optionName}>
                                    {displayName(u)}
                                </span>
                                <span className={styles.optionMeta} dir="ltr">
                                    {subtitle(u)}
                                </span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    )
}
