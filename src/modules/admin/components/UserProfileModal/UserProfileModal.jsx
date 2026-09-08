import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import AdminTable from '../AdminTable/AdminTable'
import ComingSoon from '../../../../components/ui/ComingSoon/ComingSoon'
import { useUserOrders } from '../../hooks/useUserOrders'
import { useUserTickets } from '../../hooks/useUserTickets'
import { identifierOf, kycStatusLabel } from '../../../../services/adminUserService'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import styles from './UserProfileModal.module.css'

/* عرض ستون‌ها از SVG — هر جدول از x=72.5 تا x=1116.5 (۱۰۴۴)

   دو ستون «مبلغ» و «وضعیت» در فیگما نبودند و اضافه شده‌اند: بک‌اند
   هر دو را می‌دهد و بدون آن‌ها تاریخچه‌ی خرید چیز مفیدی نمی‌گوید.
   عرض‌ها از سه ستون اصلی کم شده تا جمع همچنان ۱۰۰٪ بماند. */
const ORDER_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '10%' },
    { key: 'plan', label: 'نوع پلن', width: '24%', ltr: true },
    { key: 'orderCode', label: 'کد سفارش', width: '22%', ltr: true },
    { key: 'amount', label: 'مبلغ', width: '18%' },
    { key: 'status', label: 'وضعیت', width: '14%' },
    { key: 'date', label: 'تاریخ', width: '12%', ltr: true },
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

/**
 * فیلدهای اطلاعات شخصی — ترتیب دو ستونه‌ی فیگما.
 * ستاره یعنی اجباری؛ در فیگما کنار برچسب آمده.
 *
 * ⚠️ فیلد «رمز عبور» فیگما حذف شد: بک‌اند رمز را برنمی‌گرداند (و
 * نباید برگرداند). جایش «وضعیت احراز هویت» آمد که داده‌ی واقعی دارد.
 *
 * ⚠️ «نام سازمان» هم حذف شد — `UserResponseSchema` فیلد شرکت ندارد
 * (بر خلاف `Profile` در /auth/me). رجوع به BACKEND_NEEDS.md
 */
function profileFieldsOf(user) {
    const kyc = user?.kyc_profile
    const { date: registeredAt } = formatJalaliDateTime(user?.created_at)

    return [
        { key: 'username', label: 'نام کاربری', required: true, ltr: true,
          value: identifierOf(user, 'username') },
        { key: 'nationalId', label: 'کد ملی', ltr: true,
          value: identifierOf(user, 'national_id') },
        { key: 'firstName', label: 'نام', required: true,
          value: kyc?.first_name ?? '' },
        { key: 'email', label: 'ایمیل', required: true, ltr: true,
          value: identifierOf(user, 'email') },
        { key: 'lastName', label: 'نام خانوادگی',
          value: kyc?.last_name ?? '' },
        { key: 'kycStatus', label: 'وضعیت احراز هویت',
          value: kyc ? kycStatusLabel(kyc.status) : '' },
        { key: 'phone', label: 'شماره موبایل', required: true, ltr: true,
          value: identifierOf(user, 'phone') },
        { key: 'registeredAt', label: 'تاریخ ثبت نام', ltr: true,
          value: registeredAt },
    ]
}

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
 * «اطلاعات شخصی» از `GET /admin/auth/users/{id}` می‌آید و واقعی است.
 *
 * «تاریخچه خرید» هم واقعی است — `GET /admin/orders/?user_id=`.
 *
 * «تیکت‌های کاربر» به `GET /admin/tickets?user_id=` وصل شد. اگر بک‌اند
 * هنوز این فیلتر را پیاده نکرده باشد، به‌جای نشان دادن تیکت‌های همه‌ی
 * کاربران پیام می‌دهد — رجوع به `useUserTickets`.
 *
 * جدول لایسنس زیر پوشش «به‌زودی» است — فاز توسعه، و ضمناً
 * لایسنس‌سرور رابط خودش را دارد.
 * TODO: دکمه‌های «ویرایش اطلاعات» و «احراز هویت دستی» عملکردی ندارند —
 *       `UserUpdateSchema` فقط is_active/is_blocked می‌پذیرد.
 */
export default function UserProfileModal({ open, user, onClose }) {
    /* فقط وقتی مودال باز است درخواست می‌رود؛ با بسته بودن userId تهی
       می‌ماند و هوک چیزی نمی‌خواند. */
    const orders = useUserOrders(open ? user?.id : null)
    const tickets = useUserTickets(open ? user?.id : null)

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
                        {profileFieldsOf(user).map(({ key, label, required, ltr, value }) => {
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
                        rows={orders.rows}
                        paginate={false}
                        emptyMessage={
                            orders.loading
                                ? 'در حال دریافت سفارش‌ها…'
                                : orders.error || 'سفارشی برای این کاربر ثبت نشده است'
                        }
                    />

                    {/* ── لایسنس‌ها ── */}
                    <SectionTitle>لایسنس‌های فعال/منقضی</SectionTitle>
                    <ComingSoon note="لایسنس‌ها فعلاً از طریق سرور لایسنس مدیریت می‌شوند.">
                        <AdminTable
                            columns={LICENSE_COLUMNS}
                            rows={[]}
                            paginate={false}
                        />
                    </ComingSoon>

                    {/* ── تیکت‌ها ── */}
                    <SectionTitle>تیکت‌های کاربر</SectionTitle>
                    <AdminTable
                        columns={TICKET_COLUMNS}
                        rows={tickets.rows}
                        paginate={false}
                        emptyMessage={
                            tickets.loading
                                ? 'در حال دریافت تیکت‌ها…'
                                : tickets.unfiltered
                                  ? 'فیلتر تیکت بر اساس کاربر هنوز در بک‌اند فعال نیست'
                                  : tickets.error || 'تیکتی برای این کاربر ثبت نشده است'
                        }
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}
