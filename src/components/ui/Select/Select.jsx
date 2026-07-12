import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './Select.module.css'

/**
 * دراپ‌داون سفارشی با label شناور، مطابق طراحی فیگما.
 *  options: آرایه‌ای از رشته‌ها
 *  value / onChange: کنترل‌شده
 */
export default function Select({ label, options = [], value, onChange, disabled = false }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    // بستن پنل با کلیک بیرون از کامپوننت
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (option) => {
        onChange?.(option)
        setOpen(false)
    }

    return (
        <div className={styles.wrapper} ref={rootRef}>
            <button
                type="button"
                className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
                onClick={() => !disabled && setOpen((o) => !o)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={styles.label}>{label}</span>
                <span className={value ? styles.value : styles.placeholder}>
                    {value || 'گزینه مورد نظر را انتخاب کنید'}
                </span>
                <ChevronDown
                    size={18}
                    className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
                />
            </button>

            {open && (
                <ul className={styles.panel} role="listbox">
                    {options.map((option) => (
                        <li key={option}>
                            <button
                                type="button"
                                className={`${styles.option} ${option === value ? styles.optionSelected : ''}`}
                                onClick={() => handleSelect(option)}
                                role="option"
                                aria-selected={option === value}
                            >
                                {option}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}