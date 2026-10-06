import { useState } from 'react'
import PlanCard from '../components/PlanCard/PlanCard'
import PlanForm from '../components/PlanForm/PlanForm'
import BillingTermForm from '../components/BillingTermForm/BillingTermForm'
import CatalogEntityForm from '../components/CatalogEntityForm/CatalogEntityForm'
import CatalogEntityList from '../components/CatalogEntityList/CatalogEntityList'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useCatalog } from '../hooks/useCatalog'
import {
    useProductCatalog,
    useProductVersions,
    useCatalogActions,
} from '../hooks/useProductCatalog'
import { buildPlanCode } from '../utils/planCode'
import styles from './CatalogPage.module.css'

/* تب دوم اضافه شد چون «مدت اعتبار» فقط خوانده می‌شد: فرم پلن
   گزینه‌هایش را از این لیست می‌گرفت ولی هیچ راهی برای ساختنش نبود. */
const TABS = [
    { id: 'plans', label: 'پلن‌ها' },
    { id: 'products', label: 'محصولات' },
    { id: 'categories', label: 'دسته‌بندی‌ها' },
    { id: 'features', label: 'ویژگی‌ها' },
    { id: 'terms', label: 'مدت‌های اعتبار' },
]

/**
 * محصولات و کاتالوگ — شبکه‌ی کارت پلن‌ها و فرم ساخت/ویرایش.
 *
 * وصل به /admin/plans و زیرمجموعه‌هایش. منطق نگاشت داده و ترتیب
 * درخواست‌ها در useCatalog است تا این فایل فقط نمایش بماند.
 */
