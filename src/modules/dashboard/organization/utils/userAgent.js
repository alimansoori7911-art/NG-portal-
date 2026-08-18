/**
 * تبدیل User-Agent خام به نام خوانای دستگاه.
 *
 * فیگما ستون «نام دستگاه» دارد ولی بک‌اند رشته‌ی کامل user_agent می‌دهد
 * (مثل "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/126.0").
 * نمایش خام آن در جدول ناخواناست، پس مرورگر و سیستم‌عامل استخراج می‌شود.
 *
 * تشخیص با ترتیب اهمیت انجام می‌شود چون رشته‌های UA همپوشانی دارند:
 * مثلاً Edge داخل خودش Chrome و Safari هم دارد، و Chrome داخل خودش Safari.
 */

const BROWSERS = [
    [/Edg[eA-Z]*\//, 'Edge'],
    [/OPR\/|Opera/, 'Opera'],
    [/Firefox\//, 'Firefox'],
    [/Chrome\//, 'Chrome'],
    [/Safari\//, 'Safari'],
]

const SYSTEMS = [
    [/Windows NT/, 'Windows'],
    [/iPhone|iPad|iPod/, 'iOS'],
    [/Android/, 'Android'],
    [/Mac OS X/, 'macOS'],
    [/Linux/, 'Linux'],
]

const firstMatch = (ua, table) => table.find(([re]) => re.test(ua))?.[1] ?? null

export function describeDevice(userAgent) {
    if (!userAgent) return 'نامشخص'

    const browser = firstMatch(userAgent, BROWSERS)
    const system = firstMatch(userAgent, SYSTEMS)

    if (browser && system) return `${browser} — ${system}`
    return browser ?? system ?? 'نامشخص'
}
