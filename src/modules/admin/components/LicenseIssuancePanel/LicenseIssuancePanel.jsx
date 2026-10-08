import { useState } from 'react'
import { RefreshCw, Plus, X } from 'lucide-react'
import AdminTable from '../AdminTable/AdminTable'
import UserPicker from '../UserPicker/UserPicker'
import { useLicenseIssuances } from '../../hooks/useLicenseIssuances'
import {
    ISSUANCE_STATUS,
    ISSUANCE_SOURCE,
    LICENSE_PLAN_TYPES,
    issuanceStatusLabel,
    issuanceSourceLabel,
    licensePlanLabel,
} from '../../../../services/licenseService'
import { formatJalaliDateTime } from '../../../../utils/datetime'
import styles from './LicenseIssuancePanel.module.css'

const COLUMNS = [
    { key: 'index', label: 'ردیف', width: '8%' },
    { key: 'user', label: 'کاربر', width: '14%', ltr: true },
    { key: 'plan', label: 'پلن', width: '13%' },
    { key: 'source', label: 'منبع', width: '11%' },
    { key: 'status', label: 'وضعیت', width: '15%' },
    { key: 'attempts', label: 'تلاش', width: '8%' },
    { key: 'date', label: 'تاریخ', width: '14%', ltr: true },
]

const STATUS_OPTIONS = Object.entries(ISSUANCE_STATUS)
const SOURCE_OPTIONS = Object.entries(ISSUANCE_SOURCE)
const PLAN_OPTIONS = Object.entries(LICENSE_PLAN_TYPES)

/**
 * صف صدور لایسنس.
 *
 * ⚠️ صدور ناهمگام است: پاسخِ `202` یعنی «در صف»، نه «صادر شد». این
 * پنل عمداً وضعیت را برجسته نشان می‌دهد و تا وقتی چیزی ناتمام است
 * خودش تازه می‌شود، وگرنه ادمین فرم را می‌بندد و فکر می‌کند کلید
 * آماده است.
 */
