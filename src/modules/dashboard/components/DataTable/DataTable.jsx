import styles from './DataTable.module.css'

/**
 * کارت جدول — مطابق SVG فیگما.
 *
 * columns: [{ key, label, width, ltr, render }]  ترتیب از راست به چپ
 *   render(row) اختیاری است؛ برای سلول‌هایی که به‌جای متن، محتوای دلخواه
 *   دارند (مثل دکمه‌ی حذف). اگر نبود، row[key] نمایش داده می‌شود.
 * rows:    آرایه‌ای از آبجکت‌ها که کلیدهایشان با column.key یکی است
 * page / pageCount / onPageChange: صفحه‌بندی
 *
 * پراپ‌های اختیاری برای صفحاتی که اعداد فیگمایشان فرق دارد.
 * مقادیر پیش‌فرض همان داشبورد است، پس صفحات موجود تغییری نمی‌کنند.
 *   align            'center' | 'right'  — چیدمان متن سلول‌ها
 *   headerHeight     ارتفاع ردیف هدر (px)
 *   paginationIndent تورفتگی صفحه‌بندی از لبه‌ی چپ کارت (px)
 *
 * ردیف کلیک‌پذیر — فقط وقتی onRowClick داده شود:
 *   onRowClick(row)  با کلیک یا Enter/Space صدا زده می‌شود
 *   busyRowId        شناسه‌ی ردیفی که عملیاتش در جریان است
 *   rowTitle(row)    متن tooltip هر ردیف
 *
 * اعداد داشبورد (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت  ۱۰۲۲×۸۱۸، radius 31، border 2px #0D1726
 *   هدر   ۹۸ | ردیف ۸۰ | جداکننده 2px #0D1726
 *   صفحه‌بندی  ۲۵×۲۵، radius 5.5، gap 7، ۱۴px زیر کارت
 */
export default function DataTable({
                                      columns = [],
                                      rows = [],
                                      page = 1,
                                      pageCount = 1,
                                      onPageChange,
                                      align = 'center',
                                      headerHeight,
                                      paginationIndent,
                                      emptyMessage,
                                      onRowClick,
                                      busyRowId,
                                      rowTitle,
                                  }) {
    const cssVars = {}
    if (headerHeight != null) cssVars['--header-height'] = `${headerHeight}px`
    if (paginationIndent != null) cssVars['--pagination-indent'] = `${paginationIndent}px`

    const alignClass = align === 'right' ? styles.alignRight : ''

    return (
        <div className={styles.wrapper} style={cssVars}>
            <div className={styles.card}>
                <div className={styles.scroll}>
                    <table className={`${styles.table} ${alignClass}`}>
                        <colgroup>
                            {columns.map((col) => (
                                <col key={col.key} style={{ width: col.width }} />
                            ))}
                        </colgroup>

                        <thead>
                        <tr className={styles.headRow}>
                            {columns.map((col) => (
                                <th key={col.key} className={styles.headCell}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                        </thead>

                        <tbody>
                        {rows.length === 0 && emptyMessage ? (
                            <tr>
                                <td className={styles.empty} colSpan={columns.length}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : null}
                        {rows.map((row, i) => {
                            const clickable = Boolean(onRowClick)
                            const busy = clickable && busyRowId != null && row.id === busyRowId

                            /* ردیف کلیک‌پذیر باید با کیبورد هم قابل استفاده باشد،
                               وگرنه کاربری که ماوس ندارد اصلاً به فاکتورش نمی‌رسد. */
                            const rowProps = clickable
                                ? {
                                    className: `${styles.row} ${styles.rowClickable} ${busy ? styles.rowBusy : ''}`,
                                    onClick: () => !busy && onRowClick(row),
                                    onKeyDown: (e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return
                                        /* Space صفحه را اسکرول می‌کند اگر جلویش گرفته نشود */
                                        e.preventDefault()
                                        if (!busy) onRowClick(row)
                                    },
                                    role: 'button',
                                    tabIndex: 0,
                                    title: rowTitle?.(row),
                                    'aria-busy': busy || undefined,
                                }
                                : { className: styles.row }

                            return (
                                <tr key={row.id ?? i} {...rowProps}>
                                    {columns.map((col) => (
                                        <td key={col.key} className={styles.cell}>
                                            {col.render ? (
                                                col.render(row)
                                            ) : (
                                                <span
                                                    className={styles.cellText}
                                                    dir={col.ltr ? 'ltr' : undefined}
                                                >
                                                {row[col.key]}
                                            </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {pageCount > 1 && (
                <nav className={styles.pagination} aria-label="صفحه‌بندی">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            type="button"
                            className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ''}`}
                            onClick={() => onPageChange?.(n)}
                            aria-current={n === page ? 'page' : undefined}
                        >
                            {n}
                        </button>
                    ))}
                </nav>
            )}
        </div>
    )
}