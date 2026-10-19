import { useState } from 'react'
import AdminTable from '../components/AdminTable/AdminTable'
import SendNotificationForm from '../components/SendNotificationForm/SendNotificationForm'
import TemplateForm from '../components/TemplateForm/TemplateForm'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import {
    useNotificationTemplates,
    useTemplateActions,
} from '../hooks/useNotificationTemplates'
import styles from './SettingsPage.module.css'

/* عرض ستون‌ها از tab1.svg (نوتیفیکیشن) */
const NOTIFICATION_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '18.22%' },
    { key: 'title', label: 'عنوان', width: '29.60%' },
    { key: 'channel', label: 'کانال', width: '30.92%', ltr: true },
    { key: 'publishedAt', label: 'تاریخ انتشار', width: '21.26%', ltr: true },
]

/**
 * ابزارها و تنظیمات سیستم — ارسال اعلان و مدیریت قالب‌های اعلان.
 *
 * تب «ریلیز نوت‌ها» حذف شد چون بک‌اند برایش اندپوینتی ندارد.
 * نسخه‌های محصول همچنان در «محصولات و کاتالوگ» مدیریت می‌شوند.
 */
export default function SettingsPage() {
    const [creating, setCreating] = useState(false)

    /* مدیریت قالب — `templateForm` حالت فرم است:
       null بسته، 'new' ساخت، و یک شیء یعنی ویرایش همان قالب. */
    const [templateForm, setTemplateForm] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [selectedId, setSelectedId] = useState(null)

    const templates = useNotificationTemplates()
    const templateActions = useTemplateActions()

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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h2 className={styles.sectionTitle}>ارسال نوتیفیکیشن / پیام</h2>
            </div>

            {templateForm ? (
                <TemplateForm
                    template={templateForm === 'new' ? null : templateForm}
                    busy={templateActions.busy}
                    error={templateActions.error}
                    onSubmit={saveTemplate}
                    onClose={closeTemplateForm}
                />
            ) : creating ? (
                <SendNotificationForm
                    templates={templates.rows}
                    onSent={() => {
                        setCreating(false)
                        templates.reload()
                    }}
                    onClose={() => setCreating(false)}
                />
            ) : (
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
                        error={templateActions.error}
                        onConfirm={confirmDelete}
                        onClose={() => {
                            setDeleting(null)
                            templateActions.clearError()
                        }}
                    />
                </>
            )}
        </div>
    )
}
