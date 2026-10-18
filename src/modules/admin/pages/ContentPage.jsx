import { useCallback, useState } from 'react'
import { X, ChevronDown, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminTable from '../components/AdminTable/AdminTable'
import CmsPageForm from '../components/CmsPageForm/CmsPageForm'
import CmsVersionsModal from '../components/CmsVersionsModal/CmsVersionsModal'
import CmsPreviewModal from '../components/CmsPreviewModal/CmsPreviewModal'
import CmsBlockEditor from '../components/CmsBlockEditor/CmsBlockEditor'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import {
    useCmsPages,
    useCmsActions,
    useCmsPage,
    useCmsRedirects,
    useStructuredSchemas,
    publicUrlOf,
    versionLabel,
    withBlockTitles,
} from '../hooks/useCmsPages'
import { useEditablePages } from '../hooks/useEditablePages'
import { PAGE_KIND, PAGE_STATUS, pageState } from '../../../services/cmsService'
import styles from './ContentPage.module.css'

/* ستون‌های فهرست صفحه‌ها — فیگمایی برایش نرسیده بود، عرض‌ها متناسب
   با محتوا تنظیم شده و با جدول‌های دیگر پنل هم‌خوان است. */
const PAGE_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '6%' },
    { key: 'title', label: 'عنوان صفحه', width: '24%' },
    { key: 'address', label: 'نشانی روی سایت', width: '18%', ltr: true },
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

/* ریدایرکت فقط دو ستون معنادار دارد — از کجا به کجا. */
const REDIRECT_COLUMNS = [
    { key: 'index', label: 'ردیف', width: '10%' },
    { key: 'from', label: 'نشانی قدیمی', width: '45%', ltr: true },
    { key: 'to', label: 'نشانی جدید', width: '45%', ltr: true },
]

