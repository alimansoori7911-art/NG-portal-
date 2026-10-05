import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import AdminTable from '../components/AdminTable/AdminTable'
import CmsPageForm from '../components/CmsPageForm/CmsPageForm'
import CmsVersionsModal from '../components/CmsVersionsModal/CmsVersionsModal'
import CmsPreviewModal from '../components/CmsPreviewModal/CmsPreviewModal'
import CmsBlockEditor from '../components/CmsBlockEditor/CmsBlockEditor'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useCmsPages, useCmsActions, useCmsPage } from '../hooks/useCmsPages'
import { useEditablePages } from '../hooks/useEditablePages'
import { PAGE_KIND, PAGE_STATUS, pageState } from '../../../services/cmsService'
import styles from './ContentPage.module.css'

/* ستون‌های فهرست صفحه‌ها — فیگمایی برایش نرسیده بود، عرض‌ها متناسب
   با محتوا تنظیم شده و با جدول‌های دیگر پنل هم‌خوان است. */
const PAGE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '6%' },
    { key: 'title', label: 'عنوان صفحه', width: '24%' },
    { key: 'slug', label: 'نشانی', width: '18%', ltr: true },
    { key: 'kind', label: 'نوع', width: '13%' },
    { key: 'version', label: 'نسخه', width: '8%', ltr: true },
    { key: 'visibility', label: 'دسترسی', width: '9%' },
    {
        key: 'status',
        label: 'وضعیت',
        width: '12%',
        render: (row) => (
            <span className={`${styles.badge} ${styles['badge_' + row.status.key]}`}>
                {row.status.label}
            </span>
        ),
    },
    { key: 'updatedAt', label: 'آخرین تغییر', width: '10%', ltr: true },
]

const TABS = [
    { id: 'pages', label: 'صفحه‌های محتوا' },
    { id: 'structured', label: 'صفحه‌های ساختاریافته' },
]

/**
 * مدیریت محتوا — ماژول CMS.
 *
 * «صفحه‌های محتوا» به `/admin/cms/pages` وصل است: ساخت، ویرایش،
 * انتشار، تاریخچه‌ی نسخه، پیش‌نمایش، حذف نرم و بازگردانی.
 *
 * ⚠️ حذف در این ماژول **نرم** است؛ صفحه پاک نمی‌شود و با «بازگرداندن»
 * برمی‌گردد. برای همین فیلتر «نمایش حذف‌شده‌ها» لازم است، وگرنه صفحه‌ی
 * حذف‌شده از دید ناپدید می‌شود و راهی برای برگرداندنش نیست.
 *
 * ⚠️ دکمه‌های عملیات به `permissions` خودِ صفحه گره خورده‌اند
 * (`can_edit`/`can_publish`/`can_delete`/`can_restore`) نه به نقش
 * کاربر. بک‌اند این پرچم‌ها را سرِ هر صفحه می‌دهد و مرجع همان است.
 */
