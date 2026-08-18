# بازبینی بک‌اند ngportal

تاریخ: ۱۴۰۵/۰۵/۲۳
دامنه: مرور کد ماژول auth، تنظیمات امنیتی، و ساختار کلی.
این بازبینی از دید مصرف‌کننده‌ی API (فرانت) انجام شده.

---

## 🔴 فوری — امنیتی

### ۱. `.env` واقعی داخل zip بود

فایل `.env` با مقادیر واقعی در آرشیو ارسال شد:
`AUTH__SECRET_KEY`، `SECURITY__AES_KEY`، `SECURITY__HMAC_KEY`،
`SMS__TOKEN`، `EMAIL__PASSWORD`، `REDIS__REDIS_PASSWORD`، `LICENSE__PASSWORD`.

اگر این مقادیر روی staging/production استفاده می‌شوند، **باید چرخانده شوند**.
`.gitignore` فایل را نادیده می‌گیرد ولی zip آن را برداشته است.

پیشنهاد: هنگام اشتراک‌گذاری فقط `.env.example` فرستاده شود.

### ۲. `POST /auth/password/change` هیچ کاری نمی‌کند

```python
@login_required()
def change_password(body: ChangedInput):
    return {"message": "Your credentials have been changed successfully"}, 200
```

تابع فقط پیام موفقیت برمی‌گرداند — نه رمز عوض می‌شود، نه چیزی ذخیره
می‌شود. کاربر فکر می‌کند رمزش عوض شده در حالی که نشده.

ضمناً `ChangedInput` فیلد `old_password` ندارد. وقتی پیاده‌سازی شد،
تأیید رمز فعلی لازم است وگرنه هرکس به یک نشست باز دسترسی پیدا کند
می‌تواند حساب را تصاحب کند.

**اثر روی فرانت:** فرم تغییر رمز ساخته نشده چون این اندپوینت آماده نیست.

### ۳. CORS روی `*` با `allow_credentials=True`

```python
allow_origins: list[str] = Field(default_factory=lambda: ["*"])  # FIXME!!!
allow_credentials: bool = True
```

خودتان `FIXME` گذاشته‌اید، فقط یادآوری: این ترکیب یعنی هر سایتی
می‌تواند با کوکی کاربر درخواست بزند. مرورگرها معمولاً `*` را با
credentials رد می‌کنند، ولی اگر لایه‌ای آن را به origin واقعی بازتاب
دهد، CSRF کامل می‌شود.

---

## 🟡 مهم — منطقی

### ۴. `samesite="Lax"` با فرانت روی دامنه‌ی متفاوت کار نمی‌کند

کوکی‌ها با `SameSite=Lax` ست می‌شوند. اگر فرانت و بک‌اند روی دامنه یا
پورت متفاوت باشند (که در dev هست)، کوکی در درخواست‌های XHR فرستاده
نمی‌شود و رفرش توکن می‌شکند.

برای cross-site باید `SameSite=None; Secure` باشد.

### ۵. `secure=True` در محیط توسعه

کوکی‌ها همیشه `secure=True` دارند، یعنی فقط روی HTTPS ست می‌شوند.
روی `http://localhost` کوکی اصلاً ذخیره نمی‌شود.

پیشنهاد: از روی `settings` قابل تنظیم باشد.

### ۶. Rate limit فقط یک عدد در تنظیمات است

```python
login_rate_limit: int = 5  # TODO: cors
```

مقدار تعریف شده ولی جایی اعمال نمی‌شود (Flask-Limiter یا معادلش نصب
نیست). اسپک برای `/auth/login` و `/auth/otp/request` پاسخ ۴۲۹ تعریف
کرده — فرانت هم آن را هندل می‌کند — ولی عملاً هیچ‌وقت رخ نمی‌دهد.

---

## 🟢 نکات کوچک

### ۷. نام‌های اشتباه تایپی

- `HashPassowrd` → `HashPassword`
- `core/pagintion.py` → `pagination.py`
- `core/middleware/requst_id.py` → `request_id.py`

الان کار می‌کنند ولی موقع جستجو و import گیج‌کننده‌اند.

### ۸. فایل `t.py` در ماژول auth

نام یک‌حرفی برای فایلی که enumهای مهم دارد (`IdentifierType`،
`KycStatus`). `types.py` گویاتر است.

### ۹. `__pycache__` داخل zip

پوشه‌های `__pycache__` در آرشیو بودند. `.gitignore` دارد ولی zip
شاملشان شده.

---

## ✅ نقاط قوت

مواردی که خوب پیاده شده‌اند:

- **ساختار ماژولار تمیز** — `core/` و `modules/` جدا، هر ماژول
  `routes/service/repository/schemas` مستقل دارد.
- **JWT درست پیکربندی شده** — `require: [exp, iat, jti, sub, sid]` با
  `audience` و `issuer` و `leeway`.
- **محافظت در برابر timing attack** در لاگین — وقتی کاربر پیدا نشود
  هم یک hash ساختگی verify می‌شود.
- **`reset_user_password` همه‌ی نشست‌ها را باطل می‌کند** — رفتار درست.
- **پاسخ استاندارد `{data, meta}`** با `request_id` — کار فرانت را
  خیلی راحت کرده.
- **مستندسازی** — `docs/architecture.md` و `TODO.md` به‌روز و صادقانه.

---

## پیشنهاد اولویت

1. `.env` — کلیدها چرخانده شوند (فوری)
2. `password/change` — یا پیاده شود یا ۵۰۱ برگرداند تا فرانت گمراه نشود
3. CORS — origin مشخص شود
4. کوکی — `SameSite` و `secure` از تنظیمات بیایند
