import { useState } from 'react'
import { Plus, Pencil, Trash2, UserPlus, UserMinus, Users, X } from 'lucide-react'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog'
import { identifierOf } from '../../../../services/adminUserService'
import { ticketService } from '../../../../services/ticketService'
import {
    useDepartments,
    useDepartmentMembers,
    useDepartmentActions,
} from '../../hooks/useDepartments'
import styles from './DepartmentPanel.module.css'

/* نام نمایشی کاربر — ترجیح با نام کاربری، بعد ایمیل، بعد شناسه. */
const userLabel = (u) =>
    identifierOf(u, 'username') ||
    identifierOf(u, 'email') ||
    `کاربر ${u.id}`

/**
 * مدیریت دپارتمان‌های تیکت و اعضایشان.
 *
 * تیکت‌ها به دپارتمان ارجاع می‌دهند ولی تا امروز راهی برای ساخت
 * دپارتمان از پنل نبود — فقط از دیتابیس.
 *
 * ⚠️ `slug` فرستاده نمی‌شود: `TicketDepartmentCreateSchema` آن را
 * نمی‌پذیرد و بک‌اند خودش از نام می‌سازدش.
 */
export default function DepartmentPanel() {
    const { departments, users, error, loading, reload } = useDepartments()
    const actions = useDepartmentActions()

    /* `form` حالت فرم است: null بسته، 'new' ساخت، شیء یعنی ویرایش */
    const [form, setForm] = useState(null)
    const [draft, setDraft] = useState({ name: '', description: '' })
    const [nameError, setNameError] = useState(false)

    const [deleting, setDeleting] = useState(null)
    /* دپارتمانی که پنل اعضایش باز است */
    const [membersOf, setMembersOf] = useState(null)
    const members = useDepartmentMembers(membersOf?.id)
    const [pickUser, setPickUser] = useState('')

    /* ⚠️ فهرست دپارتمان‌ها `description` **ندارد**
       (`TicketDepartmentListItemSchema` فقط id/slug/name است). اگر فرم
       را با ردیف فهرست پر کنیم، توضیح خالی می‌افتد و ذخیره آن را
       **پاک می‌کند**. پس موقع ویرایش، خودِ دپارتمان جدا خوانده
       می‌شود. */
    const [formLoading, setFormLoading] = useState(false)

    const openForm = async (dept) => {
        setNameError(false)
        actions.clearError()

        if (!dept) {
            setForm('new')
            setDraft({ name: '', description: '' })
            return
        }

        setForm(dept)
        setDraft({ name: dept.name ?? '', description: '' })
        setFormLoading(true)
        try {
            const full = await ticketService.getDepartment(dept.id)
            setDraft({
                name: full?.name ?? dept.name ?? '',
                description: full?.description ?? '',
            })
        } catch {
            /* اگر نشد، دست‌کم نام را داریم؛ خطا در ذخیره معلوم می‌شود */
        } finally {
            setFormLoading(false)
        }
    }

    const closeForm = () => {
        setForm(null)
        actions.clearError()
    }

    const save = async (e) => {
        e.preventDefault()
        if (!draft.name.trim()) {
            setNameError(true)
            return
        }

        const payload = {
            name: draft.name.trim(),
            description: draft.description.trim() || null,
        }

        const ok =
            form === 'new'
                ? await actions.create(payload)
                : await actions.update(form.id, payload)

        if (!ok) return
        closeForm()
        reload()
    }

    const confirmDelete = async () => {
        if (!(await actions.remove(deleting.id))) return
        setDeleting(null)
        /* اگر پنل اعضای همین دپارتمان باز بود باید بسته شود */
        if (membersOf?.id === deleting.id) setMembersOf(null)
        reload()
    }

    const addMember = async () => {
        if (!pickUser) return
        if (!(await actions.addMembers(membersOf.id, [Number(pickUser)]))) return
        setPickUser('')
        members.reload()
    }

    /* ⚠️ حذف با `user_id` انجام می‌شود نه شناسه‌ی ردیف عضویت —
       مسیر اسپک `/members/{user_id}` است. */
    const removeMember = async (member) => {
        if (!(await actions.removeMember(membersOf.id, member.user_id))) return
        members.reload()
    }

    const memberIds = new Set(members.items.map((m) => m.user_id))
    const available = users.filter((u) => !memberIds.has(u.id))

    /* ── فرم ── */
    if (form) {
        return (
            <form className={styles.form} onSubmit={save} noValidate>
                <button
                    type="button"
                    className={styles.close}
                    onClick={closeForm}
                    aria-label="بستن فرم"
                >
                    <X size={16} strokeWidth={3} />
                </button>

                <div className={styles.divider} />

                <h2 className={styles.formTitle}>
                    {form === 'new' ? 'ساخت دپارتمان' : `ویرایش «${form.name}»`}
                </h2>

                <div className={styles.formBody}>
                    {actions.error && (
                        <p className={styles.error} role="alert">
                            {actions.error}
                        </p>
                    )}

                    <label
                        className={`${styles.field} ${
                            nameError ? styles.fieldError : ''
                        }`}
                    >
                        <span className={styles.label}>نام دپارتمان</span>
                        <input
                            className={styles.input}
                            value={draft.name}
                            onChange={(e) => {
                                setDraft((p) => ({ ...p, name: e.target.value }))
                                setNameError(false)
                            }}
                            placeholder="فنی"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>توضیح (اختیاری)</span>
                        <input
                            className={styles.input}
                            value={draft.description}
                            onChange={(e) =>
                                setDraft((p) => ({ ...p, description: e.target.value }))
                            }
                            placeholder="مشکلات فنی و خطاها"
                        />
                    </label>

                    <p className={styles.hint}>
                        نشانی کوتاه (slug) را خودِ سرور از نام می‌سازد.
                    </p>

                    <div className={styles.formActions}>
                        <button
                            type="submit"
                            className={styles.submit}
                            disabled={actions.busy || formLoading}
                        >
                            {formLoading
                                ? 'در حال دریافت…'
                                : actions.busy
                                  ? 'در حال ذخیره…'
                                  : form === 'new'
                                    ? 'ساخت دپارتمان'
                                    : 'ذخیره تغییرات'}
                        </button>

                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={closeForm}
                            disabled={actions.busy}
                        >
                            انصراف
                        </button>
                    </div>
                </div>
            </form>
        )
    }

    /* ── پنل اعضا ── */
    if (membersOf) {
        return (
            <>
                <div className={styles.toolbar}>
                    <button
                        type="button"
                        className={styles.createBtn}
                        onClick={() => setMembersOf(null)}
                    >
                        بازگشت به دپارتمان‌ها
                    </button>
                </div>

                <h3 className={styles.membersTitle}>
                    <Users size={17} aria-hidden="true" />
                    اعضای «{membersOf.name}»
                </h3>

                {(actions.error || members.error) && (
                    <p className={styles.error} role="alert">
                        {actions.error || members.error}
                    </p>
                )}

                {/* افزودن عضو */}
                <div className={styles.addRow}>
                    <select
                        className={styles.select}
                        value={pickUser}
                        onChange={(e) => setPickUser(e.target.value)}
                        disabled={actions.busy || available.length === 0}
                        aria-label="انتخاب کاربر"
                    >
                        <option value="">
                            {available.length === 0
                                ? 'همه‌ی کاربران عضو هستند'
                                : 'کاربری را انتخاب کنید…'}
                        </option>
                        {available.map((u) => (
                            <option key={u.id} value={u.id}>
                                {userLabel(u)}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className={styles.addBtn}
                        onClick={addMember}
                        disabled={!pickUser || actions.busy}
                    >
                        <UserPlus size={15} aria-hidden="true" />
                        افزودن عضو
                    </button>
                </div>

                {members.loading ? (
                    <p className={styles.state}>در حال دریافت اعضا…</p>
                ) : members.items.length === 0 ? (
                    <p className={styles.state}>
                        این دپارتمان هنوز عضوی ندارد.
                    </p>
                ) : (
                    <ul className={styles.list}>
                        {members.items.map((m) => {
                            const u = users.find((x) => x.id === m.user_id)

                            return (
                                <li key={m.id} className={styles.row}>
                                    <div className={styles.main}>
                                        <span className={styles.name}>
                                            {u ? userLabel(u) : `کاربر ${m.user_id}`}
                                        </span>
                                        <span className={styles.meta} dir="ltr">
                                            #{m.user_id}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className={`${styles.iconBtn} ${styles.danger}`}
                                        onClick={() => removeMember(m)}
                                        disabled={actions.busy}
                                        aria-label={`حذف ${u ? userLabel(u) : m.user_id}`}
                                        title="حذف از دپارتمان"
                                    >
                                        <UserMinus size={15} />
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </>
        )
    }

    /* ── فهرست دپارتمان‌ها ── */
    return (
        <>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.createBtn}
                    onClick={() => openForm(null)}
                >
                    <Plus size={16} aria-hidden="true" />
                    ساخت دپارتمان
                </button>
            </div>

            {(error || actions.error) && (
                <p className={styles.error} role="alert">
                    {error || actions.error}
                </p>
            )}

            {loading ? (
                <p className={styles.state}>در حال دریافت دپارتمان‌ها…</p>
            ) : departments.length === 0 ? (
                <p className={styles.state}>
                    دپارتمانی ساخته نشده است. تیکت‌ها بدون دپارتمان دسته‌بندی
                    نمی‌شوند.
                </p>
            ) : (
                <ul className={styles.list}>
                    {departments.map((d) => (
                        <li key={d.id} className={styles.row}>
                            <div className={styles.main}>
                                <div className={styles.head}>
                                    <span className={styles.name}>{d.name}</span>
                                    <span className={styles.slug} dir="ltr">
                                        {d.slug}
                                    </span>
                                </div>

                                {d.description && (
                                    <p className={styles.desc}>{d.description}</p>
                                )}
                            </div>

                            <div className={styles.actionsRow}>
                                <button
                                    type="button"
                                    className={styles.ghost}
                                    onClick={() => setMembersOf(d)}
                                >
                                    <Users size={14} aria-hidden="true" />
                                    اعضا
                                </button>

                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => openForm(d)}
                                    aria-label={`ویرایش ${d.name}`}
                                    title="ویرایش"
                                >
                                    <Pencil size={15} />
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.iconBtn} ${styles.danger}`}
                                    onClick={() => setDeleting(d)}
                                    aria-label={`حذف ${d.name}`}
                                    title="حذف"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmDialog
                open={Boolean(deleting)}
                title="حذف دپارتمان"
                message={
                    deleting
                        ? `دپارتمان «${deleting.name}» حذف شود؟ اگر تیکتی به آن ارجاع داده باشد حذف نمی‌شود.`
                        : ''
                }
                confirmLabel="حذف کن"
                cancelLabel="انصراف"
                loading={actions.busy}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </>
    )
}
