import { createElement } from 'react'
import { resolveIcon } from '../../../utils/iconMap'

/**
 * آیکون از روی اسمش (مقدار فیلد `icon` در CMS).
 *
 * `createElement` به‌جای `<Icon />`: کامپوننتی که موقع رندر از یک
 * جدول انتخاب می‌شود، در JSX شبیه «کامپوننت ساخته‌شده حین رندر» دیده
 * می‌شود. خودِ آیکون‌ها ثابت‌اند و state ندارند، پس بی‌خطر است.
 */
export default function NamedIcon({ name, fallback = null, ...props }) {
    const Icon = resolveIcon(name, fallback)
    return Icon ? createElement(Icon, props) : null
}