export default function ContentPage() {
    const [tab, setTab] = useState('pages')
    const pages = useCmsPages()
    const actions = useCmsActions()

    /* `form` حالت فرم است: null بسته، 'new' ساخت، و یک شناسه یعنی
       ویرایش همان صفحه. */
    const [form, setForm] = useState(null)
    const [selectedId, setSelectedId] = useState(null)
    const [versionsFor, setVersionsFor] = useState(null)
    const [previewFor, setPreviewFor] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [publishing, setPublishing] = useState(null)

    /* صفحه‌های ساختاریافته — فهرست و بلوکی که در حال ویرایش است */
    const editablePages = useEditablePages()
    const [blockEditFor, setBlockEditFor] = useState(null)

    /* فرم ویرایش به محتوای کامل نیاز دارد و فهرست آن را ندارد
       (`content_raw` و `seo` فقط در `GET /pages/{id}` هستند). */
    const editingId = form && form !== 'new' ? form : null
    const editing = useCmsPage(editingId)

    const closeForm = () => {
        setForm(null)
        actions.clearError()
    }

    const save = async (payload) => {
        const ok =
            form === 'new'
                ? await actions.create(payload)
                : await actions.update(editingId, payload)

        if (ok) {
            closeForm()
            pages.reload()
        }
    }

    const confirmPublish = async () => {
        if (await actions.publish(publishing.id)) {
            setPublishing(null)
            setSelectedId(null)
            pages.reload()
        }
    }

    const confirmDelete = async () => {
        if (await actions.remove(deleting.id)) {
            setDeleting(null)
            setSelectedId(null)
            pages.reload()
        }
    }

    const restore = async (row) => {
        if (await actions.restore(row.id)) {
            setSelectedId(null)
            pages.reload()
        }
    }

    const saveBlocks = async (payload) => {
        if (await actions.update(blockEditFor.id, payload)) {
            setBlockEditFor(null)
            editablePages.reload()
            /* فهرست صفحه‌ها هم نسخه و وضعیتش عوض شده است */
            pages.reload()
        }
    }

    const switchTab = (id) => {
        setTab(id)
        setSelectedId(null)
        setForm(null)
        setVersionsFor(null)
        setPreviewFor(null)
        setDeleting(null)
        setPublishing(null)
        setBlockEditFor(null)
        actions.clearError()
    }

    const toggleRow = (row) =>
        setSelectedId((id) => (id === row.id ? null : row.id))

    /* فرم ویرایش تا رسیدن محتوا باز نمی‌شود، وگرنه فیلدها خالی
       مقدار اولیه می‌گیرند و ذخیره، متن صفحه را پاک می‌کند. */
    if (form) {
        if (editingId && editing.loading) {
            return (
                <div className={styles.page}>
                    <p className={styles.loading}>در حال دریافت صفحه…</p>
                </div>
            )
        }

        if (editingId && editing.error) {
            return (
                <div className={styles.page}>
                    <p className={styles.error} role="alert">
                        {editing.error}
                    </p>
                    <button
                        type="button"
                        className={styles.createBtn}
                        onClick={closeForm}
                    >
                        بازگشت به فهرست
                    </button>
                </div>
            )
        }

        return (
            <div className={styles.page}>
                <CmsPageForm
                    page={editingId ? editing.data : null}
                    busy={actions.busy}
                    error={actions.error}
                    onSubmit={save}
                    onClose={closeForm}
                />
            </div>
        )
    }

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

            {tab === 'structured' ? (
                blockEditFor ? (
                    <CmsBlockEditor
                        page={blockEditFor}
                        busy={actions.busy}
                        error={actions.error}
                        onSubmit={saveBlocks}
                        onClose={() => {
                            setBlockEditFor(null)
                            actions.clearError()
                        }}
                    />
                ) : (
                    <>
                        {editablePages.error && (
                            <p className={styles.error} role="alert">
                                {editablePages.error}
                            </p>
                        )}

                        <p className={styles.note}>
                            این صفحه‌ها قالب ثابت دارند: چیدمانشان سمت سایت
                            مشخص شده و فقط محتوای بلوک‌هایشان قابل تغییر است.
                            فرم ویرایش از روی همان قالبی ساخته می‌شود که
                            بک‌اند می‌دهد، پس فیلدی که سرور قبول نمی‌کند اصلاً
                            نشان داده نمی‌شود.
                        </p>

                        {editablePages.loading ? (
                            <p className={styles.loading}>در حال دریافت…</p>
                        ) : editablePages.rows.length === 0 ? (
                            <p className={styles.loading}>
                                صفحه‌ی ساختاریافته‌ای برای ویرایش ندارید.
                            </p>
                        ) : (
                            <div className={styles.cards}>
                                {editablePages.rows.map((p) => {
                                    const state = pageState(p)
                                    const blocks = p.editable_blocks ?? []
                                    const editableCount = blocks.filter(
                                        (b) => b.editable
                                    ).length

                                    return (
                                        <article key={p.id} className={styles.card}>
                                            <header className={styles.cardHead}>
                                                <h3 className={styles.cardTitle}>
                                                    {p.title}
                                                </h3>
                                                <span
                                                    className={`${styles.badge} ${
                                                        styles['badge_' + state.key]
                                                    }`}
                                                >
                                                    {state.label}
                                                </span>
                                            </header>

                                            <p className={styles.cardSlug} dir="ltr">
                                                /{p.slug}
                                            </p>

                                            <dl className={styles.cardMeta}>
                                                <div className={styles.cardMetaRow}>
                                                    <dt>بلوک‌ها</dt>
                                                    <dd>
                                                        {editableCount.toLocaleString(
                                                            'fa-IR'
                                                        )}{' '}
                                                        از{' '}
                                                        {blocks.length.toLocaleString(
                                                            'fa-IR'
                                                        )}{' '}
                                                        قابل ویرایش
                                                    </dd>
                                                </div>
                                                <div className={styles.cardMetaRow}>
                                                    <dt>نسخه</dt>
                                                    <dd dir="ltr">
                                                        v
                                                        {Number(
                                                            p.version_counter ?? 1
                                                        ).toLocaleString('fa-IR')}
                                                    </dd>
                                                </div>
                                            </dl>

                                            <div className={styles.cardActions}>
                                                {p.permissions?.can_edit &&
                                                    editableCount > 0 && (
                                                        <button
                                                            type="button"
                                                            className={styles.rowActionBtn}
                                                            onClick={() =>
                                                                setBlockEditFor(p)
                                                            }
                                                        >
                                                            ویرایش بلوک‌ها
                                                        </button>
                                                    )}

                                                <button
                                                    type="button"
                                                    className={styles.rowActionBtn}
                                                    onClick={() => setPreviewFor(p)}
                                                >
                                                    پیش‌نمایش
                                                </button>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}

                        {previewFor && (
                            <CmsPreviewModal
                                page={previewFor}
                                onClose={() => setPreviewFor(null)}
                            />
                        )}
                    </>
                )
            ) : (
                <>
                    {pages.error && (
                        <p className={styles.error} role="alert">
                            {pages.error}
                        </p>
                    )}
                    {actions.error && (
                        <p className={styles.error} role="alert">
                            {actions.error}
                        </p>
                    )}

                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={() => setForm('new')}
                        >
                            ساخت صفحه
                        </button>

                        <div className={styles.filters}>
                            <div className={styles.selectWrap}>
                                <select
                                    className={styles.filterSelect}
                                    value={pages.filters.kind}
                                    onChange={(e) =>
                                        pages.setFilter('kind', e.target.value)
                                    }
                                    aria-label="فیلتر نوع صفحه"
                                >
                                    <option value="">همه‌ی نوع‌ها</option>
                                    {Object.entries(PAGE_KIND).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className={styles.selectIcon}
                                    aria-hidden="true"
                                />
                            </div>

                            <div className={styles.selectWrap}>
                                <select
                                    className={styles.filterSelect}
                                    value={pages.filters.status}
                                    onChange={(e) =>
                                        pages.setFilter('status', e.target.value)
                                    }
                                    aria-label="فیلتر وضعیت"
                                >
                                    <option value="">همه‌ی وضعیت‌ها</option>
                                    {Object.entries(PAGE_STATUS).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className={styles.selectIcon}
                                    aria-hidden="true"
                                />
                            </div>

                            <div className={styles.selectWrap}>
                                <select
                                    className={styles.filterSelect}
                                    value={pages.filters.is_public}
                                    onChange={(e) =>
                                        pages.setFilter('is_public', e.target.value)
                                    }
                                    aria-label="فیلتر دسترسی"
                                >
                                    <option value="">عمومی و خصوصی</option>
                                    <option value="true">فقط عمومی</option>
                                    <option value="false">فقط خصوصی</option>
                                </select>
                                <ChevronDown
                                    size={16}
                                    className={styles.selectIcon}
                                    aria-hidden="true"
                                />
                            </div>

                            {/* بدون این فیلتر، صفحه‌ی حذف‌شده دیده نمی‌شود و
                                راهی برای بازگرداندنش نیست. */}
                            <label className={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={pages.filters.include_deleted}
                                    onChange={(e) =>
                                        pages.setFilter(
                                            'include_deleted',
                                            e.target.checked
                                        )
                                    }
                                />
                                <span>نمایش حذف‌شده‌ها</span>
                            </label>
                        </div>
                    </div>

                    <AdminTable
                        columns={PAGE_COLUMNS}
                        rows={pages.rows}
                        page={pages.page}
                        pageCount={pages.pageCount}
                        onPageChange={pages.setPage}
                        selectedId={selectedId}
                        onRowClick={toggleRow}
                        renderRowActions={(row) => {
                            const p = row.raw
                            const perms = p.permissions ?? {}
                            const isDeleted = Boolean(p.deleted_at)

                            return (
                                <div className={styles.rowActions}>
                                    {/* صفحه‌ی حذف‌شده فقط برمی‌گردد */}
                                    {isDeleted ? (
                                        perms.can_restore && (
                                            <button
                                                type="button"
                                                className={styles.rowActionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    restore(row)
                                                }}
                                                disabled={actions.busy}
                                            >
                                                بازگرداندن صفحه
                                            </button>
                                        )
                                    ) : (
                                        <>
                                            {perms.can_edit && (
                                                <button
                                                    type="button"
                                                    className={styles.rowActionBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setForm(row.id)
                                                    }}
                                                >
                                                    ویرایش
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className={styles.rowActionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setPreviewFor(p)
                                                }}
                                            >
                                                پیش‌نمایش
                                            </button>

                                            <button
                                                type="button"
                                                className={styles.rowActionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setVersionsFor(p)
                                                }}
                                            >
                                                تاریخچه
                                            </button>

                                            {/* انتشار فقط وقتی معنا دارد که
                                                صفحه پیش‌نویس باشد یا تغییر
                                                منتشرنشده داشته باشد. */}
                                            {perms.can_publish &&
                                                (p.status !== 'PUBLISHED' ||
                                                    p.has_unpublished_changes) && (
                                                    <button
                                                        type="button"
                                                        className={styles.rowActionPrimary}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setPublishing(row)
                                                        }}
                                                    >
                                                        انتشار
                                                    </button>
                                                )}

                                            {perms.can_delete && (
                                                <button
                                                    type="button"
                                                    className={styles.rowActionDanger}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDeleting(row)
                                                    }}
                                                >
                                                    حذف
                                                </button>
                                            )}
                                        </>
                                    )}

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
                        }}
                        emptyMessage={
                            pages.loading ? 'در حال دریافت…' : 'صفحه‌ای ساخته نشده است'
                        }
                    />

                    {versionsFor && (
                        <CmsVersionsModal
                            page={versionsFor}
                            onClose={() => setVersionsFor(null)}
                            onRestored={pages.reload}
                        />
                    )}

                    {previewFor && (
                        <CmsPreviewModal
                            page={previewFor}
                            onClose={() => setPreviewFor(null)}
                        />
                    )}

                    <ConfirmDialog
                        open={Boolean(publishing)}
                        title="انتشار صفحه"
                        message={
                            publishing
                                ? `صفحه‌ی «${publishing.title}» منتشر شود؟ از این پس نسخه‌ی جاری روی سایت دیده می‌شود.`
                                : ''
                        }
                        confirmLabel="منتشر کن"
                        cancelLabel="انصراف"
                        loading={actions.busy}
                        onConfirm={confirmPublish}
                        onClose={() => setPublishing(null)}
                    />

                    <ConfirmDialog
                        open={Boolean(deleting)}
                        title="حذف صفحه"
                        message={
                            deleting
                                ? `صفحه‌ی «${deleting.title}» حذف شود؟ حذف برگشت‌پذیر است و با «نمایش حذف‌شده‌ها» می‌توانید بازش گردانید.`
                                : ''
                        }
                        confirmLabel="حذف کن"
                        cancelLabel="انصراف"
                        loading={actions.busy}
                        onConfirm={confirmDelete}
                        onClose={() => setDeleting(null)}
                    />
                </>
            )}
        </div>
    )
}
