import { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import AuditLogList from '../components/AuditLogList/AuditLogList'
import UserProfileModal from '../components/UserProfileModal/UserProfileModal'
import RoleForm from '../components/RoleForm/RoleForm'
import UserCreateForm from '../components/UserCreateForm/UserCreateForm'
import UserPermissionsDialog from '../components/UserPermissionsDialog/UserPermissionsDialog'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import Select from '../../../components/ui/Select/Select'
import { useAdminUsers, useUserActions, useRoles } from '../hooks/useAdminUsers'
import { useRolesAdmin, useRoleActions } from '../hooks/useRoles'
import { useAuditLogs } from '../hooks/useAuditLogs'
import styles from './UsersPage.module.css'

/* عرض ستون‌ها از SVG (از راست): 107.8 | 161.4 | 173.9 | 167.7 | 152.1 | 166 | 115.1
   از مجموع ۱۰۴۴ (جدول از x=72.5 تا x=1116.5) */
const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '9.09%' },
    { key: 'email', label: 'ایمیل', width: '12.98%', ltr: true },
    { key: 'username', label: 'نام کاربری', width: '14.19%', ltr: true },
    { key: 'phone', label: 'شماره تماس', width: '13.59%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '12.10%' },
    { key: 'role', label: 'نقش', width: '13.23%' },
    {
        key: 'vip',
        label: 'برچسب VIP',
        width: '15.26%',
        /* بج به‌جای متن خام تا در فهرست از یک نگاه پیدا باشد */
        render: (row) =>
            row.vip === 'VIP' ? (
                <span className={styles.vipBadge}>VIP</span>
            ) : (
                <span className={styles.vipNone}>—</span>
            ),
    },
    { key: 'registeredAt', label: 'تاریخ ثبت نام', width: '9.57%', ltr: true },
]

const TABS = [
    { id: 'users', label: 'لیست کاربران' },
    { id: 'roles', label: 'نقش‌ها و دسترسی‌ها' },
    { id: 'audit', label: 'لاگ ممیزی (Audit Log)' },
]

/* ستون‌های نقش — فیگمایی برایش نرسیده بود، عرض‌ها متناسب با محتوا. */
const ROLE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '8%' },
    { key: 'name', label: 'نام نقش', width: '22%', ltr: true },
    { key: 'description', label: 'توضیح', width: '34%' },
    { key: 'users', label: 'کاربران', width: '12%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '24%' },
]

/**
 * کاربران و دسترسی‌ها — دو تب: لیست کاربران و لاگ ممیزی.
 *
 * هر دو تب به بک‌اند وصل‌اند (`/admin/auth/users` و `/audit/`).
 *
 * ⚠️ دو مورد از فیگما پیاده نشده چون بک‌اند ندارد:
 *   - «برچسب VIP» — چنین فیلدی در مدل کاربر نیست
 *   - «ویرایش اطلاعات» — `UserUpdateSchema` فقط is_active/is_blocked
 *     می‌پذیرد، پس ایمیل و نام قابل ویرایش نیستند
 * رجوع به BACKEND_NEEDS.md
 */
