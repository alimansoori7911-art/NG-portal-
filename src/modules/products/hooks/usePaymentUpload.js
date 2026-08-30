import { useCallback, useState } from 'react'
import { orderService } from '../../../services/orderService'
import { fileService, validateFile } from '../../../services/fileService'

/**
 * ثبت رسید پرداخت به‌همراه فایل پیوست.
 *
 * زنجیره‌ی آپلود دو مرحله‌ای است:
 *   ۱. `POST /orders/{id}/payments/attachments` با بدنه‌ی
 *      `CreatePaymentRecord` → رکورد پرداخت ساخته می‌شود و یک JWT
 *      کوتاه‌عمر برمی‌گردد
 *   ۲. فایل با هدر `X-Upload-Token` به `POST /dl/upload` می‌رود
 *
 * ⚠️ توجه: این اندپوینت **شناسه‌ی پرداخت نمی‌گیرد** و بدنه‌اش همان
 * `CreatePaymentRecord` است، پس خودش رکورد را می‌سازد — یعنی نباید
 * علاوه بر آن `POST /orders/{id}/payments` هم صدا زد وگرنه دو رسید
 * تکراری ثبت می‌شود.
 *
 * اگر مرحله‌ی دوم شکست بخورد، رسید **ثبت شده** ولی بدون فایل. این را
 * صادقانه به کاربر می‌گوییم به‌جای اینکه کل کار را «ناموفق» بنامیم.
 */
export function usePaymentUpload(orderId) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    /* رسید ثبت شد ولی فایل بالا نرفت — حالت میانی که باید گفته شود */
    const [partial, setPartial] = useState(false)

    const submitWithFile = useCallback(
        async (payload, file) => {
            const invalid = validateFile(file)
            if (invalid) {
                setError(invalid)
                return false
            }

            setUploading(true)
            setError(null)
            setPartial(false)
            setProgress(0)

            let token
            try {
                /* مرحله ۱ — رکورد پرداخت + توکن */
                const data = await orderService.requestPaymentUploadToken(
                    orderId,
                    payload
                )
                token = data?.token
                if (!token) throw new Error('توکن آپلود دریافت نشد')
            } catch (err) {
                setError(err?.message || 'ثبت رسید ناموفق بود')
                setUploading(false)
                return false
            }

            try {
                /* مرحله ۲ — خود فایل */
                await fileService.upload(file, token, { onProgress: setProgress })
                return true
            } catch (err) {
                /* رسید ثبت شده و فقط فایل نرفته؛ کاربر نباید دوباره
                   کل فرم را بفرستد چون رسید تکراری می‌شود. */
                setPartial(true)
                setError(
                    err?.status === 413
                        ? 'حجم فایل بیش از حد مجاز است'
                        : err?.status === 415
                          ? 'نوع فایل پذیرفته نشد'
                          : err?.message || 'بارگذاری فایل ناموفق بود'
                )
                return false
            } finally {
                setUploading(false)
            }
        },
        [orderId]
    )

    return {
        uploading,
        progress,
        error,
        partial,
        submitWithFile,
        reset: () => {
            setError(null)
            setPartial(false)
            setProgress(0)
        },
    }
}
