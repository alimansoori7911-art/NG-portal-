import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { fileService } from '../../../services/fileService'
import styles from './AttachmentLink.module.css'

/**
 * دکمه‌ی مشاهده‌ی یک فایل پیوست (`AttachmentSchema`).
 *
 * لینک دانلود presigned و کوتاه‌عمر است (حدود یک ساعت)، پس هر بار
 * تازه گرفته می‌شود و ذخیره نمی‌شود.
 *
 * تب **قبل از** درخواست باز می‌شود و بعد آدرسش ست می‌شود؛ اگر بعد از
 * await باز می‌کردیم مرورگر آن را پاپ‌آپ ناخواسته می‌دید و بلاک
 * می‌کرد — همان الگوی صفحه‌ی فاکتور.
 */
export default function AttachmentLink({ attachment, label = 'مشاهده رسید' }) {
    const [busy, setBusy] = useState(false)
    const [failed, setFailed] = useState(false)

    if (!attachment?.id) return null

    const open = async () => {
        if (busy) return
        setBusy(true)
        setFailed(false)

        const tab = window.open('', '_blank', 'noopener,noreferrer')

        try {
            const url = await fileService.getDownloadUrl(attachment.id)
            if (!url) throw new Error('no url')

            if (tab) tab.location.href = url
            else window.location.href = url
        } catch {
            tab?.close()
            setFailed(true)
        } finally {
            setBusy(false)
        }
    }

    return (
        <button
            type="button"
            className={styles.attachment}
            onClick={open}
            disabled={busy}
            title={attachment.original_filename || label}
        >
            <Paperclip size={13} />
            {busy ? 'در حال باز کردن…' : failed ? 'دوباره تلاش کنید' : label}
        </button>
    )
}
