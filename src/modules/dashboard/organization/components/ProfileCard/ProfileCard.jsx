import { BadgeCheck, ShieldAlert, UserRound } from 'lucide-react'
import { getDisplayName, getIdentifier } from '../../../../../store/authStore'
import { formatJalaliDateTime } from '../../../../../utils/datetime'
import styles from './ProfileCard.module.css'

/* شناسه‌ها در Profile شیء‌اند: { value, is_verified, status, ... }
   پس علاوه بر مقدار، وضعیت تأییدشان هم قابل نمایش است. */
function IdentifierRow({ label, identifier }) {
    if (!identifier?.value) return null

    return (
        <div className={styles.row}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value} dir="ltr">
                {identifier.value}
                {identifier.is_verified && (
                    <BadgeCheck
                        size={16}
                        className={styles.verifiedIcon}
                        aria-label="تأیید شده"
                    />
                )}
            </span>
        </div>
    )
}

function TextRow({ label, value }) {
    if (!value) return null
    return (
        <div className={styles.row}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
        </div>
    )
}

/**
 * نمایش اطلاعات پروفایل — خروجی `GET /auth/me`.
 *
 * فقط خواندنی است چون اندپوینت ویرایش پروفایل وجود ندارد. تنها راه
 * نوشتن، فرم تأیید هویت است (`POST /auth/contact/verify`) که وقتی
 * `is_verified` نباشد در همین صفحه نمایش داده می‌شود.
 *
 * فیلدهای تهی اصلاً رندر نمی‌شوند تا کاربری که هنوز هویتش را تکمیل
 * نکرده، فهرستی از خط تیره نبیند.
 */
export default function ProfileCard({ user }) {
    const displayName = getDisplayName(user)
    const { date: birthDate } = formatJalaliDateTime(user?.birth_date)

    /* getIdentifier شکل قدیمی را هم می‌فهمد، ولی برای نمایش نشان
       «تأیید شده» به خود شیء نیاز داریم. اگر بک‌اند هنوز شکل قدیمی
       می‌دهد، مقدار را در یک شیء هم‌شکل می‌پیچیم. */
    const asIdentifier = (key) => {
        if (user?.[key]?.value) return user[key]
        const legacy = getIdentifier(user, key)
        return legacy ? { value: legacy, is_verified: false } : null
    }

    return (
        <section className={styles.card}>
            <header className={styles.header}>
                <span className={styles.avatar}>
                    <UserRound size={26} />
                </span>

                <div className={styles.headerText}>
                    <h2 className={styles.name}>{displayName || 'کاربر پرتال'}</h2>

                    {user?.is_verified ? (
                        <span className={`${styles.badge} ${styles.badgeVerified}`}>
                            <BadgeCheck size={14} />
                            هویت تأیید شده
                        </span>
                    ) : (
                        <span className={`${styles.badge} ${styles.badgePending}`}>
                            <ShieldAlert size={14} />
                            هویت تأیید نشده
                        </span>
                    )}
                </div>
            </header>

            <dl className={styles.list}>
                <IdentifierRow label="نام کاربری" identifier={asIdentifier('username')} />
                <IdentifierRow label="ایمیل" identifier={asIdentifier('email')} />
                <IdentifierRow label="شماره تماس" identifier={asIdentifier('phone')} />
                <IdentifierRow label="تلفن ثابت" identifier={asIdentifier('landline')} />

                <TextRow label="تاریخ تولد" value={birthDate} />
                <TextRow label="نام شرکت" value={user?.company_name} />
                <TextRow label="شناسه شرکت" value={user?.company_id} />
                <TextRow label="سمت" value={user?.position} />
                <TextRow label="آدرس شرکت" value={user?.company_address} />
            </dl>
        </section>
    )
}
