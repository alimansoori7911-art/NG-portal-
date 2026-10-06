import { Pencil, Trash2, Plus, Tag } from 'lucide-react'
import styles from './CatalogEntityList.module.css'

/**
 * فهرست موجودیت‌های کاتالوگ — محصول، دسته‌بندی و ویژگی.
 *
 * یک کامپوننت برای هر سه، چون ساختارشان یکی است: کد + عنوان + توضیح
 * + وضعیت فعال/غیرفعال + دکمه‌های ویرایش و حذف. سه فهرست جدا یعنی سه
 * جا برای از هم دور افتادن.
 *
 * `rows`: [{ id, code, title, description, tags: [], inactive }]
 */
export default function CatalogEntityList({
    rows = [],
    loading = false,
    emptyMessage = 'موردی ثبت نشده است',
    createLabel,
    onCreate,
    onEdit,
    onDelete,
    /* عملیات سومِ اختیاری — برای «نسخه‌ها»ی محصول */
    extraAction,
}) {
    return (
        <>
            <div className={styles.toolbar}>
                <button type="button" className={styles.createBtn} onClick={onCreate}>
                    <Plus size={16} aria-hidden="true" />
                    {createLabel}
                </button>
            </div>

            {loading ? (
                <p className={styles.state}>در حال دریافت…</p>
            ) : rows.length === 0 ? (
                <p className={styles.state}>{emptyMessage}</p>
            ) : (
                <ul className={styles.list}>
                    {rows.map((row) => (
                        <li
                            key={row.id}
                            className={`${styles.row} ${
                                row.inactive ? styles.rowInactive : ''
                            }`}
                        >
                            <div className={styles.main}>
                                <div className={styles.head}>
                                    <span className={styles.title}>{row.title}</span>
                                    <span className={styles.code} dir="ltr">
                                        {row.code}
                                    </span>

                                    {row.inactive && (
                                        <span className={styles.offTag}>غیرفعال</span>
                                    )}

                                    {row.tags?.map((t) => (
                                        <span key={t} className={styles.tag}>
                                            <Tag size={11} aria-hidden="true" />
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                {row.description && (
                                    <p className={styles.desc}>{row.description}</p>
                                )}
                            </div>

                            <div className={styles.actions}>
                                {extraAction && (
                                    <button
                                        type="button"
                                        className={styles.ghost}
                                        onClick={() => extraAction.onClick(row)}
                                    >
                                        {extraAction.label(row)}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => onEdit?.(row)}
                                    aria-label={`ویرایش ${row.title}`}
                                    title="ویرایش"
                                >
                                    <Pencil size={15} />
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.iconBtn} ${styles.danger}`}
                                    onClick={() => onDelete?.(row)}
                                    aria-label={`حذف ${row.title}`}
                                    title="حذف"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}
