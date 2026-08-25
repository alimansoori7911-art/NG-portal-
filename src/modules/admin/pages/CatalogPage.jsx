import { useState } from 'react'
import PlanCard from '../components/PlanCard/PlanCard'
import PlanForm from '../components/PlanForm/PlanForm'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { useCatalog } from '../hooks/useCatalog'
import { buildPlanCode } from '../utils/planCode'
import styles from './CatalogPage.module.css'

const TABS = [{ id: 'plans', label: 'محصولات و پلن‌ها' }]

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
    } = useCatalog()

    /* null = نمای شبکه | 'new' = فرم ساخت | شیء پلن = فرم ویرایش */
    const [editing, setEditing] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)

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
                    <button key={id} type="button" className={styles.tabActive}>
                        {label}
                    </button>
                ))}
            </div>

            {editing ? (
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
        </div>
    )
}
