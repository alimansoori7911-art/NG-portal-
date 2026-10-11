# قرارداد CMS — صفحه‌های عمومی (استاتیک سابق)

این سند جواب این درخواست است: «دیتای صفحه‌های اصلی را چطور
می‌خواهید؛ اسم‌هاشو بگویید و یک قرارداد مشترک بنویسیم».

همه‌ی اسم‌ها پیشنهاد ماست؛ اگر جایی با مدل شما نمی‌خواند بگویید تا
عوض کنیم. فقط لطفاً پیش از ساختن، بند ۵ («موارد باز») را ببینید —
دو جا هست که اسکمای فعلی جواب نمی‌دهد و بهتر است اول تصمیم بگیریم.

## ۰. قواعدی که از اسپک خودتان درآوردیم

قرارداد را عمداً با همان واژگانی نوشته‌ایم که CMS الان دارد، تا چیز
جدیدی لازم نشود:

- `BlockType` فقط پنج مقدار دارد:
  **`TEXT` | `RICH_TEXT` | `IMAGE` | `CARD_LIST` | `CTA`**
- کارت‌های تکرارشونده با `CARD_LIST` + `items` + `max_items` بیان
  می‌شوند (همان `CmsStructuredItemSpecOut`).
- هر صفحه `PageKind = STRUCTURED` با یک `schema_key` است.
- نمونه‌ی `schema_key: "home"` الان هم در مک ما هست و همین الگو را
  برای بقیه ادامه دادیم.

کلیدها لاتین و `snake_case`؛ متن‌ها فارسی.

## ۱. فهرست صفحه‌ها (`schema_key`)

| `schema_key` | مسیر فعلی | عنوان |
|---|---|---|
| `home` | `/` | صفحه‌ی اصلی |
| `company` | `/company` | درباره‌ی ما |
| `services` | `/services` | خدمات |
| `products` | `/products` | محصولات |
| `resources` | `/resources` | مرکز منابع |
| `contact` | `/contact` | تماس با ما |
| `site_footer` | همه‌ی صفحات | فوتر |

`terms` را عمداً نیاوردیم: الان `kind: ARTICLE` است و متن بلند حقوقی
دارد؛ همین شکل مناسب‌تر است. اگر مخالفید بگویید.

## ۲. بلوک‌های هر صفحه

این بلوک‌ها از کد واقعی فعلی درآمده‌اند، نه حدسی.

### `home`

| `key` | `type` | فیلدها |
|---|---|---|
| `hero` | `TEXT` | `heading`, `subheading` |
| `product_intro` | `TEXT` | `section_title`, `heading`, `body` |
| `features` | `CARD_LIST` | بلوک: `section_title` — هر آیتم: `title`, `description` (`max_items: 6`) |
| `why_ng` | `TEXT` | `heading`, `body` |
| `plans_intro` | `TEXT` | `section_title` |
| `company_brand` | `CARD_LIST` | بلوک: `section_title`, `heading`, `body` — هر آیتم: `label` |
| `clients` | `IMAGE` | `image_url`, `alt` |

در `features` الان دقیقاً ۶ کارت داریم.

### `company`

| `key` | `type` | فیلدها |
|---|---|---|
| `hero` | `TEXT` | `heading`, `subheading` |
| `intro` | `CARD_LIST` | بلوک: `section_title`, `body` — هر آیتم: `title`, `description` (الان ۵ تا) |
| `mission` | `RICH_TEXT` | `heading`, `body` |
| `vision` | `RICH_TEXT` | `heading`, `body` |
| `history` | `CARD_LIST` | بلوک: `section_title` — هر آیتم: `year`, `title`, `description` (الان ۵ تا، ترتیب زمانی) |

`mission` و `vision` را دو بلوک جدا گرفتیم چون در صفحه هم دو کارت
جداگانه‌اند («ماموریت» و «چشم انداز»)، نه یک متن.

### `services`

| `key` | `type` | فیلدها |
|---|---|---|
| `hero` | `TEXT` | `heading`, `subheading` |
| `hero_points` | `CARD_LIST` | هر آیتم: `label`, `icon` (الان ۳ تا) |
| `services` | `CARD_LIST` | بلوک: `section_title` — هر آیتم: `title`, `description`, `icon` (الان ۹ تا) |
| `lifecycle` | `CARD_LIST` | بلوک: `section_title` — هر آیتم: `title`, `subtitle`, `icon` (الان ۸ تا، ترتیبش معنادار است) |
| `advantages` | `CARD_LIST` | بلوک: `section_title` — هر آیتم: `title`, `description`, `icon` (الان ۴ تا) |

