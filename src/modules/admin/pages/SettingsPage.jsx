import { useState } from 'react'
import AdminTable from '../components/AdminTable/AdminTable'
import SystemAlertList from '../components/SystemAlertList/SystemAlertList'
import ContentForm from '../components/ContentForm/ContentForm'
import SendNotificationForm from '../components/SendNotificationForm/SendNotificationForm'
import { useNotificationTemplates } from '../hooks/useNotificationTemplates'
import ComingSoon from '../../../components/ui/ComingSoon/ComingSoon'
import styles from './SettingsPage.module.css'

/* عرض ستون‌ها از tab1.svg (نوتیفیکیشن) */
const NOTIFICATION_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '18.22%' },
    { key: 'title', label: 'عنوان', width: '29.60%' },
    { key: 'channel', label: 'کانال', width: '30.92%', ltr: true },
    { key: 'publishedAt', label: 'تاریخ انتشار', width: '21.26%', ltr: true },
]

/* عرض ستون‌ها از tab3.svg (ریلیز نوت) */
const RELEASE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '18.01%' },
    { key: 'title', label: 'عنوان', width: '29.86%' },
    { key: 'status', label: 'وضعیت', width: '31.12%' },
    { key: 'publishedAt', label: 'تاریخ انتشار', width: '21.00%', ltr: true },
]

const TABS = [
    { id: 'notifications', label: 'ارسال نوتیفیکیشن / پیام' },
    { id: 'alerts', label: 'اعلان‌های سیستمی' },
    { id: 'releases', label: 'ریلیز نوت‌ها (Release Notes)' },
]

/* دکمه‌های فرم ریلیز نوت — از SVG */
const RELEASE_ACTIONS = [
    { id: 'upload', label: 'بارگذاری عکس' },
    { id: 'publish', label: 'انتشار Release Note' },
    { id: 'save', label: 'ذخیره Release Note' },
]

/**
 * ابزارها و تنظیمات سیستم — سه تب.
 *
 * تب نوتیفیکیشن به بک‌اند وصل است (قالب‌ها + ارسال).
 * TODO: اعلان‌های سیستمی و ریلیز نوت اندپوینت ندارند.
 */
export default function SettingsPage() {
    const [tab, setTab] = useState('notifications')
    const [page, setPage] = useState(1)
    const [creating, setCreating] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const templates = useNotificationTemplates()

    const switchTab = (id) => {
        setTab(id)
        setPage(1)
        setCreating(false)
        setFieldErrors({})
    }

    const isNotifications = tab === 'notifications'
    const isReleases = tab === 'releases'

    const handleSubmit = (values) => {
        /* ریلیز نوت هنوز اندپوینت ندارد؛ فقط اعتبارسنجی خالی نبودن. */
        if (!values.subject.trim()) {
            setFieldErrors({ subject: 'متن الزامی است' })
            return
        }
        setFieldErrors({})
        setCreating(false)
    }

    const clearFieldError = (key) =>
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })

    return (
        <div className={styles.page}>
            <div className={styles.tabs}>
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
                        onClick={() => switchTab(id)}
                        aria-current={tab === id ? 'true' : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* تب اعلان‌های سیستمی فرم و جدول ندارد — فقط فهرست کارت‌ها */}
            {tab === 'alerts' ? (
                /* اعلان‌های سیستمی از خود سیستم می‌آیند و هنوز
                   اندپوینتی ندارند — فهرست خالی زیر پوشش. */
                <ComingSoon note="اعلان‌های سیستمی در فاز توسعه اضافه می‌شوند.">
                    <SystemAlertList items={[]} />
                </ComingSoon>
            ) : creating ? (
                isNotifications ? (
                    <SendNotificationForm
                        templates={templates.rows}
                        onSent={() => {
                            setCreating(false)
                            templates.reload()
                        }}
                        onClose={() => setCreating(false)}
                    />
                ) : (
                    <ContentForm
                        title="ایجاد Release Notes"
                        actions={RELEASE_ACTIONS}
                        fieldErrors={fieldErrors}
                        onSubmit={handleSubmit}
                        onFieldChange={clearFieldError}
                        onClose={() => {
                            setCreating(false)
                            setFieldErrors({})
                        }}
                    />
                )
            ) : isReleases ? (
                <ComingSoon note="ریلیز نوت در فاز توسعه اضافه می‌شود.">
                    <div className={styles.toolbar}>
                        <button type="button" className={styles.createBtn}>
                            ساخت Release Notes
                        </button>
                    </div>
                    <AdminTable
                        columns={RELEASE_COLUMNS}
                        rows={[]}
                        page={1}
                        rowsPerPage={9}
                    />
                </ComingSoon>
            ) : (
                <>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={() => setCreating(true)}
                        >
                            {isNotifications ? 'فرم ارسال نوتیفیکیشن' : 'ساخت Release Notes'}
                        </button>
                    </div>

                    <AdminTable
                        columns={isReleases ? RELEASE_COLUMNS : NOTIFICATION_COLUMNS}
                        rows={isReleases ? [] : templates.rows}
                        page={isReleases ? page : templates.page}
                        pageCount={isReleases ? undefined : templates.pageCount}
                        onPageChange={isReleases ? setPage : templates.setPage}
                        rowsPerPage={9}
                        emptyMessage={
                            isReleases
                                ? undefined
                                : templates.loading
                                  ? 'در حال دریافت قالب‌ها…'
                                  : templates.error || 'قالبی تعریف نشده است'
                        }
                    />
                </>
            )}
        </div>
    )
}
