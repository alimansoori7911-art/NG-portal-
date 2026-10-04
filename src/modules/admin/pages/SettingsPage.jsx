import { useState } from 'react'
import AdminTable from '../components/AdminTable/AdminTable'
import SystemAlertList from '../components/SystemAlertList/SystemAlertList'
import ContentForm from '../components/ContentForm/ContentForm'
import SendNotificationForm from '../components/SendNotificationForm/SendNotificationForm'
import TemplateForm from '../components/TemplateForm/TemplateForm'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import {
    useNotificationTemplates,
    useTemplateActions,
} from '../hooks/useNotificationTemplates'
import { useReleaseNotes } from '../hooks/useReleaseNotes'
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
 *
 * تب ریلیز نوت از اسپک ۱۷ وصل شد: نسخه‌های محصول
 * (`GET /admin/products/{id}/versions`). فقط خواندنی است چون فرم ساخت
 * نسخه در فیگما طراحی نشده.
 *
 * TODO: اعلان‌های سیستمی هنوز اندپوینت ندارد — از خود سیستم می‌آید و
 *       در اسپک هیچ مسیری برایش نیست.
 */
export default function SettingsPage() {
    const [tab, setTab] = useState('notifications')
    const [creating, setCreating] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    /* مدیریت قالب — `templateForm` حالت فرم است:
       null بسته، 'new' ساخت، و یک شیء یعنی ویرایش همان قالب. */
    const [templateForm, setTemplateForm] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [selectedId, setSelectedId] = useState(null)

    const templates = useNotificationTemplates()
    const templateActions = useTemplateActions()

    const switchTab = (id) => {
        setTab(id)
        setCreating(false)
        setFieldErrors({})
        setTemplateForm(null)
        setDeleting(null)
        setSelectedId(null)
    }

    const closeTemplateForm = () => {
        setTemplateForm(null)
        templateActions.clearError()
    }

    const saveTemplate = async (payload) => {
        const ok =
            templateForm === 'new'
                ? await templateActions.create(payload)
                : await templateActions.update(templateForm.id, payload)

        if (ok) {
            closeTemplateForm()
            templates.reload()
        }
    }

    const confirmDelete = async () => {
        const ok = await templateActions.remove(deleting.id)
        if (ok) {
            setDeleting(null)
            setSelectedId(null)
            templates.reload()
        }
    }

    const isNotifications = tab === 'notifications'
    const isReleases = tab === 'releases'

    /* فقط وقتی تب ریلیز باز است درخواست می‌رود */
    const releases = useReleaseNotes(isReleases)

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
            ) : templateForm ? (
                <TemplateForm
                    template={templateForm === 'new' ? null : templateForm}
                    busy={templateActions.busy}
                    error={templateActions.error}
                    onSubmit={saveTemplate}
                    onClose={closeTemplateForm}
                />
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
                /* ریلیز نوت = نسخه‌های محصول
                   (`GET /admin/products/{id}/versions`). پوشش «به‌زودی»
                   برداشته شد چون داده‌ی واقعی دارد.

                   ⚠️ دکمه‌ی «ساخت» نیست: `POST` نسخه وجود دارد ولی
                   فرمش در فیگما طراحی نشده. تا آن‌موقع این صفحه فقط
                   نمایشی است. */
                <AdminTable
                    columns={RELEASE_COLUMNS}
                    rows={releases.rows}
                    page={1}
                    rowsPerPage={9}
                    emptyMessage={
                        releases.loading
                            ? 'در حال دریافت ریلیز نوت‌ها…'
                            : releases.error || 'نسخه‌ای ثبت نشده است'
                    }
                />
            ) : (
                /* فقط تب نوتیفیکیشن به اینجا می‌رسد: ریلیز و اعلان
                   سیستمی بالاتر برگردانده می‌شوند، پس شرط‌های
                   `isReleases` که قبلاً اینجا بود حذف شد. */
                <>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={() => setCreating(true)}
                        >
                            فرم ارسال نوتیفیکیشن
                        </button>

                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={() => setTemplateForm('new')}
                        >
                            ساخت قالب
                        </button>
                    </div>

                    <AdminTable
                        columns={NOTIFICATION_COLUMNS}
                        rows={templates.rows}
                        page={templates.page}
                        pageCount={templates.pageCount}
                        onPageChange={templates.setPage}
                        rowsPerPage={9}
                        selectedId={selectedId}
                        onRowClick={(row) =>
                            setSelectedId((id) => (id === row.id ? null : row.id))
                        }
                        renderRowActions={(row) => (
                            <div className={styles.rowActions}>
                                <button
                                    type="button"
                                    className={styles.rowActionBtn}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setTemplateForm(row.raw)
                                    }}
                                >
                                    ویرایش قالب
                                </button>

                                <button
                                    type="button"
                                    className={styles.rowActionDanger}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleting(row)
                                    }}
                                >
                                    حذف قالب
                                </button>
                            </div>
                        )}
                        emptyMessage={
                            templates.loading
                                ? 'در حال دریافت قالب‌ها…'
                                : templates.error || 'قالبی تعریف نشده است'
                        }
                    />

                    <ConfirmDialog
                        open={Boolean(deleting)}
                        title="حذف قالب اعلان"
                        message={
                            deleting
                                ? `قالب «${deleting.title}» حذف شود؟ اعلان‌هایی که با این قالب ساخته شده‌اند دست‌نخورده می‌مانند.`
                                : ''
                        }
                        confirmLabel="حذف"
                        cancelLabel="انصراف"
                        loading={templateActions.busy}
                        onConfirm={confirmDelete}
                        onClose={() => setDeleting(null)}
                    />
                </>
            )}
        </div>
    )
}
