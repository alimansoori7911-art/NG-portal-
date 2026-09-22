import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { downloadFile } from '../../../services/fileService'
import styles from './AttachmentLink.module.css'

/**
 * دکمه‌ی مشاهده‌ی یک فایل پیوست (`AttachmentSchema`).
 *
 * لینک دانلود presigned و کوتاه‌عمر است (حدود یک ساعت)، پس هر بار
 * تازه گرفته می‌شود و ذخیره نمی‌شود. `downloadFile` جزئیات باز کردن
 * را مدیریت می‌کند.
 */
export default function AttachmentLink({ attachment, label = 'مشاهده رسید' }) {
    const [busy, setBusy] = useState(false)
    const [failed, setFailed] = useState(false)

    if (!attachment?.id) return null

    const open = async () => {
        if (busy) return
        setBusy(true)
        setFailed(false)

        try {
            await downloadFile(attachment.id, attachment.original_filename)
        } catch {
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
