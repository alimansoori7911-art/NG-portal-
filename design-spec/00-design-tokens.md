# NGCorion — Design Tokens

> همه اندازه‌ها برای **فریم دسکتاپ 1440px** هستند و از اسکرین‌شات‌های کم‌کیفیت اندازه‌گیری و به گرید 4/8 گرد شده‌اند (خطای تقریبی ±4px تا ±8px).
> صفحه «مرکز منابع» دقیق‌ترین مرجع است (رزولوشن 2 برابر بقیه). اگر بین صفحات اختلاف دیدی، مقدار این فایل ملاک است.

## Frame & Layout

| Token | Value | توضیح |
|---|---|---|
| Frame width | 1440px | |
| Container max-width | 1312px | گاتر چپ/راست 64px |
| Direction | `rtl` | `<html dir="rtl" lang="fa">` |
| Grid gap (cards) | 24px | همه گریدهای کارت |
| Section padding-y | 48px | فاصله عمودی بین سکشن‌ها |
| Section title → content | 24px | فاصله زیر عنوان/زیرعنوان سکشن تا گرید |

## Colors (sampled from screenshots)

| Token | Hex | کاربرد |
|---|---|---|
| `--bg` | `#020D1B` | پس‌زمینه کل صفحه، هدر، فوتر |
| `--bg-deep` | `#010A16` | پس‌زمینه باکس فهرست مطالب |
| `--surface` | `#03142D` | پس‌زمینه کارت‌ها |
| `--surface-2` | `#0A1F44` | باکس شماره‌ها، بج آبی، آیکون‌باکس |
| `--surface-active` | `#0A2A6B` | کارت active / hover |
| `--border` | `#0B1D38` | بوردر کم‌رنگ کارت‌ها و جداکننده‌ها |
| `--border-glow` | `#1D4ED8` @ 55% | بوردر کارت‌های نئونی |
| `--divider` | `#08182F` | خط زیر هدر، خط بین سکشن‌ها، خط فوتر |
| `--primary` | `#0A63F6` | دکمه اصلی، آیتم فعال |
| `--primary-hover` | `#2B7BFF` | hover دکمه اصلی |
| `--link` | `#4D8DFF` | لینک‌های «مشاهده …» ، breadcrumb فعال |
| `--icon` | `#3B8BFF` | آیکون‌های خطی آبی نئونی |
| `--text` | `#FFFFFF` | عناوین |
| `--text-2` | `#D3DBEE` | متن بدنه |
| `--text-muted` | `#9AA3B4` | توضیحات، تاریخ، کپشن |
| `--badge-gray` | `#363D45` | بج خاکستری (امنیت، دانلودها) |

### Glow / Shadow

```css
--glow-sm: 0 0 16px rgba(10, 99, 246, 0.25);
--glow-md: 0 0 24px rgba(10, 99, 246, 0.35), inset 0 0 32px rgba(10, 99, 246, 0.10);
--glow-lg: 0 0 40px rgba(10, 99, 246, 0.55), inset 0 0 48px rgba(10, 99, 246, 0.18); /* کارت active */
--icon-glow: drop-shadow(0 0 8px rgba(59, 139, 255, 0.8));
```

کارت‌ها یک گرادیان خیلی ملایم دارند: `linear-gradient(180deg, #04183A 0%, #020E22 100%)`
بوردر: `1px solid rgba(29, 78, 216, 0.45)`

## Typography

فونت اصلی احتمالاً **Yekan Bakh / IRANYekanX** است (از روی شکل حروف). اگر لایسنس نداری → `Vazirmatn` (Google Fonts).
اعداد در تاریخ‌ها فارسی‌اند (۱۴۰۵/۰۶/۱۲). اعداد شماره‌گذاری (01، 02…) لاتین‌اند.

| Token | Size / Line-height | Weight | کاربرد |
|---|---|---|---|
| `h1` | 40 / 56 | 800 | عنوان hero |
| `h2` | 24 / 36 | 700 | عنوان سکشن‌ها (در صفحه خدمات، عناوین وسط‌چین: 28/40) |
| `h3` | 18 / 28 | 700 | عنوان کارت |
| `h3-lg` | 22 / 32 | 700 | عنوان کارت‌های قوانین |
| `lead` | 18 / 32 | 400 | پاراگراف hero |
| `body` | 15 / 28 | 400 | متن کارت‌ها (در قوانین: 15 / 32) |
| `small` | 14 / 24 | 400 | زیرعنوان سکشن، توضیح کارت، لینک‌ها |
| `caption` | 12 / 20 | 400 | بج، تاریخ، «PDF ۱۲ صفحه»، کپشن لوگو |
| `nav` | 15 / 24 | 500 | منوی هدر |
| `button` | 14 / 20 | 700 | دکمه‌ها |

## Radius

| Token | Value |
|---|---|
| `--r-sm` | 6px — دکمه‌ها، بج، اینپوت‌های کوچک، آیکون‌باکس |
| `--r-md` | 8px — کارت‌ها، سرچ‌باکس |
| `--r-lg` | 12px — باکس‌های بزرگ (CTA، «چرا خدمات»، لینک‌های مرتبط، فهرست مطالب) |
| `--r-full` | 999px — دایره‌های چرخه خدمات |

## Buttons

| نوع | ابعاد | استایل |
|---|---|---|
| Primary (هدر) | 136 × 44 | bg `--primary`، متن سفید 14/700، radius 6، `--glow-sm` |
| Primary (CTA/hero) | min-w 172 × 48، padding-x 24 | + آیکون فلش `ArrowLeft` 18px، gap 12 |
| Outline | min-w 136 × 48 | bg شفاف، بوردر `1px solid #3A4557`، متن سفید |
| Icon button (منو) | 44 × 44 | bg `--surface`، بوردر `--border`، آیکون `Menu` 20px |

## Icons

سبک: خطی (outline)، stroke 1.75، رنگ `--icon` با `--icon-glow`. کتابخانه پیشنهادی: **lucide-react**.
سایزها: 20px (دکمه/لیست) · 24px (آیکون‌باکس کوچک) · 40px (کارت دسته‌بندی) · 48–56px (کارت خدمات و چرخه).

## CSS Variables (copy-ready)

```css
:root {
  --bg:#020D1B; --bg-deep:#010A16; --surface:#03142D; --surface-2:#0A1F44; --surface-active:#0A2A6B;
  --border:#0B1D38; --border-glow:rgba(29,78,216,.55); --divider:#08182F;
  --primary:#0A63F6; --primary-hover:#2B7BFF; --link:#4D8DFF; --icon:#3B8BFF;
  --text:#FFFFFF; --text-2:#D3DBEE; --text-muted:#9AA3B4; --badge-gray:#363D45;
  --r-sm:6px; --r-md:8px; --r-lg:12px;
  --container:1312px; --gutter:64px; --gap:24px; --section-y:48px;
}
```
