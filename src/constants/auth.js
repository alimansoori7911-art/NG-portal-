// مقادیر همگام با تنظیمات بک‌اند (AUTH__OTP_SETTING__*)
export const OTP = {
    LENGTH: 6,                    // OTP_LENGTH=6
    COOLDOWN_SECONDS: 60,         // OTP_COOLDOWN_SECONDS=60
    EXPIRY_MS: 5 * 60 * 1000,     // OTP_EXPIRY_SECONDS=300
    MAX_ATTEMPTS: 5,              // OTP_MAX_ATTEMPTS=5
}

// کدهای وضعیت و معنی‌شان در این پروژه
export const HTTP = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,              // کد OTP منقضی شده
    VALIDATION_ERROR: 422,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,   // اختلال در سرویس پیامک
}

export const MSG = {
    OTP_WRONG: 'کد وارد شده صحیح نمی باشد',
    OTP_EXPIRED: 'مهلت کد تأیید تمام شد؛ کد جدید برایتان ارسال شد.',
    RATE_LIMIT: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره امتحان کنید.',
    SMS_DOWN: 'ارسال پیامک موقتاً ممکن نیست. لطفاً بعداً تلاش کنید.',
    NATIONAL_ID_INVALID: 'کد ملی وارد شده صحیح نیست',
    GENERIC: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
}

/** تبدیل ارقام فارسی و عربی به لاتین — کاربر ممکن است با کیبورد فارسی تایپ کند */
export function toEnglishDigits(value = '') {
    return String(value)
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
}