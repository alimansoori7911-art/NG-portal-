import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import AdminTable from '../AdminTable/AdminTable'
import {
    MOCK_USER_PROFILE,
    MOCK_USER_ORDERS,
    MOCK_USER_LICENSES,
    MOCK_USER_TICKETS,
} from '../../data/mockUsers'
import styles from './UserProfileModal.module.css'

/* عرض ستون‌ها از SVG — هر جدول از x=72.5 تا x=1116.5 (۱۰۴۴) */
const ORDER_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '18.65%' },
    { key: 'plan', label: 'نوع پلن', width: '31.12%', ltr: true },
    { key: 'orderCode', label: 'کد سفارش', width: '30.56%', ltr: true },
    { key: 'date', label: 'تاریخ', width: '19.67%', ltr: true },
]

const LICENSE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '12.27%' },
    { key: 'license', label: 'کد لایسنس', width: '17.39%', ltr: true },
    { key: 'status', label: 'وضعیت', width: '17.42%' },
    { key: 'expiresAt', label: 'تاریخ انقضا', width: '19.48%', ltr: true },
    { key: 'activatedAt', label: 'تاریخ فعال سازی', width: '19.34%', ltr: true },
    { key: 'server', label: 'سرور متصل', width: '14.10%', ltr: true },
]

const TICKET_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '19.69%' },
    { key: 'status', label: 'وضعیت تیکت', width: '30.95%' },
    { key: 'date', label: 'تاریخ', width: '29.44%', ltr: true },
    { key: 'department', label: 'دپارتمان', width: '19.92%' },
]

/* فیلدهای اطلاعات شخصی — ترتیب دو ستونه‌ی فیگما.
   ستاره یعنی اجباری؛ در فیگما کنار برچسب آمده. */
const PROFILE_FIELDS = [
    { key: 'username', label: 'نام کاربری', required: true, ltr: true },
    { key: 'nationalId', label: 'کد ملی' },
    { key: 'firstName', label: 'نام', required: true },
    { key: 'email', label: 'ایمیل', required: true, ltr: true },
    { key: 'lastName', label: 'نام خانوادگی' },
    { key: 'password', label: 'رمز عبور', required: true, ltr: true },
    { key: 'phone', label: 'شماره موبایل', required: true, ltr: true },
    { key: 'organization', label: 'نام سازمان' },
]

/* عنوان هر بخش با خط جداکننده در دو طرف */
function SectionTitle({ children }) {
    return (
        <div className={styles.sectionTitle}>
            <span className={styles.sectionLabel}>{children}</span>
        </div>
    )
}

/**
 * پروفایل جامع کاربر — مودال تمام‌صفحه با اسکرول داخلی.
 *
 * چهار بخش: اطلاعات شخصی، تاریخچه خرید، لایسنس‌ها، تیکت‌ها.
 * ضربدر بالای صفحه مودال را می‌بندد و به لیست کاربران برمی‌گردد.
 *
 * TODO: فیلدها فقط خواندنی‌اند و دکمه‌های «ویرایش اطلاعات» و
 *       «احراز هویت دستی» هنوز عملکردی ندارند — اندپوینت ندارند.
 */
export default function UserProfileModal({ open, onClose }) {
    useEffect(() => {
        if (!open) return

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [open, onClose])

    if (!open) return null

    return createPortal(
        <div className={styles.overlay}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label="پروفایل جامع کاربر"
            >
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label="بستن"
                >
                    <X size={16} strokeWidth={3} />
                </button>

                <div className={styles.scroll}>
                    {/* ── اطلاعات شخصی و احراز هویت ── */}
                    <SectionTitle>اطلاعات شخصی و احراز هویت</SectionTitle>

                    <div className={styles.actions}>
                        <button type="button" className={styles.actionBtn}>
                            ویرایش اطلاعات
                        </button>
                        <button type="button" className={styles.actionBtn}>
                            احراز هویت دستی
                        </button>
                    </div>

                    <div className={styles.fields}>
                        {PROFILE_FIELDS.map(({ key, label, required, ltr }) => {
                            const value = MOCK_USER_PROFILE[key]
                            return (
                                <div
                                    key={key}
                                    className={`${styles.field} ${value ? styles.fieldFilled : ''}`}
                                >
                                    <span className={styles.fieldLabel}>
                                        {required && <span aria-hidden="true">* </span>}
                                        {label}
                                    </span>
                                    <span
                                        className={styles.fieldValue}
                                        dir={ltr && value ? 'ltr' : undefined}
                                    >
                                        {value}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* ── تاریخچه خرید و سفارشات ── */}
                    <SectionTitle>تاریخچه خرید و سفارشات</SectionTitle>
                    <AdminTable
                        columns={ORDER_COLUMNS}
                        rows={MOCK_USER_ORDERS}
                        paginate={false}
                    />

                    {/* ── لایسنس‌ها ── */}
                    <SectionTitle>لایسنس‌های فعال/منقضی</SectionTitle>
                    <AdminTable
                        columns={LICENSE_COLUMNS}
                        rows={MOCK_USER_LICENSES}
                        paginate={false}
                    />

                    {/* ── تیکت‌ها ── */}
                    <SectionTitle>تیکت‌های کاربر</SectionTitle>
                    <AdminTable
                        columns={TICKET_COLUMNS}
                        rows={MOCK_USER_TICKETS}
                        paginate={false}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}
