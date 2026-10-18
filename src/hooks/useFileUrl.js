import { useEffect, useState } from 'react'
import { fileService } from '../services/fileService'

/* بک‌اند نشانی تصویرهای CMS را نسبی می‌دهد: `/dl/{file_id}`.
   آن مسیر خودِ فایل نیست؛ `POST /dl/{file_id}` یک لینک موقت (حدود یک
   ساعت) برمی‌گرداند. */
const DL_PATH = /^\/dl\/([0-9a-f-]{8,})\/?$/i

/* لینک موقت هر فایل تا یک دقیقه پیش از انقضا نگه داشته می‌شود، تا
   صفحه‌ای که چند بار همان لوگو را نشان می‌دهد یک درخواست بزند. */
const EXPIRY_MARGIN_MS = 60_000
const cache = new Map()

export const fileIdOf = (src) => DL_PATH.exec(String(src ?? '').trim())?.[1] ?? null

function resolve(id) {
    const hit = cache.get(id)
    if (hit?.pending) return hit.pending
    if (hit?.url && hit.expiresAt > Date.now()) return Promise.resolve(hit.url)

    const pending = fileService
        .getDownload(id, { silent: true })
        .then((r) => {
            if (!r?.download_url) throw new Error('no download url')
            cache.set(id, {
                url: r.download_url,
                expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 - EXPIRY_MARGIN_MS,
            })
            return r.download_url
        })
        .catch((err) => {
            cache.delete(id)
            throw err
        })
    cache.set(id, { pending })
    return pending
}

/**
 * نشانی قابل‌نمایش یک تصویر CMS.
 *
 * - نشانی کامل (`https://…`) یا فایل محلی همان‌طور برمی‌گردد.
 * - `/dl/{file_id}` به لینک موقت تبدیل و کش می‌شود.
 *
 * اگر تبدیل نشد (مثلاً سرور برای مهمان اجازه نداد) `failed` درست است
 * و صفحه تصویر پیش‌فرض خودش را نشان می‌دهد، نه جای خالی.
 */
export function useFileUrl(src) {
    const id = fileIdOf(src)
    const [state, setState] = useState({ id: null, url: null, failed: false })

    useEffect(() => {
        if (!id) return
        let cancelled = false
        resolve(id)
            .then((url) => {
                if (!cancelled) setState({ id, url, failed: false })
            })
            .catch(() => {
                if (!cancelled) setState({ id, url: null, failed: true })
            })
        return () => {
            cancelled = true
        }
    }, [id])

    if (!id) return { url: src || null, failed: false, loading: false }
    const fresh = state.id === id
    return {
        url: fresh ? state.url : null,
        failed: fresh && state.failed,
        loading: !fresh,
    }
}
