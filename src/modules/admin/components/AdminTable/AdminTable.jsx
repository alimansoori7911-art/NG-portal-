import styles from './AdminTable.module.css'

/**
 * جدول پنل ادمین — مطابق SVG فیگما.
 *
 * با DataTable داشبورد فرق دارد و عمداً جداست:
 *   • هدر پس‌زمینه ندارد، فقط یک خط آبی #1474FF زیرش
 *   • ردیف‌ها ۶۴px (به‌جای ۸۰) و جداکننده ۱px #192D4C
 *   • کارت radius 20 و fill #060B13 (به‌جای radius 31 و شفاف)
 *
 * columns: [{ key, label, width, ltr, render }]  ترتیب از راست به چپ
 * rows:    آرایه‌ای از آبجکت‌ها که کلیدهایشان با column.key یکی است
 *
 * صفحه‌بندی: کارت فیگما ۷۰۴px است و با هدر ۶۴ و ردیف‌های ۶۴ دقیقاً
 * ۱۰ ردیف جا می‌شود؛ پس جدول اسکرول داخلی ندارد و هر صفحه ۱۰ ردیف
 * نشان می‌دهد. برش همین‌جا انجام می‌شود تا صفحات لازم نباشد خودشان
 * slice کنند.
 *
 * TODO: با اتصال به بک‌اند، برش سمت سرور انجام می‌شود
 *       (?page=&limit=10) و آن‌وقت rows فقط همان صفحه را دارد؛
 *       کافی است paginate={false} داده شود.
 */
export const ROWS_PER_PAGE = 10

export default function AdminTable({
    columns = [],
    rows = [],
    page = 1,
    onPageChange,
    rowsPerPage = ROWS_PER_PAGE,
    paginate = true,
    /* برای صفحه‌بندی سمت سرور: rows فقط همان صفحه است، پس تعداد
       صفحه‌ها را نمی‌توان از طول آن حساب کرد و باید داده شود. */
    pageCount: pageCountProp,
    emptyMessage = 'موردی برای نمایش وجود ندارد',
    /* انتخاب ردیف — برای نوار عملیاتی که زیر ردیف انتخاب‌شده باز می‌شود.
       selectedId: شناسه‌ی ردیف فعال، onRowClick: کلیک روی ردیف،
       renderRowActions(row): محتوای نواری که زیر آن ردیف می‌آید. */
    selectedId = null,
    onRowClick,
    renderRowActions,
}) {
    const serverPaginated = pageCountProp != null

    const pageCount = serverPaginated
        ? pageCountProp
        : paginate
          ? Math.ceil(rows.length / rowsPerPage) || 1
          : 1

    /* اگر داده کم شد و صفحه‌ی فعلی دیگر وجود نداشت، آخرین صفحه نشان
       داده می‌شود تا کاربر با جدول خالی روبه‌رو نشود. */
    const safePage = Math.min(page, pageCount)

    /* در حالت سمت سرور، rows همان صفحه است و نباید دوباره برش بخورد. */
    const visibleRows =
        paginate && !serverPaginated
            ? rows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)
            : rows

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.scroll}>
                    <table className={styles.table}>
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
                            {visibleRows.length === 0 ? (
                                <tr>
                                    <td className={styles.empty} colSpan={columns.length}>
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                visibleRows.map((row, i) => {
                                    const isSelected =
                                        selectedId != null && row.id === selectedId

                                    return [
                                        <tr
                                            key={row.id ?? i}
                                            className={`${styles.row} ${
                                                isSelected ? styles.rowSelected : ''
                                            } ${onRowClick ? styles.rowClickable : ''}`}
                                            onClick={() => onRowClick?.(row)}
                                        >
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
                                        </tr>,

                                        /* نوار عملیات — بلافاصله زیر ردیف انتخاب‌شده */
                                        isSelected && renderRowActions ? (
                                            <tr key={`${row.id}-actions`} className={styles.actionsRow}>
                                                <td colSpan={columns.length} className={styles.actionsCell}>
                                                    {renderRowActions(row)}
                                                </td>
                                            </tr>
                                        ) : null,
                                    ]
                                })
                            )}
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
                            className={`${styles.pageBtn} ${n === safePage ? styles.pageBtnActive : ''}`}
                            onClick={() => onPageChange?.(n)}
                            aria-current={n === safePage ? 'page' : undefined}
                        >
                            {n}
                        </button>
                    ))}
                </nav>
            )}
        </div>
    )
}
