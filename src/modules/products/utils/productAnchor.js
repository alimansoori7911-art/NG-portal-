/**
 * شناسه‌ی لنگر بخش جزئیات یک محصول.
 *
 * کارت‌های «چیست؟» (`what_is`) با کلیک به بخش جزئیات همان محصول
 * (`details`) اسکرول می‌کنند. آیتم‌های CMS شناسه ندارند و این دو
 * بلوک جدا ویرایش می‌شوند، پس پیوندشان از عنوان انگلیسی ساخته
 * می‌شود (نبودش: عنوان فارسی). حروف کوچک/بزرگ و علائم مهم نیستند:
 * `hardening & Remediation` و `Hardening & remediation` یکی‌اند.
 */
export function productAnchor(item) {
    const base = String(item?.title_en || item?.title_fa || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
    return base ? `detail-${base}` : undefined
}
