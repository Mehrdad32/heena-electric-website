# Heena Electric — Static Product Catalog

سایت فارسی و راست‌به‌چپ هینا الکتریک. بدون فریم‌ورک و وابستگی هنگام اجرا؛ مناسب Cloudflare Pages و GitHub Pages.

## توسعه محلی

- Node.js 20+ نصب باشد.
- اطلاعات شرکت و شماره تماس را در `data/site.json` وارد کنید: `phoneE164` برای لینک `tel:` (مثلاً با قالب بین‌المللی) و `phoneDisplay` برای نمایش.
- تصاویر واقعی هر محصول را در `assets/images/` قرار دهید و مسیر آنها را در `data/products.json`، فیلدهای `mainImage` و `gallery` ثبت کنید.
- قیمت‌ها را در فیلد `priceToman` به‌صورت عدد صحیح (تومان) ثبت کنید. تا قبل از دریافت قیمت، مقدار `null` بماند.
- برای افزودن مشخصات معتبر، آرایه `specs` را با `{ "label": "...", "value": "..." }` پر کنید. از درج مشخصات حدسی خودداری شود.
- در ریشه مخزن دستور `npm run build` را اجرا و فایل‌های HTML تولیدی، `robots.txt` و `sitemap.xml` را commit کنید.

## انتشار

فایل‌های خروجی از پیش در ریشه مخزن تولید می‌شوند. برای Cloudflare Pages با Git integration، در صورت نیاز، Build command را خالی و Build output directory را `/` یا `.` (ریشه مخزن) تنظیم کنید؛ هنگام تغییر از وضعیت فعلی پروژه مطمئن شوید. هیچ GitHub Actions Workflow سفارشی لازم نیست.

**ایمنی انتشار:** توسعه ابتدا در شاخه `feat/product-catalog-foundation` انجام شده؛ شاخه `main` و نسخه تولیدی نباید پیش از بازبینی و ادغام تغییر کنند.

## SEO

HTML صفحات به‌صورت ایستا تولید می‌شود و هر محصول URL، title، description، canonical، Open Graph و داده ساخت‌یافته Product/BreadcrumbList اختصاصی دارد. قیمت در schema فقط در صورت درج قیمت واقعی قرار می‌گیرد. وضعیت سئو پس از ثبت دامنه و ارسال نقشه سایت به Google Search Console قابل پیگیری است.
