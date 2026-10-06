import { useEffect, useState } from 'react'
import { discountService, discountTypeLabel } from '../../../../services/discountService'
import { formatToman } from '../../../../utils/currency'
import { formatJalaliDateTime } from '../../../../utils/datetime'

/* مقدار تخفیف — درصد و مبلغ شکل متفاوتی دارند و نباید یکسان نمایش
   داده شوند: «۲۰٪» در برابر «۱۵۰٬۰۰۰ تومان». */
function formatValue(d) {
    const raw = Number(d.value) || 0
    return d.discount_type === 'PERCENT'
        ? `${raw.toLocaleString('fa-IR')}٪`
        : formatToman(raw)
}

/**
 * کدهای تخفیفی که این کاربر می‌تواند استفاده کند.
 *
 * ⚠️ `UserDiscountOut` عمداً از `DiscountListItemOut` کوچک‌تر است:
 * فقط `id`، `code`، `discount_type`، `value`، `valid_until` و
 * `remaining_usage`. اطلاعات مدیریتی (دامنه، سازنده، تاریخچه‌ی مصرف)
 * به کاربر داده نمی‌شود — پس این صفحه نباید انتظارشان را داشته باشد.
 *
 * ⚠️ `remaining_usage` تهی یعنی **نامحدود**، نه صفر.
 */
export function useMyDiscounts() {
    const [state, setState] = useState({ ready: false, items: [], error: null })

    useEffect(() => {
        let cancelled = false

        discountService
            .getMyDiscounts()
            /* این متد `{items, pagination}` می‌دهد، نه آرایه‌ی خام */
            .then(({ items }) => {
                if (cancelled) return
                setState({
                    ready: true,
                    items: (items ?? []).map((d) => ({
                        ...d,
                        typeLabel: discountTypeLabel(d.discount_type),
                        valueLabel: formatValue(d),
                        validUntilLabel:
                            formatJalaliDateTime(d.valid_until).date || '—',
                        remainingLabel:
                            d.remaining_usage == null
                                ? 'نامحدود'
                                : d.remaining_usage.toLocaleString('fa-IR'),
                    })),
                    error: null,
                })
            })
            .catch((err) => {
                if (cancelled) return
                setState({
                    ready: true,
                    items: [],
                    error: err?.message || 'دریافت کدهای تخفیف ناموفق بود',
                })
            })

        return () => {
            cancelled = true
        }
    }, [])

    return {
        items: state.items,
        error: state.error,
        loading: !state.ready,
    }
}