`lifecycle` چرخه‌ی مرحله‌به‌مرحله است، پس ترتیبش معنا دارد — بند ۵.۲.

### `products`

| `key` | `type` | فیلدها |
|---|---|---|
| `hero` | `TEXT` | `heading`, `subheading` |
| `what_is` | `CARD_LIST` | بلوک: `section_title`, `body` — هر آیتم: `title_fa`, `title_en`, `description` |
| `details` | `CARD_LIST` | هر آیتم: `title_fa`, `title_en`, `subtitle`, `body`, `image_url` |
| `demo_cta` | `CTA` | `label`, `url`, `variant` |

❗ پلن‌ها **نباید** در CMS بیایند — بند ۳ را ببینید.

دو نکته‌ی این صفحه:

- کارت‌هایش **دوزبانه** است: عنوان فارسی و انگلیسی جدا نمایش داده
  می‌شوند (مثلاً «هوشمندی ریسک» + `Risk intelligence`). پس دو فیلد
  جدا می‌خواهیم، نه یکی.
- در `details` هر آیتم الان چند پاراگراف دارد (آرایه‌ی `paragraphs`).
  اگر `body` از نوع `RICH_TEXT` بگیریم، چند پاراگراف داخل همان یک
  فیلد جا می‌شود و فیلد آرایه‌ای لازم نیست. اگر `kind` داخل آیتم
  اجازه‌ی `rich_text` نمی‌دهد بگویید تا راه دیگری بگذاریم.

### `resources`

| `key` | `type` | فیلدها |
|---|---|---|
| `hero` | `TEXT` | `heading`, `subheading` |
| `topics` | `CARD_LIST` | هر آیتم: `label` (الان ۵ تا) |
| `categories` | `CARD_LIST` | هر آیتم: `title`, `description`, `icon` (الان ۶ تا) |
| `featured` | `CARD_LIST` | هر آیتم: `title`, `description`, `badge`, `icon` (الان ۴ تا) |
| `popular` | `CARD_LIST` | بلوک: `section_title` — هر آیتم: `label` (الان ۶ تا) |

فهرست مقاله‌ها از CMS مقالات (`kind: ARTICLE`) می‌آید، نه اینجا.

در `categories` دو فیلد `ready` و `to` را عمداً نیاوردیم: این دو
می‌گویند مقصد کارت ساخته شده یا نه و کارت را لینک‌دار می‌کنند. این
وضعیت راوتر فرانت است نه محتوای تحریریه، و مثل منوی هدر باید در کد
بماند (بند ۳).

### `contact`

| `key` | `type` | فیلدها |
|---|---|---|
| `hero` | `TEXT` | `heading`, `subheading` |
| `channels` | `CARD_LIST` | هر آیتم: `label`, `value`, `icon` (`max_items: 8`) |
| `form_intro` | `TEXT` | `heading`, `body` |

مقادیر واقعی فعلی `channels`: تلفن `02122500058`،
`Info@ngcorion.com`، `Support@taktacom.com` (روی دامنه‌ی taktacom است،
عمدی و غلط تایپی نیست)، `Sales@ngcorion.com`، اینستاگرام `@ngcorion`.

مورد `icon` را در بند ۵ توضیح داده‌ایم.

### `site_footer`

| `key` | `type` | فیلدها |
|---|---|---|
| `about` | `TEXT` | `heading`, `body` |
| `contact` | `TEXT` | `email`, `phone`, `address` |
| `link_groups` | `CARD_LIST` | هر آیتم: `group_title`, `label`, `url` |
| `newsletter` | `TEXT` | `heading`, `placeholder`, `button_label` |

## ۳. چیزهایی که **نباید** در CMS باشند

این مهم‌ترین بند این سند است.

منوی هدر و پلن‌های فروش را در قرارداد نیاوردیم، چون:

- **منوی هدر** به مسیرهای راوتر گره خورده و بعضی آیتم‌هایش `authOnly`
  است (فقط برای کاربر لاگین‌کرده). اگر متنش از CMS بیاید ولی مسیرش
  در کد باشد، دو جای جدا باید همزمان عوض شوند و سرانجام لینک شکسته
  می‌دهد.