export default function LicenseIssuancePanel() {
    const [status, setStatus] = useState('')
    const [source, setSource] = useState('')
    const [formOpen, setFormOpen] = useState(false)
    const [formError, setFormError] = useState(null)
    const [userIds, setUserIds] = useState([])
    const [planType, setPlanType] = useState('')
    const [visible, setVisible] = useState(true)
    const [busyRow, setBusyRow] = useState(null)
    /* ⚠️ AdminTable نوار عملیات را فقط برای ردیفِ **انتخاب‌شده**
       می‌سازد؛ بدون این، دکمه‌ی «تلاش دوباره» هرگز دیده نمی‌شد. */
    const [selectedId, setSelectedId] = useState(null)

    const queue = useLicenseIssuances({
        status: status || undefined,
        source: source || undefined,
    })

    const rows = queue.items.map((it, i) => ({
        id: it.id,
        index: (queue.page - 1) * 10 + i + 1,
        user: it.user_id,
        plan: licensePlanLabel(it.plan_type),
        source: issuanceSourceLabel(it.source),
        status: (
            <span className={`${styles.badge} ${styles['s_' + it.status] ?? ''}`}>
                {issuanceStatusLabel(it.status)}
            </span>
        ),
        attempts: String(it.attempts ?? 1),
        date: formatJalaliDateTime(it.created_at).date,
        _raw: it,
    }))

    const resetForm = () => {
        setUserIds([])
        setPlanType('')
        setVisible(true)
        setFormError(null)
    }

    const submit = async (e) => {
        e.preventDefault()
        /* هر دو فیلد الزامی‌اند؛ بدون این بررسی، درخواست ۴۲۲ می‌گیرد
           و ادمین فقط یک خطای کلی می‌بیند. */
        if (!userIds.length) {
            setFormError('کاربر را انتخاب کنید')
            return
        }
        if (!planType) {
            setFormError('پلن را انتخاب کنید')
            return
        }

        const res = await queue.issue({
            user_id: userIds[0],
            plan_type: planType,
            visible_to_user: visible,
        })

        if (res.ok) {
            setFormOpen(false)
            resetForm()
        } else {
            setFormError(res.message)
        }
    }

    /* فقط چیزی که صادر نشده دوباره صف می‌شود */
    const rowActions = (row) => {
        const it = row._raw
        if (it.status === 'issued') {
            return (
                <div className={styles.rowActions}>
                    <span className={styles.issuedNote}>
                        لایسنس صادر شد
                        {it.external_license_id
                            ? ` (شناسه ${it.external_license_id})`
                            : ''}
                    </span>
                </div>
            )
        }

        return (
            <div className={styles.rowActions}>
                {it.last_error && (
                    <span className={styles.rowError}>{it.last_error}</span>
                )}
                <button
                    type="button"
                    className={styles.retryBtn}
                    disabled={busyRow === it.id}
                    onClick={async () => {
                        setBusyRow(it.id)
                        await queue.retry(it.id)
                        setBusyRow(null)
                    }}
                >
                    <RefreshCw size={14} />
                    {busyRow === it.id ? 'در حال ارسال…' : 'تلاش دوباره'}
                </button>
            </div>
        )
    }

    return (
        <div className={styles.panel}>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                        setFormOpen((v) => !v)
                        setFormError(null)
                    }}
                >
                    {formOpen ? <X size={16} /> : <Plus size={16} />}
                    {formOpen ? 'انصراف' : 'صدور لایسنس'}
                </button>

                <select
                    className={styles.filterSelect}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    aria-label="فیلتر وضعیت"
                >
                    <option value="">همه‌ی وضعیت‌ها</option>
                    {STATUS_OPTIONS.map(([code, label]) => (
                        <option key={code} value={code}>
                            {label}
                        </option>
                    ))}
                </select>

                <select
                    className={styles.filterSelect}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    aria-label="فیلتر منبع"
                >
                    <option value="">همه‌ی منابع</option>
                    {SOURCE_OPTIONS.map(([code, label]) => (
                        <option key={code} value={code}>
                            {label}
                        </option>
                    ))}
                </select>

                {/* نشانه‌ی زنده‌بودن: ادمین باید بداند جدول خودش تازه
                    می‌شود و لازم نیست صفحه را رفرش کند. */}
                {queue.polling && (
                    <span className={styles.polling}>
                        <RefreshCw size={13} className={styles.spin} />
                        در حال پیگیری صدور…
                    </span>
                )}
            </div>

            {formOpen && (
                <form className={styles.form} onSubmit={submit}>
                    {/* ⚠️ اینجا `id` عددی لازم است نه `public_id`؛
                        `ManualLicenseCreate.user_id` عدد می‌خواهد. */}
                    <UserPicker
                        value={userIds}
                        onChange={(ids) => {
                            /* یک لایسنس برای یک کاربر؛ آخرین انتخاب می‌ماند */
                            setUserIds(ids.slice(-1))
                            setFormError(null)
                        }}
                        label="کاربر"
                        placeholder="نام یا ایمیل کاربر را بنویسید…"
                    />

                    <label className={styles.field}>
                        <span className={styles.label}>پلن لایسنس</span>
                        <select
                            className={styles.select}
                            value={planType}
                            onChange={(e) => {
                                setPlanType(e.target.value)
                                setFormError(null)
                            }}
                        >
                            <option value="">انتخاب کنید…</option>
                            {PLAN_OPTIONS.map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={visible}
                            onChange={(e) => setVisible(e.target.checked)}
                        />
                        <span className={styles.checkText}>
                            برای کاربر قابل مشاهده باشد
                            <small className={styles.hint}>
                                اگر خاموش باشد لایسنس بی‌صدا صادر می‌شود و در
                                فهرست کاربر نمی‌آید.
                            </small>
                        </span>
                    </label>

                    {formError && (
                        <p className={styles.error} role="alert">
                            {formError}
                        </p>
                    )}

                    {/* انتظار صریح: پاسخ یعنی «در صف»، نه «آماده» */}
                    <p className={styles.note}>
                        صدور ناهمگام است؛ پس از ثبت، درخواست با وضعیت «در صف»
                        ثبت می‌شود و کلید پس از پاسخ لایسنس‌سرور می‌آید.
                    </p>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={queue.submitting}
                    >
                        {queue.submitting ? 'در حال ارسال…' : 'ثبت درخواست'}
                    </button>
                </form>
            )}

            <AdminTable
                columns={COLUMNS}
                rows={rows}
                page={queue.page}
                pageCount={queue.pagination?.total_pages ?? 1}
                onPageChange={queue.setPage}
                selectedId={selectedId}
                onRowClick={(row) =>
                    setSelectedId((cur) => (cur === row.id ? null : row.id))
                }
                renderRowActions={rowActions}
                emptyMessage={
                    queue.loading
                        ? 'در حال دریافت صف صدور…'
                        : queue.error ||
                          (status || source
                              ? 'با این فیلتر درخواستی نیست'
                              : 'هنوز لایسنسی صادر نشده است')
                }
            />
        </div>
    )
}
