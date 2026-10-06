import { useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { useRolePermissions } from '../../hooks/useRoles'
import styles from './RoleForm.module.css'

/* برچسب فارسی ماژول‌ها.

   کلید دسترسی ماشینی است (`cms.page.publish`). نمایش خامش به ادمین
   فارسی‌زبان بی‌معناست، ولی چون بک‌اند می‌تواند ماژول تازه اضافه کند،
   چیزی که نشناسیم خودش نمایش داده می‌شود. */
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

const moduleLabel = (m) => MODULE_LABEL[m] ?? m
const actionLabel = (a) => ACTION_LABEL[a] ?? a

/**
 * ساخت و ویرایش نقش، به‌همراه تعیین دسترسی‌هایش.
 *
 * ⚠️ نقش **سیستمی** (`is_system`) نامش قابل تغییر نیست: جاهای دیگر کد
 * به نام نقش تکیه کرده‌اند (بررسی `admin` و برچسب VIP)، پس عوض کردنش
 * دسترسی‌ها را بی‌صدا می‌شکند.
 *
 * ⚠️ دسترسی‌ها **جایگزین** می‌شوند نه اضافه: `POST .../permissions`
 * کل فهرست را می‌گیرد. پس فرم با وضعیت فعلی پر می‌شود و هر چه تیک
 * نخورده باشد برداشته می‌شود.
 */
export default function RoleForm({
    role = null,
    permissions = [],
    busy = false,
    error = null,
    onSubmit,
    onClose,
}) {
    const editing = Boolean(role)
    const current = useRolePermissions(editing ? role.id : null)

    const [form, setForm] = useState({
        name: role?.name ?? '',
        description: role?.description ?? '',
        is_active: role?.is_active ?? true,
    })
    /* فقط **تغییرات** کاربر نگه داشته می‌شود، نه کل انتخاب‌ها.

       اگر کل مجموعه در state می‌نشست، باید وقتی دسترسی‌های فعلی از
       سرور رسید آن را پر می‌کردیم — یعنی setState داخل افکت یا
       بدتر، داخل render. به‌جایش انتخاب نهایی از «وضعیت سرور + آنچه
       کاربر عوض کرده» مشتق می‌شود و هیچ همگام‌سازی‌ای لازم نیست. */
    const [changed, setChanged] = useState(() => new Map())
    const [nameError, setNameError] = useState(false)

    /* تا وقتی دسترسی‌های نقش نرسیده، `null` یعنی «هنوز نمی‌دانیم» —
       که با «هیچ دسترسی ندارد» فرق دارد. */
    const keys = current.loading
        ? null
        : new Set(
              permissions
                  .map((p) => p.key)
                  .filter((k) =>
                      changed.has(k) ? changed.get(k) : current.keys.includes(k)
                  )
          )

    const toggle = (key) => {
        setChanged((prev) => {
            const next = new Map(prev)
            next.set(key, !(keys?.has(key) ?? false))
            return next
        })
    }

    /* گروه‌بندی بر اساس ماژول — فهرست تخت ۲۵تایی خوانا نیست */
    const groups = {}
    for (const p of permissions) {
        ;(groups[p.module] = groups[p.module] || []).push(p)
    }

    const toggleModule = (module, on) => {
        setChanged((prev) => {
            const next = new Map(prev)
            for (const p of groups[module]) next.set(p.key, on)
            return next
        })
    }

    const submit = (e) => {
        e.preventDefault()

        if (!form.name.trim()) {
            setNameError(true)
            return
        }

        /* کلید به سه‌تایی برمی‌گردد چون `AssignPermissionsSchema`
           شناسه نمی‌گیرد. */
        const chosen = permissions
            .filter((p) => keys?.has(p.key))
            .map(({ module, resource, action }) => ({ module, resource, action }))

        onSubmit?.({
            role: {
                name: form.name.trim(),
                description: form.description.trim() || null,
                is_active: form.is_active,
            },
            permissions: chosen,
        })
    }

    const lockedName = editing && role.is_system
    const count = keys?.size ?? 0

    return (
        <form className={styles.wrapper} onSubmit={submit} noValidate>
            <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="بستن فرم"
            >
                <X size={16} strokeWidth={3} />
            </button>

            <div className={styles.divider} />

            <h2 className={styles.title}>
                {editing ? `ویرایش نقش «${role.name}»` : 'ساخت نقش'}
            </h2>

            <div className={styles.body}>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}
                {current.error && (
                    <p className={styles.error} role="alert">
                        {current.error}
                    </p>
                )}

                <div className={styles.row}>
                    <label
                        className={`${styles.field} ${
                            nameError ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>
                            نام نقش {lockedName && '(نقش سیستمی — قابل تغییر نیست)'}
                        </span>
                        <input
                            className={styles.input}
                            value={form.name}
                            onChange={(e) => {
                                setForm((p) => ({ ...p, name: e.target.value }))
                                setNameError(false)
                            }}
                            disabled={lockedName}
                            placeholder="editor"
                            dir="ltr"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>توضیح (اختیاری)</span>
                        <input
                            className={styles.input}
                            value={form.description}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, description: e.target.value }))
                            }
                            placeholder="ویرایشگر محتوا"
                        />
                    </label>
                </div>

                <div className={styles.checkBox}>
                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, is_active: e.target.checked }))
                            }
                        />
                        <span>نقش فعال باشد</span>
                    </label>
                </div>

                {/* ── دسترسی‌ها ── */}
                <div className={styles.permsHead}>
                    <span className={styles.permsTitle}>
                        <ShieldCheck size={16} aria-hidden="true" />
                        دسترسی‌ها
                    </span>
                    <span className={styles.permsCount}>
                        {count.toLocaleString('fa-IR')} از{' '}
                        {permissions.length.toLocaleString('fa-IR')} انتخاب شده
                    </span>
                </div>

                {current.loading ? (
                    <p className={styles.state}>در حال دریافت دسترسی‌ها…</p>
                ) : permissions.length === 0 ? (
                    <p className={styles.state}>دسترسی‌ای تعریف نشده است.</p>
                ) : (
                    <div className={styles.groups}>
                        {Object.entries(groups).map(([module, list]) => {
                            const all = list.every((p) => keys?.has(p.key))
                            const some = list.some((p) => keys?.has(p.key))

                            return (
                                <section key={module} className={styles.group}>
                                    <header className={styles.groupHead}>
                                        <label className={styles.groupToggle}>
                                            <input
                                                type="checkbox"
                                                checked={all}
                                                /* نیمه‌انتخاب: بعضی تیک دارند */
                                                ref={(el) => {
                                                    if (el) el.indeterminate = !all && some
                                                }}
                                                onChange={(e) =>
                                                    toggleModule(module, e.target.checked)
                                                }
                                            />
                                            <span className={styles.groupName}>
                                                {moduleLabel(module)}
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
                                                    checked={keys?.has(p.key) ?? false}
                                                    onChange={() => toggle(p.key)}
                                                />
                                                <span className={styles.permAction}>
                                                    {actionLabel(p.action)}
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

                <p className={styles.hint}>
                    دسترسی‌ها <strong>جایگزین</strong> می‌شوند: هر چه تیک نخورده
                    باشد از نقش برداشته می‌شود.
                </p>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className={styles.submit}
                        disabled={busy || current.loading}
                    >
                        {busy ? 'در حال ذخیره…' : editing ? 'ذخیره تغییرات' : 'ساخت نقش'}
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
            </div>
        </form>
    )
}