- **پلن‌های فروش** الان از `usePlans()` یعنی API محصولات می‌آیند. اگر
  نام/قیمت پلن در CMS هم ثبت شود، دو منبع حقیقت داریم و بالاخره
  قیمت‌ها واگرا می‌شوند.

فقط یک شکاف واقعی در پلن‌ها داریم: زیرعنوان کوتاه بازاریابی.
`description` شما متن بلند است و در کارت جا نمی‌شود، پس الان در فرانت
هاردکد است (`SHORT_SUBTITLES`). بهترین جایش CMS نیست، یک فیلد
`short_description` کنار خود پلن است. اگر اضافه‌اش کنید، هاردکد را
حذف می‌کنیم.

## ۴. چیزی که از سمت شما لازم داریم

برای خواندن این صفحات در سایت عمومی، مسیرهای `/admin/cms/*` به کار
نمی‌آیند (دسترسی ادمین می‌خواهند و بازدیدکننده‌ی مهمان ندارد). یک
مسیر عمومی لازم داریم:

```
GET /landing/pages/{schema_key}
    → { schema_key, title, blocks: [{ key, type, fields, items }] }
```

فقط نسخه‌ی `PUBLISHED` را برگرداند (نه `DRAFT`)، بدون احتیاج به توکن.
کش چندلایه‌ی خودتان روی همین مسیر کاملاً مناسب است؛ ما poll نمی‌کنیم
و فقط در لحظه‌ی لود صفحه می‌خوانیم.

اگر یک درخواست برای چند صفحه برایتان راحت‌تر است، شکل
`GET /landing/pages?keys=home,site_footer` هم برای ما اوکی است —
فوتر در همه‌ی صفحات لازم می‌شود.

## ۵. دو مورد باز — لطفاً پیش از ساخت تصمیم بگیریم

### ۵.۱ آیکون در کارت‌ها

در `contact.channels` و چند جای دیگر، آیکون الان **کامپوننت ریکت**
است (`Phone`, `Mail`, ...) نه URL. اگر `icon_url` بگیریم، باید برای هر
آیکون یک فایل آپلود شود و کیفیت برداری و هماهنگی رنگ با تم را از دست
می‌دهیم.

پیشنهاد: فیلد `icon` از نوع **اسم آیکون** (enum کوتاه) باشد نه فایل:
مقادیر مجاز `phone | mail | support | sales | instagram | linkedin`.
فرانت اسم را به آیکون تبدیل می‌کند. اگر اسم ناشناخته بیاید، ما آیکون
پیش‌فرض می‌گذاریم و صفحه نمی‌شکند.

اگر `kind` در `CmsStructuredFieldSpecOut` مقدار enum ندارد، همان
`kind: "string"` با `max_length` کوتاه هم کافی است.

### ۵.۲ ترتیب آیتم‌های `CARD_LIST`

ترتیب کارت‌ها دیده می‌شود، پس باید پایدار باشد. در
`CmsStructuredItemSpecOut` فیلد ترتیب ندیدیم.

سؤال: ترتیب آرایه‌ی `items` تضمین‌شده است؟ اگر بله، همین کافی است و
چیزی لازم نیست. اگر نه، یک فیلد `sort_order` لازم داریم، وگرنه ترتیب
کارت‌ها بین دو بار لود عوض می‌شود.

## ۶. چطور جلو برویم

از نظر ما ترتیب خوب این است:

1. شما بند ۵ را جواب بدهید (آیکون و ترتیب).
2. این هفت `schema_key` را با بلوک‌هایش در بک‌اند ثبت کنید و در
   `GET /admin/cms/structured-schemas` بیاورید.
3. `GET /landing/pages/{schema_key}` را بدهید.
4. ما متن‌های فعلی را به‌عنوان مقدار اولیه می‌دهیم (همه در همین ریپو
   هست) تا سایت خالی منتشر نشود.
5. صفحه‌به‌صفحه وصل می‌کنیم؛ از `home` و `site_footer` شروع.

تا وقتی مرحله‌ی ۳ نیامده، صفحات عمومی همین متن هاردکد را نشان
می‌دهند و جایی نمی‌شکند.
