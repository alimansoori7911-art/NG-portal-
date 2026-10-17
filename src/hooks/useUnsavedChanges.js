import { useEffect } from 'react'

/**
 * هشدار مرورگر هنگام بستن یا رفرش صفحه، وقتی فرمی تغییر ذخیره‌نشده دارد.
 *
 * فقط بستن تب و رفرش را می‌گیرد. بستن خودِ فرم (✕، «انصراف»، عوض
 * کردن تب) را فرمی که این هوک را صدا می‌زند با دیالوگ خودش می‌پرسد.
 *
 * ⚠️ متن دیالوگ مرورگر قابل تغییر نیست؛ مرورگرها پیام ثابت خودشان را
 * نشان می‌دهند.
 */
export function useUnsavedChanges(dirty) {
    useEffect(() => {
        if (!dirty) return

        const onBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [dirty])
}
