import { useState } from 'react'
import { X } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import AuditLogList from '../components/AuditLogList/AuditLogList'
import UserProfileModal from '../components/UserProfileModal/UserProfileModal'
import { MOCK_ADMIN_USERS, MOCK_AUDIT_LOGS } from '../data/mockUsers'
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
    { key: 'vip', label: 'برچسب VIP', width: '15.26%' },
    { key: 'registeredAt', label: 'تاریخ ثبت نام', width: '9.57%', ltr: true },
]

/* دکمه‌های نوار عملیات — ترتیب و عرض از SVG (از راست به چپ).
   TODO: به‌جز «پروفایل جامع کاربر» بقیه هنوز عملکردی ندارند. */
const ROW_ACTIONS = [
    'ویرایش اطلاعات',
    'تغییر نقش',
    'حذف کاربر',
    'تغییر وضعیت',
    'پروفایل جامع کاربر',
]

const TABS = [
    { id: 'users', label: 'لیست کاربران' },
    { id: 'audit', label: 'لاگ ممیزی (Audit Log)' },
]

/**
 * کاربران و دسترسی‌ها — دو تب: لیست کاربران و لاگ ممیزی.
 *
 * TODO: هر دو روی داده‌ی نمونه‌اند؛ اندپوینتی برای کاربران و لاگ
 *       در اسپک نیست. رجوع به BACKEND_NEEDS.md
 */
export default function UsersPage() {
    const [tab, setTab] = useState('users')
    const [page, setPage] = useState(1)

    /* ردیف انتخاب‌شده — با کلیک روی آن نوار عملیات زیرش باز می‌شود */
    const [selectedId, setSelectedId] = useState(null)
    const [profileOpen, setProfileOpen] = useState(false)

    const toggleRow = (row) =>
        setSelectedId((id) => (id === row.id ? null : row.id))

    const rowActions = () => (
        <div className={styles.rowActions}>
            {ROW_ACTIONS.map((label) => (
                <button
                    key={label}
                    type="button"
                    className={styles.rowActionBtn}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (label === 'پروفایل جامع کاربر') setProfileOpen(true)
                    }}
                >
                    {label}
                </button>
            ))}

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
                            setPage(1)
                        }}
                        aria-current={tab === id ? 'true' : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'users' ? (
                <AdminTable
                    columns={COLUMNS}
                    rows={MOCK_ADMIN_USERS}
                    page={page}
                    onPageChange={setPage}
                    selectedId={selectedId}
                    onRowClick={toggleRow}
                    renderRowActions={rowActions}
                />
            ) : (
                <AuditLogList items={MOCK_AUDIT_LOGS} />
            )}

            <UserProfileModal
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
            />
        </div>
    )
}
