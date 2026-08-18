import { useState } from 'react'
import PlanCard from '../components/PlanCard/PlanCard'
import PlanForm from '../components/PlanForm/PlanForm'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import {
    MOCK_PLANS,
    MOCK_FEATURES,
    MOCK_BILLING_TERMS,
    termName,
} from '../data/mockCatalog'
import { buildPlanCode } from '../utils/planCode'
import styles from './CatalogPage.module.css'

const TABS = [{ id: 'plans', label: 'محصولات و پلن‌ها' }]

/**
 * محصولات و کاتالوگ — شبکه‌ی کارت پلن‌ها و فرم ساخت/ویرایش.
 *
 * برخلاف بقیه‌ی صفحات ادمین، بک‌اند این بخش کامل آماده است:
 *   GET/POST/PATCH/DELETE /admin/plans و /admin/plans/{id}/features|prices
 *
 * TODO: اتصال به adminCatalogService پس از در دسترس بودن سرور.
 *       فعلاً روی MOCK_PLANS کار می‌کند تا UI قابل بررسی باشد.
 */
export default function CatalogPage() {
    const [plans, setPlans] = useState(MOCK_PLANS)

    /* null = نمای شبکه | 'new' = فرم ساخت | شیء پلن = فرم ویرایش */
    const [editing, setEditing] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [saving, setSaving] = useState(false)

    const openCreate = () => setEditing('new')
    const openEdit = (plan) => setEditing(plan)
    const closeForm = () => setEditing(null)

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
        setSaving(true)
        try {
            const features = MOCK_FEATURES.map((f) => ({
                key: f.code,
                label: f.name,
                value: values.features[f.code] ?? '',
            }))

            /* code در CreatePlan اجباری است ولی فیگما آن را نمی‌پرسد،
               پس از external_plan_code ساخته می‌شود.
               product_id هم در مسیر اندپوینت است نه بدنه؛ چون فعلاً یک
               محصول داریم، اولین محصول انتخاب می‌شود.

               TODO: هنگام اتصال واقعی —
                 adminCatalogService.createPlan(productId, {
                     ...values, code: buildPlanCode(values)
                 })
               و سپس ثبت قیمت با term_code انتخاب‌شده:
                 adminCatalogService.createPlanPrice(planId, { term_code, ... }) */
            const code = buildPlanCode(values)

            if (editing === 'new') {
                setPlans((list) => [
                    ...list,
                    { ...values, code, id: Date.now(), features },
                ])
            } else {
                setPlans((list) =>
                    list.map((p) =>
                        p.id === editing.id ? { ...p, ...values, features } : p
                    )
                )
            }
            closeForm()
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = () => {
        // TODO: adminCatalogService.deletePlan(pendingDelete.id)
        setPlans((list) => list.filter((p) => p.id !== pendingDelete.id))
        setPendingDelete(null)
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
                <PlanForm
                    initialValues={toFormValues(editing)}
                    featureList={MOCK_FEATURES}
                    termList={MOCK_BILLING_TERMS}
                    saving={saving}
                    onSubmit={handleSubmit}
                    onClose={closeForm}
                />
            ) : (
                <>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.createBtn}
                            onClick={openCreate}
                        >
                            ایجاد پلن
                        </button>
                    </div>

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
