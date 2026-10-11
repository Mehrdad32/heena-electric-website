import {readFile,mkdir,writeFile} from "node:fs/promises";
import {dirname} from "node:path";

function buildCatalog(site,products){
  const esc=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const json=v=>JSON.stringify(v).replace(/</g,"\\u003c");
  const url=path=>site.domain.replace(/\/$/,"")+path;
  const fnum=n=>new Intl.NumberFormat("fa-IR").format(n);
  const price=p=>typeof p.priceToman==="number"&&p.priceToman>=0?`${fnum(p.priceToman)} تومان`:"قیمت به‌زودی";
  const contact=site.phoneE164&&/^\+?[0-9]{8,15}$/.test(site.phoneE164);
  const action=(p,compact=false)=>contact?`<a class="btn btn-primary${compact?" btn-small":""}" href="tel:${esc(site.phoneE164)}" aria-label="تماس برای خرید ${esc(p?.name||"محصولات")}">تماس برای خرید <span aria-hidden="true">↗</span></a>`:`<button class="btn btn-muted${compact?" btn-small":""}" type="button" disabled title="شماره تماس هنوز ثبت نشده است">شماره تماس به‌زودی</button>`;
  const viz=(p,large=false)=>p.mainImage?`<img class="product-photo" src="${esc(p.mainImage)}" alt="تصویر ${esc(p.name)}" loading="${large?"eager":"lazy"}" decoding="async">`:`<div class="visual-fallback${large?" visual-large":""}" role="img" aria-label="جای تصویر ${esc(p.name)}">
    <svg viewBox="0 0 160 160" fill="none" aria-hidden="true"><path d="M80 13 131 35v39c0 34-22 56-51 73C51 130 29 108 29 74V35L80 13Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="m88 43-31 40h23l-7 37 32-46H83l5-31Z" fill="currentColor"/><circle cx="80" cy="80" r="72" stroke="currentColor" stroke-opacity=".12" stroke-dasharray="4 10"/></svg>
    <span>تصویر محصول به‌زودی</span></div>`;
  const card=(p,i)=>`<article class="product-card" style="--i:${i}"><a class="card-visual" href="/products/${p.slug}/" aria-label="مشاهده ${esc(p.name)}">${viz(p)}</a>
    <div class="card-body"><span class="eyebrow">${esc(p.category)}</span><h3><a href="/products/${p.slug}/">${esc(p.name)}</a></h3><p>${esc(p.subtitle)}</p>
    <div class="card-bottom"><strong class="price">${price(p)}</strong><a class="text-link" href="/products/${p.slug}/">مشاهده محصول <span aria-hidden="true">←</span></a></div><div class="card-action">${action(p,true)}</div></div></article>`;
  const org={"@context":"https://schema.org","@type":"Organization",name:site.brand,url:site.domain,...(contact?{telephone:site.phoneE164}:{})};
  const crumb=(items)=>({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map(([name,path],i)=>({"@type":"ListItem",position:i+1,name,item:url(path)}))});
  const header=`<a class="skip-link" href="#content">رفتن به محتوای اصلی</a><header class="header"><div class="container nav">
    <a class="brand" href="/" aria-label="هینا الکتریک - صفحه اصلی"><img src="/assets/logo.jpg" alt="لوگوی هینا الکتریک" width="43" height="43"><span><strong>هینا الکتریک</strong><small>HEENA ELECTRIC</small></span></a>
    <nav class="nav-links" aria-label="ناوبری اصلی"><a href="/">صفحه اصلی</a><a href="/products/">محصولات</a><a href="/#about">درباره محصولات</a></nav>
    <a class="nav-cta" href="/#contact">ارتباط با ما <span aria-hidden="true">↖</span></a>
    </div></header>`;
  const footer=`<footer class="footer"><div class="container footer-inner"><div><div class="footer-brand">هینا<span> الکتریک</span></div><p>آشنایی با انواع محافظ برق و مشاهده اطلاعات محصولات</p></div><nav aria-label="پیوندهای پایین صفحه"><a href="/">صفحه اصلی</a><a href="/products/">محصولات</a><a href="/#contact">تماس</a></nav></div><div class="container footer-copy">© ${new Intl.DateTimeFormat("fa-IR",{year:"numeric",timeZone:"UTC"}).format(new Date())} هینا الکتریک • تمامی حقوق محفوظ است.</div></footer>`;
  const head=(title,description,path,schemas=[],image="")=>`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08121f"><meta name="robots" content="index,follow,max-image-preview:large"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url(path))}"><meta property="og:locale" content="fa_IR"><meta property="og:type" content="${path.startsWith("/products/")&&path!=="/products/"?"product":"website"}"><meta property="og:site_name" content="${esc(site.brand)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url(path))}"><meta name="twitter:card" content="summary_large_image">${image?`<meta property="og:image" content="${esc(url(image))}">`:""}<link rel="icon" href="/assets/logo.jpg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/style.css">${schemas.map(s=>`<script type="application/ld+json">${json(s)}</script>`).join("")}</head><body>${header}`;
  const end=`${footer}</body></html>`;
  const sectionTitle=(kicker,title,extra="")=>`<div class="section-heading"><div><span class="kicker">${kicker}</span><h2>${title}</h2></div>${extra}</div>`;
  const contactSection=`<section id="contact" class="contact-section"><div class="container"><div class="contact-panel"><div><span class="kicker">ارتباط و سفارش</span><h2>برای انتخاب محافظ مناسب مشاوره بگیرید</h2><p>برای اطلاع از قیمت، موجودی و سفارش، پس از درج شماره تماس می‌توانید مستقیم با مجموعه ارتباط بگیرید.</p></div><div>${action(null)}${contact?`<span class="contact-number" dir="ltr">${esc(site.phoneDisplay||site.phoneE164)}</span>`:""}</div></div></div></section>`;
  const home=`${head("هینا الکتریک | انواع محافظ برق و ولتاژ",site.description,"/",[org])}
    <main id="content"><section class="hero"><div class="container hero-grid"><div class="hero-content"><span class="pill"><span class="live-dot"></span> کاتالوگ محصولات هینا الکتریک</span>
    <h1>انتخابی دقیق برای <em>محافظت از تجهیزات برقی</em></h1><p>از تجهیزات صوتی و تصویری تا یخچال، پکیج و لوازم خانگی؛ محصولات محافظ برق هینا الکتریک را در یک نگاه ببینید و جزئیات هر مدل را بررسی کنید.</p><div class="hero-actions"><a class="btn btn-primary" href="/products/">مشاهده همه محصولات <span aria-hidden="true">←</span></a><a class="btn btn-outline" href="#contact">تماس و سفارش</a></div>
    <div class="hero-meta"><span><strong>۵</strong> گروه محصول</span><span><strong>۱۰ / ۳۰</strong> آمپر در مدل‌های مشخص‌شده</span></div></div>
    <div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="hero-shield"><svg viewBox="0 0 180 210" fill="none"><path d="M90 9 165 43v57c0 48-32 77-75 101-43-24-75-53-75-101V43L90 9Z" stroke="currentColor" stroke-width="5"/><path d="m99 47-49 65h41l-11 55 51-75H94l5-45Z" fill="currentColor"/></svg></div><div class="float-chip chip-one">محافظ صوتی و تصویری</div><div class="float-chip chip-two">محافظ ۳۰ آمپری</div><div class="float-chip chip-three">محافظ یخچال و فریزر</div></div></div></section>
    <section class="section products-section" id="products"><div class="container">${sectionTitle("مجموعه محصولات","محافظ مناسب دستگاه شما",'<a class="section-link" href="/products/">همه محصولات ←</a>')}<div class="product-grid">${products.map(card).join("")}</div></div></section>
    <section class="section info-section" id="about"><div class="container info-grid"><div><span class="kicker">درباره محصولات</span><h2>پنج گروه محصول، یک مسیر ساده برای انتخاب</h2><p>در صفحات اختصاصی هر محصول، تصویر، کاربرد، جریان نامی (در صورت اعلام)، مشخصات فنی تأییدشده و قیمت درج خواهد شد. اطلاعات نامشخص به‌صورت شفاف مشخص شده‌اند.</p><a class="text-link" href="/products/">بررسی فهرست کامل ←</a></div><div class="info-boxes"><div><span class="info-num">۰۱</span><strong>مقایسه کاربرد</strong><p>مدل‌ها را بر اساس دستگاه مورد استفاده مرور کنید.</p></div><div><span class="info-num">۰۲</span><strong>اطلاعات قابل اتکا</strong><p>مشخصات هر مدل با دریافت اطلاعات رسمی تکمیل می‌شود.</p></div></div></div></section>
    ${contactSection}</main>${end}`;
  const listingPath="/products/";
  const list=`${head("محصولات محافظ برق هینا الکتریک | فهرست کامل",site.description,listingPath,[org,crumb([["خانه","/"],["محصولات",listingPath]])])}<main id="content">
    <section class="page-top"><div class="container"><div class="breadcrumbs"><a href="/">خانه</a><span> / </span><span>محصولات</span></div><span class="kicker">کاتالوگ هینا الکتریک</span><h1>تمام محصولات</h1><p>پنج گروه محافظ برق برای کاربردهای مختلف. برای دیدن تصویر، قیمت و مشخصات هر محصول، صفحه اختصاصی آن را باز کنید.</p></div></section>
    <section class="section section-topless"><div class="container"><div class="product-grid">${products.map(card).join("")}</div></div></section>${contactSection}</main>${end}`;
  const files={"index.html":home,"products/index.html":list};
  for(const p of products){
    const path=`/products/${p.slug}/`;
    const ld={"@context":"https://schema.org","@type":"Product",name:p.name,description:p.description,category:p.category,url:url(path),
      ...(p.mainImage?{image:[url(p.mainImage),...p.gallery.map(url)]}:{}),
      ...(typeof p.priceToman==="number"?{offers:{"@type":"Offer",priceCurrency:"IRR",price:String(p.priceToman*10),url:url(path)}}:{})};
    const specRows=[...(p.amperage?[["جریان نامی اعلام‌شده",p.amperage]]:[]),["کاربرد اعلام‌شده",p.applications.join("، ")],...p.specs.map(s=>[s.label,s.value])];
    const gallery=p.gallery.length?`<div class="gallery">${p.gallery.map((image,i)=>`<img src="${esc(image)}" alt="نمای ${fnum(i+2)} ${esc(p.name)}" loading="lazy">`).join("")}</div>`:"";
    files[`products/${p.slug}/index.html`]=`${head(`${p.name} | مشخصات و قیمت | هینا الکتریک`,p.description,path,[ld,crumb([["خانه","/"],["محصولات","/products/"],[p.name,path]])],p.mainImage)}<main id="content">
    <section class="page-top detail-top"><div class="container"><div class="breadcrumbs"><a href="/">خانه</a><span> / </span><a href="/products/">محصولات</a><span> / </span><span>${esc(p.name)}</span></div></div></section>
    <section class="detail-section"><div class="container detail-layout"><div class="detail-media"><div class="detail-main">${viz(p,true)}</div>${gallery}</div>
    <div class="detail-copy"><span class="kicker">${esc(p.category)} / هینا الکتریک</span><h1>${esc(p.name)}</h1><p class="detail-subtitle">${esc(p.subtitle)}</p><p>${esc(p.description)}</p>
    <div class="detail-price"><span>قیمت محصول</span><strong>${price(p)}</strong></div>${action(p)}<p class="muted-note">${contact?"با انتخاب دکمه، شماره مجموعه در تلفن شما شماره‌گیری می‌شود.":"دکمه تماس پس از دریافت شماره مجموعه فعال می‌شود."}</p>
    <div class="detail-note">مشخصات و تصاویر تکمیلی پس از دریافت اطلاعات محصول به‌روزرسانی می‌شوند.</div></div></div></section>
    <section class="section spec-section"><div class="container">${sectionTitle("راهنمای محصول","مشخصات و کاربرد")}<div class="spec-layout"><div class="spec-table"><h3>اطلاعات تأییدشده فعلی</h3><dl>${specRows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></div><div class="spec-aside"><h3>اطلاعات تکمیلی</h3><p>محدوده ولتاژ عملکرد، زمان تأخیر، ابعاد، نوع اتصال و جزئیات گارانتی فقط پس از دریافت مشخصات معتبر این مدل در صفحه درج می‌شوند.</p><a class="text-link" href="/products/">مشاهده سایر محصولات ←</a></div></div></div></section>
    ${contactSection}</main>${end}`;
  }
  files["sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/","/products/",...products.map(p=>`/products/${p.slug}/`)].map(path=>`  <url><loc>${url(path)}</loc></url>`).join("\n")}\n</urlset>\n`;
  files["robots.txt"]=`User-agent: *\nAllow: /\n\nSitemap: ${url("/sitemap.xml")}\n`;
  return files;
}

const site=JSON.parse(await readFile(new URL("../data/site.json",import.meta.url),"utf8"));
const products=JSON.parse(await readFile(new URL("../data/products.json",import.meta.url),"utf8"));
for(const [path,content] of Object.entries(buildCatalog(site,products))){
  const destination=new URL("../"+path,import.meta.url);
  await mkdir(dirname(destination.pathname),{recursive:true});
  await writeFile(destination,content,"utf8");
  console.log("Generated:",path);
}
