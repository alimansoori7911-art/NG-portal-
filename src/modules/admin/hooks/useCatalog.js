import { useCallback, useEffect, useState } from 'react'
import { adminCatalogService } from '../../../services/adminCatalogService'

/**
 * کاتالوگ ادمین — پلن‌ها به‌همراه قابلیت‌ها، مدت‌ها و محصولات.
 *
 * سه نکته‌ی مهم در نگاشت داده:
 *
 * ۱. «مدت اعتبار» روی خود پلن نیست. BillingTerm موجودیت جداست و از
 *    طریق PlanPrice.term_code به پلن وصل می‌شود. پس term_code را از
 *    اولین قیمت فعال پلن برمی‌داریم.
 *
 * ۲. قابلیت‌ها در کارت آرایه‌اند ولی در بک‌اند PlanFeature با
 *    value_json ذخیره می‌شوند. ساختار value_json هنوز تایپ نشده
 *    (رجوع به BACKEND_NEEDS.md) پس هر سه حالت رایج تحمل می‌شود.
 *
 * ۳. لیست پلن‌ها با include=prices,features خوانده می‌شود تا برای هر
 *    کارت درخواست جداگانه نرود.
 */

/* value_json ممکن است مقدار خام باشد یا داخل شیء. تا وقتی بک‌اند
   شکلش را تایپ نکند، هر سه حالت خوانده می‌شود. */
function featureValue(pf) {
    const v = pf?.value_json
    if (v == null) return ''
    if (typeof v === 'object') return v.value ?? v.amount ?? ''
    return v
}

/* PlanOutput → شکلی که PlanCard و PlanForm می‌فهمند */
function toCardPlan(plan, features) {
    const activePrice =
        plan.prices?.find((p) => p.is_active) ?? plan.prices?.[0] ?? null

    /* همه‌ی قابلیت‌های سراسری نشان داده می‌شوند حتی اگر پلن مقداری
       برایشان نداشته باشد، وگرنه کارت‌ها ردیف‌های متفاوت می‌گیرند و
       شبکه ناهماهنگ می‌شود. */
    const byFeatureId = new Map(
        (plan.features ?? []).map((pf) => [pf.feature_id, pf])
    )

    return {
        id: plan.id,
        name: plan.name,
        description: plan.description ?? '',
        external_plan_code: plan.external_plan_code,
        term_code: activePrice?.term_code ?? '',
        is_active: plan.is_active,
        is_public: plan.is_public,
        features: features.map((f) => ({
            key: f.code,
            label: f.name,
            value: featureValue(byFeatureId.get(f.id)),
        })),
        /* برای PATCH و ساخت قیمت لازم است */
        raw: plan,
        priceId: activePrice?.id ?? null,
    }
}

export function useCatalog() {
    const [plans, setPlans] = useState([])
    const [features, setFeatures] = useState([])
    const [terms, setTerms] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true)
        try {
            /* چهار درخواست مستقل، پس موازی — نه پشت سر هم */
            const [planRes, featureList, termList, productList] = await Promise.all([
                adminCatalogService.getPlans({ limit: 100 }),
                adminCatalogService.getFeatures(),
                adminCatalogService.getBillingTerms(),
                adminCatalogService.getProducts(),
            ])

            const feats = featureList ?? []
            setFeatures(feats)
            setTerms(termList ?? [])
            setProducts(productList ?? [])
            setPlans((planRes.items ?? []).map((p) => toCardPlan(p, feats)))
            setError(null)
        } catch (err) {
            if (!silent) setError(err?.message || 'دریافت کاتالوگ ناموفق بود')
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    /* نام نمایشی مدت از روی کد — جایگزین termName داده‌ی نمونه */
    const termName = useCallback(
        (code) => terms.find((t) => t.code === code)?.name ?? '',
        [terms]
    )

    /**
     * ساخت یا ویرایش پلن.
     *
     * چند درخواست پشت سر هم لازم است چون بک‌اند پلن، قابلیت و قیمت را
     * جدا نگه می‌دارد:
     *   ۱. ساخت/ویرایش خود پلن
     *   ۲. جایگزینی قابلیت‌ها (PUT — چون کاربر همه را یکجا تنظیم می‌کند)
     *   ۳. ثبت قیمت با term_code انتخاب‌شده
     */
    const savePlan = useCallback(
        async (values, { code, editing }) => {
            setSaving(true)
            setSaveError(null)

            try {
                let planId

                if (editing === 'new') {
                    /* product_id در مسیر اندپوینت است نه بدنه. تا وقتی
                       فقط یک محصول داریم اولی انتخاب می‌شود؛ با آمدن
                       محصول دوم فرم به dropdown نیاز دارد. */
                    const productId = products[0]?.id
                    if (!productId) {
                        throw new Error('هیچ محصولی برای ساخت پلن وجود ندارد')
                    }

                    const created = await adminCatalogService.createPlan(productId, {
                        code,
                        name: values.name,
                        external_plan_code: values.external_plan_code,
                        description: values.description || undefined,
                    })
                    planId = created.id
                } else {
                    planId = editing.id
                    await adminCatalogService.updatePlan(planId, {
                        name: values.name,
                        external_plan_code: values.external_plan_code,
                        description: values.description || undefined,
                    })
                }

                /* قابلیت‌هایی که مقدار دارند به PlanFeature تبدیل می‌شوند.
                   مقدار خالی یعنی «این پلن این قابلیت را ندارد». */
                const items = features
                    .filter((f) => {
                        const v = values.features?.[f.code]
                        return v !== '' && v != null
                    })
                    .map((f) => ({
                        feature_id: f.id,
                        value_json: { value: values.features[f.code] },
                    }))

                await adminCatalogService.replacePlanFeatures(planId, { items })

                /* قیمت فقط وقتی ثبت می‌شود که مدت انتخاب شده باشد و
                   با مدت فعلی فرق داشته باشد. */
                const termChanged =
                    editing === 'new' || editing.term_code !== values.term_code

                if (values.term_code && termChanged) {
                    await adminCatalogService.createPlanPrice(planId, {
                        code: `${code}-${values.term_code}`,
                        name: termName(values.term_code) || values.term_code,
                        term_code: values.term_code,
                        /* فرم فیگما فیلد مبلغ ندارد؛ قیمت‌گذاری واقعی
                           هنگام صدور پیش‌فاکتور انجام می‌شود.
                           (در BACKEND_NEEDS.md ثبت شده) */
                        amount: '0',
                    })
                }

                await load({ silent: true })
                return true
            } catch (err) {
                setSaveError(err?.message || 'ذخیره‌ی پلن ناموفق بود')
                return false
            } finally {
                setSaving(false)
            }
        },
        [features, products, termName, load]
    )

    const deletePlan = useCallback(
        async (planId) => {
            setSaveError(null)
            try {
                await adminCatalogService.deletePlan(planId)
                await load({ silent: true })
                return true
            } catch (err) {
                setSaveError(err?.message || 'حذف پلن ناموفق بود')
                return false
            }
        },
        [load]
    )

    return {
        plans,
        features,
        terms,
        products,
        loading,
        error,
        saving,
        saveError,
        clearSaveError: () => setSaveError(null),
        termName,
        savePlan,
        deletePlan,
        reload: load,
    }
}