const TABS = [
    { id: 'pages', label: 'صفحه‌های محتوا' },
    { id: 'structured', label: 'صفحه‌های ساختاریافته' },
    { id: 'redirects', label: 'ریدایرکت‌ها' },
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
    const redirects = useCmsRedirects()
    const { schemas } = useStructuredSchemas()
    const [blockEditFor, setBlockEditFor] = useState(null)

    /* فرم یا ویرایشگری که تغییر ذخیره‌نشده دارد. عوض کردن تب آن را
       می‌بندد، پس اول پرسیده می‌شود. */
    const [dirty, setDirty] = useState(false)
    const onDirtyChange = useCallback((d) => setDirty(d), [])
    const [pendingTab, setPendingTab] = useState(null)

    /* جستجوی برچسب — با Enter یا خروج از کادر اعمال می‌شود، نه با هر
       حرف، تا برای هر حرف یک درخواست نرود. */
    const [tagInput, setTagInput] = useState('')
    const [titleInput, setTitleInput] = useState('')

    const openBlockEditor = (p) => setBlockEditFor(withBlockTitles(p, schemas))

    /* قالب‌هایی که از قبل صفحه دارند — فرم ساخت فقط بقیه را پیشنهاد می‌دهد */
    const usedSchemaKeys = editablePages.rows.map((p) => p.schema_key).filter(Boolean)

    /* فرم ویرایش به محتوای کامل نیاز دارد و فهرست آن را ندارد
       (`content_raw` و `seo` فقط در `GET /pages/{id}` هستند). */
    const editingId = form && form !== 'new' ? form : null
    const editing = useCmsPage(editingId)

    const closeForm = () => {
        setForm(null)
        setDirty(false)
        actions.clearError()
    }

    const save = async (payload, { publish = false } = {}) => {
        const ok =
            form === 'new'
                ? await actions.create(payload, { publish })
                : await actions.update(editingId, payload, { publish })

        if (ok) {
            closeForm()
            reloadAll()
            toast.success(
                publish
                    ? 'ذخیره و منتشر شد؛ روی سایت دیده می‌شود.'
                    : form === 'new'
                      ? 'صفحه ساخته شد (پیش‌نویس). برای دیده شدن منتشرش کنید.'
                      : 'ذخیره شد. برای دیده شدن روی سایت «انتشار» را بزنید.'
            )
        }
    }

    /* ⚠️ هر دو فهرست باید تازه شوند.

       صفحه‌های محتوا و صفحه‌های ساختاریافته دو هوک جدا دارند و
       یک صفحه ممکن است در هر دو باشد. قبلاً فقط `pages` تازه
       می‌شد، پس بعد از انتشار کارت ساختاریافته هنوز
       «تغییر منتشرنشده» نشان می‌داد در حالی که انتشار انجام
       شده بود — ادمین فکر می‌کرد کار نکرده. */
    const reloadBoth = () => {
        pages.reload()
        editablePages.reload()
    }

    /* تغییر نشانی صفحه ریدایرکت تازه می‌سازد */
    const reloadAll = () => {
        reloadBoth()
        redirects.reload()
    }

    const confirmPublish = async () => {
        if (await actions.publish(publishing.id)) {
            setPublishing(null)
            setSelectedId(null)
            reloadBoth()
            toast.success(`«${publishing.title}» منتشر شد.`)
        }
    }

    const confirmDelete = async () => {
        if (await actions.remove(deleting.id)) {
            setDeleting(null)
            setSelectedId(null)
            reloadBoth()
            toast.success(`«${deleting.title}» حذف شد. از «نمایش حذف‌شده‌ها» برمی‌گردد.`)
        }
    }

    const restore = async (row) => {
        if (await actions.restore(row.id)) {
            setSelectedId(null)
            reloadBoth()
            toast.success(`«${row.title}» برگردانده شد.`)
        }
    }

    const saveBlocks = async (payload, { publish = false } = {}) => {
        if (await actions.update(blockEditFor.id, payload, { publish })) {
            setBlockEditFor(null)
            setDirty(false)
            /* فهرست صفحه‌ها هم نسخه و وضعیتش عوض شده است */
            reloadBoth()
            toast.success(
                publish
                    ? 'ذخیره و منتشر شد؛ روی سایت دیده می‌شود.'
                    : 'ذخیره شد. برای دیده شدن روی سایت «انتشار» را بزنید.'
            )
        }
    }

    /* «ویرایش» صفحه‌ی ساختاریافته از جدول اصلی، ویرایشگر بلوک‌ها را
       باز می‌کند نه فرم مقاله را؛ محتوای این صفحه‌ها همان بلوک‌هاست. */
    const editStructured = (row) => {
        const p = editablePages.rows.find((x) => x.id === row.id)
        if (!p) {
            setForm(row.id)
            return
        }
        setTab('structured')
        setSelectedId(null)
        openBlockEditor(p)
    }

    const switchTab = (id) => {
        if (id === tab) return
        if (dirty) {
            setPendingTab(id)
            return
        }
        doSwitchTab(id)
    }

    const doSwitchTab = (id) => {
        setDirty(false)
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
                    schemas={schemas}
                    usedSchemaKeys={usedSchemaKeys}
                    onSubmit={save}
                    onClose={closeForm}
                    onDirtyChange={onDirtyChange}
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

            {tab === 'redirects' ? (
                <>
                    <p className={styles.note}>
                        وقتی نشانی یک صفحه عوض می‌شود، سرور خودش یک ریدایرکت
                        از نشانی قدیمی به جدید می‌سازد تا لینک‌های منتشرشده
                        نشکنند. این فهرست فقط خواندنی است — اسپک برای
                        ریدایرکت‌ها مسیر ساخت یا حذف ندارد.
                    </p>

                    {redirects.error && (
                        <p className={styles.error} role="alert">
                            {redirects.error}
                        </p>
                    )}

                    {redirects.loading ? (
                        <p className={styles.loading}>در حال دریافت…</p>
                    ) : (
                        <AdminTable
                            columns={REDIRECT_COLUMNS}
                            rows={redirects.items.map((r, i) => ({
                                id: r.id,
                                index: i + 1,
                                from: r.from_slug,
                                to: r.to_slug || '—',
                            }))}
                            paginate={false}
                            emptyMessage="ریدایرکتی ثبت نشده است"
                        />
                    )}
                </>
            ) : tab === 'structured' ? (
                blockEditFor ? (
                    <CmsBlockEditor
                        page={blockEditFor}
                        busy={actions.busy}
                        error={actions.error}
                        onSubmit={saveBlocks}
                        onDirtyChange={onDirtyChange}
                        onClose={() => {
                            setBlockEditFor(null)
                            setDirty(false)
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

                        {/* ✅ هشدار «روی سایت دیده نمی‌شود» برداشته شد:
                            `GET /cms/pages/schema/{schema_key}` آمد و صفحه‌های
                            عمومی حالا واقعاً از همین بلوک‌ها خوانده می‌شوند. */}
                        <p className={styles.note}>
                            بعد از <strong>انتشار</strong>، محتوای این بلوک‌ها
                            روی صفحه‌ی عمومی سایت دیده می‌شود. فقط ذخیره کردن
                            کافی نیست.
                        </p>

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
                                                {!p.is_public && (
                                                    <span className={`${styles.badge} ${styles.badge_private}`}>
                                                        خصوصی
                                                    </span>
                                                )}
                                            </header>

                                            {/* صفحه‌ی خصوصی حتی منتشرشده روی سایت ۴۰۴ می‌دهد */}
                                            {!p.is_public && (
                                                <p className={styles.cardWarn}>
                                                    این صفحه خصوصی است و روی سایت دیده
                                                    نمی‌شود. از «تنظیمات صفحه» عمومی‌اش کنید.
                                                </p>
                                            )}

                                            {/* ⚠️ قبلاً `/{slug}` نشان داده می‌شد که
                                                گمراه‌کننده بود: اسلاگ صفحه‌ی اصلی
                                                `home` است ولی نشانی واقعی‌اش `/` است و
                                                `/home` صفحه‌ی سفید می‌داد. */}
                                            <p className={styles.cardSlug} dir="ltr">
                                                {publicUrlOf(p) ?? `/${p.slug}`}
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
                                                    <dd>{versionLabel(p.version_counter)}</dd>
                                                </div>
                                            </dl>

                                            <div className={styles.cardActions}>
                                                {p.permissions?.can_edit &&
                                                    editableCount > 0 && (
                                                        <button
                                                            type="button"
                                                            className={styles.rowActionBtn}
                                                            onClick={() =>
                                                                openBlockEditor(p)
                                                            }
                                                        >
                                                            ویرایش بلوک‌ها
                                                        </button>
                                                    )}

                                                {/* عنوان، دسترسی (عمومی/خصوصی) و سئو */}
                                                {p.permissions?.can_edit && (
                                                    <button
                                                        type="button"
                                                        className={styles.rowActionBtn}
                                                        onClick={() => setForm(p.id)}
                                                    >
                                                        تنظیمات صفحه
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className={styles.rowActionBtn}
                                                    onClick={() => setPreviewFor(p)}
                                                >
                                                    پیش‌نمایش
                                                </button>

                                                {/* ⚠️ این دکمه نبود و دکمه‌ی انتشار
                                                    فقط در جدول صفحه‌های محتوا بود.
                                                    یعنی ادمین بلوک‌ها را ذخیره می‌کرد و
                                                    هیچ راهی برای منتشر کردنش نداشت. */}
                                                {p.permissions?.can_publish &&
                                                    (p.status !== 'PUBLISHED' ||
                                                        p.has_unpublished_changes) && (
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.rowActionPrimary
                                                            }
                                                            onClick={() =>
                                                                setPublishing({
                                                                    id: p.id,
                                                                    title: p.title,
                                                                    raw: p,
                                                                })
                                                            }
                                                        >
                                                            انتشار
                                                        </button>
                                                    )}

                                                {/* باز کردن روی سایت — فقط وقتی
                                                    واقعاً قابل دیدن است. */}
                                                {publicUrlOf(p) &&
                                                    p.status === 'PUBLISHED' &&
                                                    p.is_public && (
                                                        <a
                                                            className={styles.rowActionBtn}
                                                            href={publicUrlOf(p)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            دیدن در سایت
                                                        </a>
                                                    )}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}

                        {previewFor && (
                            <CmsPreviewModal
                                page={previewFor}
                                schemas={schemas}
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

                            <form
                                className={styles.searchWrap}
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    pages.setFilter('q', titleInput)
                                }}
                            >
                                <Search size={15} className={styles.searchIcon} aria-hidden="true" />
                                <input
                                    className={styles.searchInput}
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    onBlur={() =>
                                        titleInput !== pages.filters.q &&
                                        pages.setFilter('q', titleInput)
                                    }
                                    placeholder="جستجوی عنوان یا نشانی…"
                                    aria-label="جستجو در عنوان و نشانی صفحه‌ها"
                                />
                            </form>

                            <form
                                className={styles.searchWrap}
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    pages.setFilter('tag', tagInput)
                                }}
                            >
                                <Search size={15} className={styles.searchIcon} aria-hidden="true" />
                                <input
                                    className={styles.searchInput}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onBlur={() =>
                                        tagInput !== pages.filters.tag &&
                                        pages.setFilter('tag', tagInput)
                                    }
                                    placeholder="فیلتر برچسب…"
                                    aria-label="فیلتر بر اساس برچسب"
                                />
                            </form>

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
                                            {perms.can_edit &&
                                                (p.kind === 'STRUCTURED' ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className={styles.rowActionBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                editStructured(row)
                                                            }}
                                                        >
                                                            ویرایش بلوک‌ها
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.rowActionBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setForm(row.id)
                                                            }}
                                                        >
                                                            تنظیمات صفحه
                                                        </button>
                                                    </>
                                                ) : (
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
                                                ))}

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

                                            {/* باز کردن صفحه روی سایت — فقط
                                                وقتی واقعاً جایی قابل دیدن است:
                                                منتشرشده، عمومی، و مسیر دارد. */}
                                            {row.publicUrl &&
                                                p.status === 'PUBLISHED' &&
                                                p.is_public && (
                                                    <a
                                                        className={styles.rowActionBtn}
                                                        href={row.publicUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        دیدن در سایت
                                                    </a>
                                                )}

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
                            pages.loading
                                ? 'در حال دریافت…'
                                : pages.filters.q ||
                                    pages.filters.tag ||
                                    pages.filters.kind ||
                                    pages.filters.status ||
                                    pages.filters.is_public
                                  ? 'صفحه‌ای با این جستجو یا فیلتر پیدا نشد'
                                  : 'صفحه‌ای ساخته نشده است'
                        }
                    />

                    {versionsFor && (
                        <CmsVersionsModal
                            page={versionsFor}
                            schemas={schemas}
                            onClose={() => setVersionsFor(null)}
                            onRestored={(v) => {
                                reloadAll()
                                toast.success(
                                    `نسخه‌ی ${versionLabel(v?.version)} برگردانده شد. برای دیده شدن روی سایت دوباره منتشر کنید.`
                                )
                            }}
                        />
                    )}

                    {previewFor && (
                        <CmsPreviewModal
                            page={previewFor}
                            schemas={schemas}
                            onClose={() => setPreviewFor(null)}
                        />
                    )}

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
                        error={deleting ? actions.error : null}
                        onConfirm={confirmDelete}
                        onClose={() => {
                            setDeleting(null)
                            actions.clearError()
                        }}
                    />
                </>
            )}

            {/* ⚠️ این دیالوگ عمداً بیرون از شاخه‌ی تب‌هاست.

                قبلاً داخل شاخه‌ی «صفحه‌های محتوا» بود، پس در تب
                ساختاریافته اصلاً رندر نمی‌شد و دکمه‌ی انتشار آنجا
                ساکت بی‌اثر می‌ماند.

                انتشار به‌تنهایی کافی نیست: طبق اسپک، صفحه‌ی خصوصی
                حتی بعد از انتشار روی سایت ۴۰۴ می‌دهد. */}
            <ConfirmDialog
                open={Boolean(publishing)}
                title="انتشار صفحه"
                message={
                    publishing
                        ? publishing.raw?.is_public
                            ? `صفحه‌ی «${publishing.title}» منتشر شود؟ از این پس نسخه‌ی جاری روی سایت دیده می‌شود.`
                            : `صفحه‌ی «${publishing.title}» منتشر شود؟

⚠️ این صفحه «خصوصی» است، پس با انتشار هم روی سایت دیده نمی‌شود. برای دیده شدن، در فرم ویرایش تیک «صفحه برای همه قابل دیدن باشد» را هم بزنید.`
                        : ''
                }
                confirmLabel="منتشر کن"
                cancelLabel="انصراف"
                loading={actions.busy}
                error={publishing ? actions.error : null}
                onConfirm={confirmPublish}
                onClose={() => {
                    setPublishing(null)
                    actions.clearError()
                }}
            />

            <ConfirmDialog
                open={pendingTab !== null}
                title="تغییرات ذخیره نشده"
                message="تغییراتی که داده‌اید ذخیره نشده‌اند و با رفتن به تب دیگر از بین می‌روند. ادامه می‌دهید؟"
                confirmLabel="رفتن بدون ذخیره"
                cancelLabel="ادامه‌ی ویرایش"
                onConfirm={() => {
                    const id = pendingTab
                    setPendingTab(null)
                    doSwitchTab(id)
                }}
                onClose={() => setPendingTab(null)}
            />

        </div>
    )
}