export default function UsersPage() {
    const [tab, setTab] = useState('users')

    const {
        rows,
        page,
        pageCount,
        loading,
        error,
        setPage,
        reload,
        adminsOnly,
        toggleAdminsOnly,
    } = useAdminUsers()

    /* نقش‌ها فقط وقتی لازم‌اند که دیالوگ تغییر نقش باز شود */
    const [roleDialog, setRoleDialog] = useState(null)
    const { roles, loading: rolesLoading } = useRoles(roleDialog !== null)
    const [selectedRole, setSelectedRole] = useState('')

    const {
        busy,
        error: actionError,
        clearError,
        toggleActive,
        remove,
        assignRole,
    } = useUserActions(reload)

    /* لاگ ممیزی فقط وقتی تب دومش باز است بارگذاری می‌شود */
    const audit = useAuditLogs()

    /* نقش‌ها و دسترسی‌ها — تب سوم.
       `roleForm` حالت فرم است: null بسته، 'new' ساخت، شیء یعنی ویرایش. */
    const rolesAdmin = useRolesAdmin()
    const roleActions = useRoleActions()
    const [roleForm, setRoleForm] = useState(null)
    const [roleDelete, setRoleDelete] = useState(null)
    const [roleSelectedId, setRoleSelectedId] = useState(null)

    /* ساخت کاربر از پنل — تا امروز فقط ثبت‌نام خود کاربر ممکن بود */
    const [creatingUser, setCreatingUser] = useState(false)
    /* دسترسی مستقیم کاربر — خارج از نقش */
    const [permsFor, setPermsFor] = useState(null)

    const saveUserPermissions = async (permissions) => {
        if (!(await roleActions.setUserPermissions(permsFor.id, permissions))) return
        setPermsFor(null)
        roleActions.clearError()
        reload()
    }

    const saveUser = async (payload) => {
        if (!(await roleActions.createUser(payload))) return
        setCreatingUser(false)
        roleActions.clearError()
        reload()
    }

    /* ردیف انتخاب‌شده — با کلیک روی آن نوار عملیات زیرش باز می‌شود */
    const [selectedId, setSelectedId] = useState(null)
    const [profileUser, setProfileUser] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    /* ذخیره‌ی نقش: خودِ نقش و دسترسی‌هایش دو درخواست جدا هستند
       (اسپک مسیر واحدی ندارد)، پس اول نقش ساخته/ویرایش می‌شود و بعد
       دسترسی‌ها رویش می‌نشینند. */
    const saveRole = async (payload) => {
        const editing = roleForm !== 'new'
        let roleId = editing ? roleForm.id : null

        if (editing) {
            if (!(await roleActions.update(roleId, payload.role))) return
        } else {
            const created = await roleActions.create(payload.role)
            if (!created) return
            roleId = created.id
        }

        if (roleId && payload.permissions.length > 0) {
            if (!(await roleActions.setPermissions(roleId, payload.permissions))) return
        }

        setRoleForm(null)
        roleActions.clearError()
        rolesAdmin.reload()
    }

    const confirmRoleDelete = async () => {
        if (await roleActions.remove(roleDelete.id)) {
            setRoleDelete(null)
            setRoleSelectedId(null)
            rolesAdmin.reload()
        }
    }

    const toggleRow = useCallback(
        (row) => setSelectedId((id) => (id === row.id ? null : row.id)),
        []
    )

    const confirmDelete = async () => {
        const ok = await remove(deleteTarget.id)
        if (ok) {
            setDeleteTarget(null)
            setSelectedId(null)
        }
    }

    const confirmRole = async () => {
        const role = roles.find((r) => r.name === selectedRole)
        if (!role) return

        const ok = await assignRole(roleDialog.id, role.id)
        if (ok) {
            setRoleDialog(null)
            setSelectedRole('')
        }
    }

    const rowActions = (row) => (
        <div className={styles.rowActions}>
            <button
                type="button"
                className={styles.rowActionBtn}
                disabled={busy}
                onClick={(e) => {
                    e.stopPropagation()
                    setRoleDialog(row.raw)
                }}
            >
                تغییر نقش
            </button>

            <button
                type="button"
                className={styles.rowActionBtn}
                disabled={busy}
                onClick={(e) => {
                    e.stopPropagation()
                    setPermsFor(row.raw)
                }}
            >
                دسترسی مستقیم
            </button>

            <button
                type="button"
                className={styles.rowActionBtn}
                disabled={busy}
                onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(row)
                }}
            >
                حذف کاربر
            </button>

            <button
                type="button"
                className={styles.rowActionBtn}
                disabled={busy}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleActive(row.raw)
                }}
            >
                {row.raw?.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
            </button>

            <button
                type="button"
                className={styles.rowActionBtn}
                onClick={(e) => {
                    e.stopPropagation()
                    setProfileUser(row.raw)
                }}
            >
                پروفایل جامع کاربر
            </button>

            <button
                type="button"
                className={styles.rowActionsClose}
                onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(null)
                }}
                aria-label="بستن نوار عملیات"
            >
                <X size={14} strokeWidth={3} />
            </button>
        </div>
    )

    return (
        <div className={styles.page}>
            {/* نوار تب — در RTL اولین فرزند سمت راست می‌نشیند، پس ترتیب
                DOM همان ترتیب فیگما (لیست کاربران سمت راست) است. */}
            <div className={styles.tabs}>
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
                        onClick={() => {
                            setTab(id)
                            setSelectedId(null)
                        }}
                        aria-current={tab === id ? 'true' : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'users' && actionError && (
                <p className={styles.error} role="alert" onClick={clearError}>
                    {actionError}
                </p>
            )}

            {tab === 'users' ? (
                creatingUser ? (
                    <UserCreateForm
                        roles={rolesAdmin.roles}
                        busy={roleActions.busy}
                        error={roleActions.error}
                        onSubmit={saveUser}
                        onClose={() => {
                            setCreatingUser(false)
                            roleActions.clearError()
                        }}
                    />
                ) : (
                  <>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={() => {
                                roleActions.clearError()
                                setCreatingUser(true)
                            }}
                        >
                            ساخت کاربر
                        </button>

                        {/* تنها راه دیدن مدیران — فهرست کاربران فیلتر
                            نقش ندارد و مسیر جدایی برایش هست. */}
                        <label className={styles.checkRow}>
                            <input
                                type="checkbox"
                                checked={adminsOnly}
                                onChange={toggleAdminsOnly}
                            />
                            <span>فقط مدیران</span>
                        </label>
                    </div>

                    <AdminTable
                        columns={COLUMNS}
                        rows={rows}
                        page={page}
                        pageCount={pageCount}
                        onPageChange={setPage}
                        selectedId={selectedId}
                        onRowClick={toggleRow}
                        renderRowActions={rowActions}
                        emptyMessage={
                            loading
                                ? 'در حال دریافت کاربران…'
                                : error || 'کاربری برای نمایش وجود ندارد'
                        }
                    />
                  </>
                )
            ) : tab === 'roles' ? (
                roleForm ? (
                    <RoleForm
                        role={roleForm === 'new' ? null : roleForm}
                        permissions={rolesAdmin.permissions}
                        busy={roleActions.busy}
                        error={roleActions.error}
                        onSubmit={saveRole}
                        onClose={() => {
                            setRoleForm(null)
                            roleActions.clearError()
                        }}
                    />
                ) : (
                    <>
                        {rolesAdmin.error && (
                            <p className={styles.error} role="alert">
                                {rolesAdmin.error}
                            </p>
                        )}
                        {roleActions.error && (
                            <p className={styles.error} role="alert">
                                {roleActions.error}
                            </p>
                        )}

                        <div className={styles.toolbar}>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={() => setRoleForm('new')}
                            >
                                ساخت نقش
                            </button>
                        </div>

                        <AdminTable
                            columns={ROLE_COLUMNS}
                            rows={rolesAdmin.roles.map((r, i) => ({
                                id: r.id,
                                index: i + 1,
                                name: r.name,
                                description: r.description || '—',
                                users:
                                    r.user_count == null
                                        ? '—'
                                        : r.user_count.toLocaleString('fa-IR'),
                                status: r.is_system
                                    ? 'سیستمی'
                                    : r.is_active
                                      ? 'فعال'
                                      : 'غیرفعال',
                                raw: r,
                            }))}
                            selectedId={roleSelectedId}
                            onRowClick={(row) =>
                                setRoleSelectedId((id) =>
                                    id === row.id ? null : row.id
                                )
                            }
                            renderRowActions={(row) => (
                                <div className={styles.rowActions}>
                                    <button
                                        type="button"
                                        className={styles.rowActionBtn}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setRoleForm(row.raw)
                                        }}
                                    >
                                        ویرایش و دسترسی‌ها
                                    </button>

                                    {/* نقش سیستمی حذف نمی‌شود — کد جاهای
                                        دیگر به نامش تکیه کرده است. */}
                                    {!row.raw.is_system && (
                                        <button
                                            type="button"
                                            className={styles.rowActionDanger}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setRoleDelete(row.raw)
                                            }}
                                        >
                                            حذف نقش
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className={styles.rowActionsClose}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setRoleSelectedId(null)
                                        }}
                                        aria-label="بستن نوار عملیات"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            )}
                            emptyMessage={
                                rolesAdmin.loading
                                    ? 'در حال دریافت نقش‌ها…'
                                    : 'نقشی تعریف نشده است'
                            }
                        />

                        <ConfirmDialog
                            open={Boolean(roleDelete)}
                            title="حذف نقش"
                            message={
                                roleDelete
                                    ? `نقش «${roleDelete.name}» حذف شود؟ این نقش از همه‌ی کاربرانی که دارندش برداشته می‌شود.`
                                    : ''
                            }
                            confirmLabel="حذف کن"
                            cancelLabel="انصراف"
                            loading={roleActions.busy}
                            onConfirm={confirmRoleDelete}
                            onClose={() => setRoleDelete(null)}
                        />
                    </>
                )
            ) : (
                <>
                    {audit.error && (
                        <p className={styles.error} role="alert">
                            {audit.error}
                        </p>
                    )}
                    {audit.loading && audit.items.length === 0 ? (
                        <p className={styles.hint}>در حال دریافت لاگ‌ها…</p>
                    ) : (
                        <AuditLogList items={audit.items} />
                    )}
                </>
            )}

            <UserProfileModal
                open={profileUser !== null}
                user={profileUser}
                onClose={() => setProfileUser(null)}
            />

            {permsFor && (
                <UserPermissionsDialog
                    user={permsFor}
                    permissions={rolesAdmin.permissions}
                    busy={roleActions.busy}
                    error={roleActions.error}
                    onSubmit={saveUserPermissions}
                    onClose={() => {
                        setPermsFor(null)
                        roleActions.clearError()
                    }}
                />
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="حذف کاربر"
                message={
                    deleteTarget
                        ? `کاربر «${deleteTarget.username}» حذف می‌شود. این کار قابل بازگشت نیست. ادامه می‌دهید؟`
                        : ''
                }
                confirmLabel="حذف کاربر"
                cancelLabel="انصراف"
                loading={busy}
                onConfirm={confirmDelete}
                onClose={() => !busy && setDeleteTarget(null)}
            />

            <ConfirmDialog
                open={roleDialog !== null}
                title="تغییر نقش کاربر"
                message={
                    rolesLoading
                        ? 'در حال دریافت نقش‌ها…'
                        : 'نقش تازه‌ای که می‌خواهید به این کاربر داده شود را انتخاب کنید. نقش‌های قبلی حذف نمی‌شوند.'
                }
                confirmLabel="تخصیص نقش"
                cancelLabel="انصراف"
                loading={busy}
                confirmDisabled={!selectedRole}
                onConfirm={confirmRole}
                onClose={() => {
                    if (busy) return
                    setRoleDialog(null)
                    setSelectedRole('')
                }}
            >
                {/* Select با رشته کار می‌کند نه شیء، پس نام نقش نگه داشته
                    می‌شود و هنگام تأیید به id تبدیل می‌شود. */}
                <Select
                    label="نقش"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    options={roles.map((r) => r.name)}
                    disabled={rolesLoading || busy}
                />
            </ConfirmDialog>
        </div>
    )
}
