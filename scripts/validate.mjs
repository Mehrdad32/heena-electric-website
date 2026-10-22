import {readFile,access} from "node:fs/promises";
import {join} from "node:path";
const root=new URL("../",import.meta.url);
const site=JSON.parse(await readFile(new URL("../data/site.json",import.meta.url),"utf8"));
const products=JSON.parse(await readFile(new URL("../data/products.json",import.meta.url),"utf8"));
const base=site.domain.replace(/\/$/,"");
const outputs=[["/","index.html"],["/products/","products/index.html"],...products.map(p=>[`/products/${p.slug}/`,`products/${p.slug}/index.html`])];
const errors=[];
if(!/^https:\/\//.test(base))errors.push("Site domain must be HTTPS");
const sitemap=await readFile(new URL("../sitemap.xml",import.meta.url),"utf8");
const robots=await readFile(new URL("../robots.txt",import.meta.url),"utf8");
if(!robots.includes(`Sitemap: ${base}/sitemap.xml`))errors.push("robots.txt sitemap host mismatch");
for(const [route,file] of outputs){
 const html=await readFile(new URL("../"+file,import.meta.url),"utf8");
 const canonical=`${base}${route}`;
 if(!html.includes(`<link rel="canonical" href="${canonical}">`))errors.push(file+": invalid canonical");
 if(!html.includes(`<meta property="og:url" content="${canonical}">`))errors.push(file+": invalid OG URL");
 if(!html.includes("<h1"))errors.push(file+": H1 missing");
 if(!html.includes(`href="tel:${site.phoneE164}"`))errors.push(file+": call-to-buy missing");
 if(!sitemap.includes(`<loc>${canonical}</loc>`))errors.push(file+": missing in sitemap");
 if(html.includes("تصویر محصول به‌زودی"))errors.push(file+": placeholder image still present");
 if(!html.includes('name="robots" content="index,follow'))errors.push(file+": unexpectedly blocked from indexing");
}
for(const p of products){
 if(!p.mainImage)errors.push(p.slug+": main image missing");
 if(!p.seoTitle||!p.seoDescription)errors.push(p.slug+": SEO text missing");
 if(!p.variants?.length||p.variants.some(v=>!Number.isInteger(v.priceRial)||v.priceRial<=0))errors.push(p.slug+": price missing");
 for(const image of [p.mainImage,...(p.gallery||[])]){
   if(!image.startsWith("/assets/images/")||image.includes("..")){errors.push(p.slug+": unsafe image path "+image);continue}
   try{await access(new URL(".."+image,import.meta.url))}catch{errors.push(p.slug+": image file missing "+image)}
 }
}
const notFound=await readFile(new URL("../404.html",import.meta.url),"utf8");
if(!notFound.includes("noindex,nofollow"))errors.push("404 page must be noindex");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
else console.log(`SEO checks passed: ${outputs.length} indexable pages, ${products.length} products, image files and 404 page.`);
