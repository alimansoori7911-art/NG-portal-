/**
 * متن غنی CMS (HTML) ← آرایه‌ی پاراگراف‌های متن ساده.
 *
 * بخش‌هایی که چیدمان خودشان را دارند (هر پاراگراف یک `<p>` با کلاس
 * خودش) HTML خام نمی‌خواهند و تزریق آن هم ایمن نیست. `DOMParser`
 * اسکریپت اجرا نمی‌کند و موجودیت‌ها (`&nbsp;`) را هم درست باز می‌کند.
 *
 * متن بدون تگ هم پشتیبانی می‌شود: هر خط خالی یک پاراگراف جداست.
 */
export function richTextToParagraphs(value) {
    const raw = String(value ?? '').trim()
    if (!raw) return []

    if (!/<[a-z][\s\S]*>/i.test(raw)) {
        return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    }

    const doc = new DOMParser().parseFromString(raw, 'text/html')
    const SEL = 'p, li, h1, h2, h3, h4, h5, h6'
    /* `<li><p>…</p></li>` نباید دو بار بیاید — فقط بیرونی‌ترین */
    const blocks = [...doc.body.querySelectorAll(SEL)].filter(
        (el) => !el.parentElement?.closest(SEL)
    )
    const texts = blocks.length
        ? blocks.map((el) => el.textContent)
        : [doc.body.textContent]

    return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
}