export default function CatalogPage() {
    const {
        plans,
        features,
        terms,
        loading,
        error,
        saving,
        saveError,
        clearSaveError,
        termName,
        savePlan,
        deletePlan,
        saveTerm,
        deleteTerm,
    } = useCatalog()

    const [tab, setTab] = useState('plans')

    /* ── کاتالوگ پایه: محصول، دسته‌بندی، ویژگی، نسخه ──

       این چهار موجودیت اندپوینت کامل داشتند ولی هیچ صفحه‌ای نداشتند،
       یعنی محصول فقط از دیتابیس ساخته می‌شد. */
    const catalog = useProductCatalog()
    const catalogActions = useCatalogActions()

    /* `entityForm` حالت فرم است: null بسته، یا { kind, entity } */
    const [entityForm, setEntityForm] = useState(null)
    const [entityDelete, setEntityDelete] = useState(null)
    /* محصولی که تب نسخه‌هایش باز است */
    const [versionsOf, setVersionsOf] = useState(null)
    const versions = useProductVersions(versionsOf?.id)

    const closeEntityForm = () => {
        setEntityForm(null)
        catalogActions.clearError()
    }

    const saveEntity = async (payload) => {
        const { kind, entity } = entityForm
        const id = entity?.id
        let okRes = null

        if (kind === 'product') {
            okRes = id
                ? await catalogActions.updateProduct(id, payload)
                : await catalogActions.createProduct(payload)
        } else if (kind === 'category') {
            okRes = id
                ? await catalogActions.updateCategory(id, payload)
                : await catalogActions.createCategory(payload)
        } else if (kind === 'feature') {
            okRes = id
                ? await catalogActions.updateFeature(id, payload)
                : await catalogActions.createFeature(payload)
        } else if (kind === 'version') {
            okRes = id
                ? await catalogActions.updateVersion(id, payload)
                : await catalogActions.createVersion(versionsOf.id, payload)
        }

        if (!okRes) return
        closeEntityForm()
        if (kind === 'version') versions.reload()
        else catalog.reload()
    }

    const confirmEntityDelete = async () => {
        const { kind, entity } = entityDelete
        const fn = {
            product: catalogActions.deleteProduct,
            category: catalogActions.deleteCategory,
            feature: catalogActions.deleteFeature,
            version: catalogActions.deleteVersion,
        }[kind]

        if (!(await fn(entity.id))) return
        setEntityDelete(null)
        if (kind === 'version') versions.reload()
        else catalog.reload()
    }

    /* برچسب و پیام حذف بسته به نوع فرق می‌کند */
    const DELETE_COPY = {
        product: (e) =>
            `محصول «${e.name}» حذف شود؟ نسخه‌های ثبت‌شده‌اش هم حذف می‌شوند.`,
        category: (e) =>
            `دسته‌ی «${e.title}» حذف شود؟ اگر محصولی در آن باشد حذف نمی‌شود.`,
        feature: (e) => `ویژگی «${e.name}» حذف شود؟`,
        version: (e) => `نسخه‌ی «${e.version}» حذف شود؟`,
    }

    /* null = نمای شبکه | 'new' = فرم ساخت | شیء پلن = فرم ویرایش */
    const [editing, setEditing] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)

    /* همان الگو برای مدت اعتبار، ولی جدا نگه داشته می‌شود تا باز
       بودن یک فرم روی تب دیگر اثر نگذارد. */
    const [editingTerm, setEditingTerm] = useState(null)
    const [pendingTermDelete, setPendingTermDelete] = useState(null)

    const switchTab = (id) => {
        setTab(id)
        clearSaveError()
        setEditing(null)
        setEditingTerm(null)
    }

    const handleTermSubmit = async (values) => {
        const ok = await saveTerm(values, { editing: editingTerm })
        if (ok) setEditingTerm(null)
    }

    const confirmTermDelete = async () => {
        const ok = await deleteTerm(pendingTermDelete.id)
        if (ok) setPendingTermDelete(null)
    }

    const openCreate = () => {
        clearSaveError()
        setEditing('new')
    }

    const openEdit = (plan) => {
        clearSaveError()
        setEditing(plan)
    }

    const closeForm = () => {
        clearSaveError()
        setEditing(null)
    }

    /* مقادیر قابلیت‌ها در کارت آرایه‌اند ولی فرم شیء می‌خواهد */
    const toFormValues = (plan) =>
        plan === 'new'
            ? null
            : {
                  ...plan,
                  features: Object.fromEntries(
                      (plan.features ?? []).map((f) => [f.key, f.value])
                  ),
              }

    const handleSubmit = async (values) => {
        /* code در CreatePlan اجباری است ولی فیگما آن را نمی‌پرسد، پس
           از external_plan_code ساخته می‌شود (با پسوند تصادفی تا با
           پلن‌های هم‌نام تداخل نکند). */
        const ok = await savePlan(values, {
            code: buildPlanCode(values),
            editing,
        })
        if (ok) closeForm()
    }

    const confirmDelete = async () => {
        const ok = await deletePlan(pendingDelete.id)
        if (ok) setPendingDelete(null)
    }

    return (
        <div className={styles.page}>
            <div className={styles.tabs}>
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={tab === id ? styles.tabActive : styles.tab}
                        onClick={() => switchTab(id)}
                        aria-current={tab === id ? 'true' : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── محصول، دسته‌بندی، ویژگی ──
                فرم هر سه یکی است و با `kind` شکلش را عوض می‌کند. */}
            {entityForm ? (
                <CatalogEntityForm
                    kind={entityForm.kind}
                    entity={entityForm.entity}
                    categories={catalog.categories}
                    busy={catalogActions.busy}
                    error={catalogActions.error}
                    onSubmit={saveEntity}
                    onClose={closeEntityForm}
                />
            ) : versionsOf ? (
                <>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={() => setVersionsOf(null)}
                        >
                            بازگشت به محصولات
                        </button>
                    </div>

                    {versions.error && (
                        <p className={styles.state} role="alert">
                            {versions.error}
                        </p>
                    )}

                    <CatalogEntityList
                        rows={versions.items.map((v) => ({
                            id: v.id,
                            code: v.version,
                            title: `نسخه‌ی ${v.version}`,
                            description: v.changelog,
                            tags: [
                                v.is_release ? 'نهایی' : 'آزمایشی',
                                ...(v.release_date ? [v.release_date] : []),
                            ],
                            inactive: !v.is_release,
                            raw: v,
                        }))}
                        loading={versions.loading}
                        emptyMessage={`برای «${versionsOf.name}» نسخه‌ای ثبت نشده است`}
                        createLabel="ثبت نسخه"
                        onCreate={() => setEntityForm({ kind: 'version', entity: null })}
                        onEdit={(row) =>
                            setEntityForm({ kind: 'version', entity: row.raw })
                        }
                        onDelete={(row) =>
                            setEntityDelete({ kind: 'version', entity: row.raw })
                        }
                    />
                </>
            ) : tab === 'products' ? (
                <>
                    {catalog.error && (
                        <p className={styles.state} role="alert">
                            {catalog.error}
                        </p>
                    )}
                    {catalogActions.error && (
                        <p className={styles.error} role="alert">
                            {catalogActions.error}
                        </p>
                    )}

                    <CatalogEntityList
                        rows={catalog.products.map((p) => ({
                            id: p.id,
                            code: p.code,
                            title: p.name,
                            description: p.description,
                            tags: [
                                ...(p.category?.title ? [p.category.title] : []),
                                ...(p.is_public ? [] : ['خصوصی']),
                            ],
                            inactive: !p.is_active,
                            raw: p,
                        }))}
                        loading={catalog.loading}
                        emptyMessage="محصولی ساخته نشده است"
                        createLabel="ساخت محصول"
                        onCreate={() => setEntityForm({ kind: 'product', entity: null })}
                        onEdit={(row) =>
                            setEntityForm({ kind: 'product', entity: row.raw })
                        }
                        onDelete={(row) =>
                            setEntityDelete({ kind: 'product', entity: row.raw })
                        }
                        extraAction={{
                            label: (row) =>
                                `نسخه‌ها (${(row.raw.versions?.length ?? 0).toLocaleString('fa-IR')})`,
                            onClick: (row) => setVersionsOf(row.raw),
                        }}
                    />
                </>
            ) : tab === 'categories' ? (
                <>
                    {catalogActions.error && (
                        <p className={styles.error} role="alert">
                            {catalogActions.error}
                        </p>
                    )}

                    <CatalogEntityList
                        rows={catalog.categories.map((c) => ({
                            id: c.id,
                            code: c.code,
                            title: c.title,
                            description: c.description,
                            inactive: !c.is_active,
                            raw: c,
                        }))}
                        loading={catalog.loading}
                        emptyMessage="دسته‌بندی‌ای ساخته نشده است"
                        createLabel="ساخت دسته‌بندی"
                        onCreate={() => setEntityForm({ kind: 'category', entity: null })}
                        onEdit={(row) =>
                            setEntityForm({ kind: 'category', entity: row.raw })
                        }
                        onDelete={(row) =>
                            setEntityDelete({ kind: 'category', entity: row.raw })
                        }
                    />
                </>
            ) : tab === 'features' ? (
                <>
                    {catalogActions.error && (
                        <p className={styles.error} role="alert">
                            {catalogActions.error}
                        </p>
                    )}

                    <CatalogEntityList
                        rows={catalog.features.map((f) => ({
                            id: f.id,
                            code: f.code,
                            title: f.name,
                            description: f.description,
                            tags: [f.value_type],
                            inactive: !f.is_active,
                            raw: f,
                        }))}
                        loading={catalog.loading}
                        emptyMessage="ویژگی‌ای ساخته نشده است"
                        createLabel="ساخت ویژگی"
                        onCreate={() => setEntityForm({ kind: 'feature', entity: null })}
                        onEdit={(row) =>
                            setEntityForm({ kind: 'feature', entity: row.raw })
                        }
                        onDelete={(row) =>
                            setEntityDelete({ kind: 'feature', entity: row.raw })
                        }
                    />
                </>
            ) : tab === 'terms' ? (
                editingTerm ? (
                    <BillingTermForm
                        initialValues={editingTerm === 'new' ? null : editingTerm}
                        saving={saving}
                        error={saveError}
                        onSubmit={handleTermSubmit}
                        onClose={() => {
                            clearSaveError()
                            setEditingTerm(null)
                        }}
                    />
                ) : (
                    <>
                        <div className={styles.toolbar}>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={() => {
                                    clearSaveError()
                                    setEditingTerm('new')
                                }}
                                disabled={loading}
                            >
                                ایجاد مدت اعتبار
                            </button>
                        </div>

                        {saveError && (
                            <p className={styles.error} role="alert">
                                {saveError}
                            </p>
                        )}

                        {loading && (
                            <p className={styles.state}>در حال دریافت مدت‌ها…</p>
                        )}

                        {!loading && error && (
                            <p className={styles.state} role="alert">
                                {error}
                            </p>
                        )}

                        {!loading && !error && terms.length === 0 && (
                            <p className={styles.state}>
                                هنوز مدت اعتباری ساخته نشده است. بدون آن، پلن
                                قیمت نمی‌گیرد.
                            </p>
                        )}

                        <ul className={styles.termList}>
                            {terms.map((t) => (
                                <li key={t.id} className={styles.termRow}>
                                    <div className={styles.termInfo}>
                                        <span className={styles.termName}>
                                            {t.name}
                                        </span>
                                        <span className={styles.termCode} dir="ltr">
                                            {t.code}
                                        </span>
                                    </div>

                                    <div className={styles.termMeta}>
                                        <span>
                                            {t.duration_days == null
                                                ? 'بی‌نهایت'
                                                : `${t.duration_days} روز`}
                                        </span>
                                        {t.is_trial && (
                                            <span className={styles.termTag}>
                                                آزمایشی
                                            </span>
                                        )}
                                        {t.is_active === false && (
                                            <span className={styles.termTagOff}>
                                                غیرفعال
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.termActions}>
                                        <button
                                            type="button"
                                            className={styles.termBtn}
                                            onClick={() => {
                                                clearSaveError()
                                                setEditingTerm(t)
                                            }}
                                        >
                                            ویرایش
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.termBtn}
                                            onClick={() => setPendingTermDelete(t)}
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )
            ) : editing ? (
                <>
                    {saveError && (
                        <p className={styles.error} role="alert">
                            {saveError}
                        </p>
                    )}
                    <PlanForm
                        initialValues={toFormValues(editing)}
                        featureList={features}
                        termList={terms}
                        saving={saving}
                        onSubmit={handleSubmit}
                        onClose={closeForm}
                    />
                </>
            ) : (
                <>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={openCreate}
                            disabled={loading}
                        >
                            ایجاد پلن
                        </button>
                    </div>

                    {saveError && (
                        <p className={styles.error} role="alert">
                            {saveError}
                        </p>
                    )}

                    {loading && <p className={styles.state}>در حال دریافت پلن‌ها…</p>}

                    {!loading && error && (
                        <p className={styles.state} role="alert">
                            {error}
                        </p>
                    )}

                    {!loading && !error && plans.length === 0 && (
                        <p className={styles.state}>هنوز پلنی ساخته نشده است.</p>
                    )}

                    <div className={styles.grid}>
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                termLabel={termName(plan.term_code)}
                                onEdit={openEdit}
                                onDelete={setPendingDelete}
                            />
                        ))}
                    </div>
                </>
            )}

            <ConfirmDialog
                open={Boolean(entityDelete)}
                title="حذف از کاتالوگ"
                message={
                    entityDelete
                        ? DELETE_COPY[entityDelete.kind](entityDelete.entity)
                        : ''
                }
                confirmLabel="حذف کن"
                cancelLabel="انصراف"
                loading={catalogActions.busy}
                onConfirm={confirmEntityDelete}
                onClose={() => setEntityDelete(null)}
            />

            <ConfirmDialog
                open={pendingDelete !== null}
                title="حذف پلن"
                message={`پلن «${pendingDelete?.name ?? ''}» حذف می‌شود. این کار برگشت‌پذیر نیست. ادامه می‌دهید؟`}
                confirmLabel="حذف پلن"
                cancelLabel="انصراف"
                onConfirm={confirmDelete}
                onClose={() => setPendingDelete(null)}
            />

            {/* هشدار درباره‌ی قیمت‌ها عمدی است: حذف مدت، قیمت‌هایی را
                که با این کد ساخته شده‌اند بی‌مرجع می‌کند. */}
            <ConfirmDialog
                open={pendingTermDelete !== null}
                title="حذف مدت اعتبار"
                message={`مدت «${pendingTermDelete?.name ?? ''}» حذف می‌شود. قیمت‌هایی که از این مدت استفاده می‌کنند بی‌اعتبار خواهند شد. ادامه می‌دهید؟`}
                confirmLabel="حذف مدت"
                cancelLabel="انصراف"
                onConfirm={confirmTermDelete}
                onClose={() => setPendingTermDelete(null)}
            />
        </div>
    )
}
