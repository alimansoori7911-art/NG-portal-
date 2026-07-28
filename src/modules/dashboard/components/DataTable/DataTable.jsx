import styles from './DataTable.module.css'

/**
 * کارت جدول داشبورد — دقیقاً مطابق SVG فیگما.
 *
 * columns: [{ key, label, width }]  ترتیب از راست به چپ، width بر حسب درصد
 * rows:    آرایه‌ای از آبجکت‌ها که کلیدهایشان با column.key یکی است
 * page / pageCount / onPageChange: صفحه‌بندی
 *
 * اعداد استخراج‌شده از SVG (فریم ۱۴۴۰×۱۰۲۴):
 *   کارت  x 47→1069، y 63→881  →  ۱۰۲۲×۸۱۸، radius 31، border 2px #0D1726
 *   هدر   y 63→161  →  ارتفاع ۹۸، fill #0D1726
 *   ردیف  ۸۰px، جداکننده 2px #0D1726
 *   صفحه‌بندی  ۲۵×۲۵، radius 5.5، gap 7، ۱۴px زیر کارت، ۲۴px از لبه‌ی چپ
 */
export default function DataTable({
                                      columns = [],
                                      rows = [],
                                      page = 1,
                                      pageCount = 1,
                                      onPageChange,
                                  }) {
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
                        {rows.map((row, i) => (
                            // TODO: کلیک روی ردیف پس از مشخص شدن صفحه‌ی جزئیات فعال شود
                            <tr key={row.id ?? i} className={styles.row}>
                                {columns.map((col) => (
                                    <td key={col.key} className={styles.cell}>
                                            <span
                                                className={styles.cellText}
                                                dir={col.ltr ? 'ltr' : undefined}
                                            >
                                                {row[col.key]}
                                            </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
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