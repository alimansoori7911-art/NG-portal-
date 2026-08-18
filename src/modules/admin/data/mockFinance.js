/* داده‌ی نمایشی مدیریت مالی — مقادیر عیناً از فیگما.
   TODO: با اتصال به بک‌اند حذف شود.

   ⚠️ وضعیت بک‌اند:
   • تراکنش‌ها: هیچ اندپوینتی وجود ندارد.
   • فاکتورها: هیچ اندپوینتی برای صدور/لیست فاکتور وجود ندارد.
     (/admin/billing-term/ فقط «مدت اعتبار» است، ربطی به فاکتور ندارد.)
   رجوع به BACKEND_NEEDS.md */

/* تراکنش‌ها — ۷ ستون */
export const MOCK_TRANSACTIONS = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    user: '492vcs1',
    trackingCode: '571739112',
    receiptCode: '4523473h',
    source: 'بانک ملت PSP',
    status: 'در حال پرداختی',
    date: '1405/4/12',
}))

/* فاکتورها — ۴ ستون */
export const MOCK_INVOICES = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    index: i + 1,
    user: '492vcs1',
    serial: '571739112',
    issuedAt: '1405/4/12',
}))
