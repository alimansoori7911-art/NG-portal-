import { useState } from 'react'
import PlanCard from '../components/PlanCard/PlanCard'
import PlanForm from '../components/PlanForm/PlanForm'
import BillingTermForm from '../components/BillingTermForm/BillingTermForm'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useCatalog } from '../hooks/useCatalog'
import { buildPlanCode } from '../utils/planCode'
import styles from './CatalogPage.module.css'

/* تب دوم اضافه شد چون «مدت اعتبار» فقط خوانده می‌شد: فرم پلن
   گزینه‌هایش را از این لیست می‌گرفت ولی هیچ راهی برای ساختنش نبود. */
const TABS = [
    { id: 'plans', label: 'محصولات و پلن‌ها' },
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

            {tab === 'terms' ? (
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
