/* داده‌ی نمونه — دقیقاً مطابق اسکیمای RefreshToken در OpenAPI.
   TODO: با اتصال به بک‌اند حذف شود (authService.getSessions).

   فیلدها: id, session_started_at, ip_address, user_agent, revoked
   ip_address و user_agent در نسخه‌ی جدید اسپک اضافه شده‌اند.

   ⚠️ زمان‌ها UTC هستند (همان‌طور که بک‌اند می‌فرستد) و موقع نمایش به
   وقت محلی تبدیل می‌شوند. 00:51:07Z در تهران می‌شود ۴:۲۱:۰۷ —
   یعنی همان چیزی که در فیگما نوشته شده. */
export const MOCK_SESSIONS = [
    {
        id: 1531054,
        session_started_at: '2025-07-12T00:51:07Z',
        ip_address: '192.168.1.24',
        user_agent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        revoked: false,
    },
    {
        id: 567122,
        session_started_at: '2025-07-12T00:51:07Z',
        ip_address: '10.0.0.8',
        user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile Safari/604.1',
        revoked: false,
    },
    {
        id: 7447128,
        session_started_at: '2025-07-12T00:51:07Z',
        ip_address: '172.16.4.91',
        user_agent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/128.0',
        revoked: false,
    },
]
