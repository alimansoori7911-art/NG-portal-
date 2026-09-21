import { useEffect, useState } from 'react'

/**
 * بخشی که همین حالا جلوی چشم کاربر است — برای هایلایت فهرست مطالب.
 *
 * با IntersectionObserver کار می‌کند نه با رویداد scroll: مرورگر خودش
 * تشخیص را انجام می‌دهد و در هر پیکسل اسکرول یک محاسبه‌ی دستی اجرا
 * نمی‌شود.
 *
 * `rootMargin` بالا ۱۱۲ پیکسل منفی است تا ارتفاع هدر ثابت (۹۶) حساب
 * شود، و پایین ۶۰٪ منفی تا «فعال» یعنی بخشی که در یک‌سومِ بالای صفحه
 * است، نه هر بخشی که گوشه‌اش پیداست.
 */
export function useActiveSection(ids) {
    const [activeId, setActiveId] = useState(ids[0] ?? null)

    useEffect(() => {
        if (!ids.length) return

        const elements = ids
            .map((id) => document.getElementById(id))
            .filter(Boolean)

        if (!elements.length) return

        const observer = new IntersectionObserver(
            (entries) => {
                /* ممکن است چند بخش همزمان در محدوده باشند؛ بالاترینشان
                   روی صفحه ملاک است. */
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top
                    )

                if (visible.length) setActiveId(visible[0].target.id)
            },
            { rootMargin: '-112px 0px -60% 0px', threshold: 0 }
        )

        elements.forEach((el) => observer.observe(el))
        return () => observer.disconnect()
    }, [ids])

    return activeId
}
