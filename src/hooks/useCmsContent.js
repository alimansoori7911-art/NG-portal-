import { useEffect, useState } from 'react'
import { cmsService } from '../services/cmsService'

/**
 * محتوای یک صفحه‌ی ساختاریافته‌ی CMS برای سایت عمومی.
 *
 * ✅ `GET /cms/pages/schema/{schema_key}` بالاخره آمد. تا پیش از این،
 * هرچه ادمین در CMS می‌نوشت هیچ‌جای سایت دیده نمی‌شد.
 *
 * ⚠️ **خطا صفحه را نمی‌شکند.** اگر CMS بالا نیامد یا صفحه هنوز منتشر
 * نشده (۴۰۴)، `blocks` تهی می‌ماند و صفحه متن پیش‌فرض خودش را نشان
 * می‌دهد. این عمدی است: یک صفحه‌ی بازاریابی نباید به‌خاطر CMS سفید شود.
 *
 * ⚠️ poll نمی‌کنیم — فقط یک‌بار موقع لود. کش سمت بک‌اند است.
 */
export function useCmsContent(schemaKey) {
    const [state, setState] = useState({ key: null, blocks: [], error: null })

    useEffect(() => {
        if (!schemaKey) return
        let cancelled = false

        cmsService
            .getPublicSchemaPage(schemaKey)
            .then((data) => {
                if (cancelled) return
                setState({
                    key: schemaKey,
                    blocks: data?.blocks ?? [],
                    error: null,
                })
            })
            .catch((err) => {
                if (cancelled) return
                setState({
                    key: schemaKey,
                    blocks: [],
                    error: err?.message || 'دریافت محتوا ناموفق بود',
                })
            })

        return () => {
            cancelled = true
        }
    }, [schemaKey])

    const fresh = state.key === schemaKey

    /**
     * خواندن یک بلوک با کلیدش.
     *
     * `fields(key, fallback)` مقدار فیلدها را می‌دهد و `items(key)`
     * ردیف‌های یک `CARD_LIST` را. هر دو وقتی CMS چیزی نداده مقدار
     * پیش‌فرض را برمی‌گردانند، پس صفحه همیشه چیزی برای نشان دادن دارد.
     */
    const blocks = fresh ? state.blocks : []

    const fields = (key, fallback = {}) => {
        const b = blocks.find((x) => x.key === key)
        if (!b?.fields) return fallback
        /* فیلد خالی از CMS نباید متن پیش‌فرض را پاک کند */
        const out = { ...fallback }
        for (const [k, v] of Object.entries(b.fields)) {
            if (v != null && String(v).trim() !== '') out[k] = v
        }
        return out
    }

    const items = (key, fallback = []) => {
        const b = blocks.find((x) => x.key === key)
        return Array.isArray(b?.items) && b.items.length > 0 ? b.items : fallback
    }

    return {
        blocks,
        fields,
        items,
        loading: Boolean(schemaKey) && !fresh,
        error: fresh ? state.error : null,
    }
}
