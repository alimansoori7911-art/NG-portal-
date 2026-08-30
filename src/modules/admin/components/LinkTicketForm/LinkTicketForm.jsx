import { useEffect, useState } from 'react'
import { Link2 } from 'lucide-react'
import Select from '../../../../components/ui/Select/Select'
import Textarea from '../../../../components/ui/Textarea/Textarea'
import { ticketService } from '../../../../services/ticketService'
import { TICKET_RELATION_TYPES } from '../../../../services/orderService'
import styles from './LinkTicketForm.module.css'

const RELATION_LABELS = Object.values(TICKET_RELATION_TYPES)
const relationCodeOf = (label) =>
    Object.keys(TICKET_RELATION_TYPES).find(
        (k) => TICKET_RELATION_TYPES[k] === label
    )

/* برچسب تیکت در فهرست انتخاب — شماره‌ی تیکت خواناتر از UUID است */
const ticketLabel = (t) =>
    `#${t.ticket_number ?? '—'} · ${t.subject ?? 'بدون موضوع'}`

/**
 * اتصال یک تیکت موجود به سفارش — `POST /admin/orders/{id}/tickets/link`.
 *
 * در فلو، تیکتینگ «در هر مرحله» به سفارش وصل می‌شود
 * (`t_admin -> a_review [label="link"]`). برای پلن‌های install-by-us
 * هم نصب از راه همین تیکت پیگیری می‌شود.
 *
 * ⚠️ این تا اسپک ۱۴ قابل ساخت نبود: `LinkOrderTicket.ticket_id` عدد
 * بود در حالی که بقیه‌ی تیکتینگ UUID می‌داد.
 */
export default function LinkTicketForm({ order, busy, error, onSubmit, onCancel }) {
    const [tickets, setTickets] = useState([])
    const [loadingTickets, setLoadingTickets] = useState(true)
    const [loadError, setLoadError] = useState(null)

    const [selected, setSelected] = useState('')
    const [relation, setRelation] = useState(TICKET_RELATION_TYPES.general)
    const [isPrimary, setIsPrimary] = useState(false)
    const [note, setNote] = useState('')

    /* تیکت‌های باز برای انتخاب. تیکت بسته را هم می‌شود وصل کرد ولی
       معمولاً منظور ادمین تیکت جاری است، پس فهرست کوتاه‌تر می‌ماند. */
    useEffect(() => {
        let cancelled = false

        ticketService
            .getTickets({ page: 1, limit: 50 })
            .then(({ items }) => {
                if (!cancelled) setTickets(items ?? [])
            })
            .catch((err) => {
                if (!cancelled) setLoadError(err?.message || 'دریافت تیکت‌ها ناموفق بود')
            })
            .finally(() => {
                if (!cancelled) setLoadingTickets(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    /* تیکت‌هایی که از قبل به همین سفارش وصل‌اند دوباره نمایش داده
       نمی‌شوند تا ادمین اشتباهاً رابطه‌ی تکراری نسازد. */
    const linkedIds = new Set((order?.ticket_links ?? []).map((l) => l.ticket_id))
    const available = tickets.filter((t) => !linkedIds.has(t.id))

    const options = available.map(ticketLabel)
    const selectedTicket = available.find((t) => ticketLabel(t) === selected)

    const submit = () => {
        if (!selectedTicket) return
        onSubmit({
            ticket_id: selectedTicket.id,
            relation_type: relationCodeOf(relation) ?? 'general',
            is_primary: isPrimary,
            note: note.trim() || undefined,
        })
    }

    return (
        <div className={styles.box}>
            <header className={styles.header}>
                <Link2 size={18} className={styles.icon} />
                <h3 className={styles.title}>اتصال تیکت به سفارش</h3>
            </header>

            {(error || loadError) && (
                <p className={styles.error} role="alert">
                    {error || loadError}
                </p>
            )}

            <div className={styles.fields}>
                <Select
                    label="تیکت"
                    options={options}
                    value={selected}
                    onChange={setSelected}
                    disabled={loadingTickets || busy || options.length === 0}
                />

                <Select
                    label="نوع رابطه"
                    options={RELATION_LABELS}
                    value={relation}
                    onChange={setRelation}
                    disabled={busy}
                />
            </div>

            {loadingTickets && <p className={styles.hint}>در حال دریافت تیکت‌ها…</p>}

            {!loadingTickets && options.length === 0 && (
                <p className={styles.hint}>
                    {tickets.length === 0
                        ? 'تیکتی برای اتصال وجود ندارد.'
                        : 'همه‌ی تیکت‌ها از قبل به این سفارش وصل شده‌اند.'}
                </p>
            )}

            <Textarea
                label="یادداشت (اختیاری)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={2000}
                disabled={busy}
            />

            <label className={styles.checkbox}>
                <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    disabled={busy}
                />
                <span>تیکت اصلی این سفارش است</span>
            </label>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={submit}
                    disabled={busy || !selectedTicket}
                >
                    {busy ? 'در حال اتصال…' : 'اتصال تیکت'}
                </button>

                <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={onCancel}
                    disabled={busy}
                >
                    انصراف
                </button>
            </div>
        </div>
    )
}
