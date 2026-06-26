/* ─────────────────────────────────────────────────────────────
   build-ar.js — generate Arabic (/ar/) static pages from the
   English source pages. Re-runnable: edit the English page, then
   run `node scripts/build-ar.js` to regenerate the Arabic mirror.

   For each page it:
   - sets <html lang="ar" dir="rtl">
   - strips .en-only nodes (clean Arabic document)
   - swaps the <head> to Arabic (title/description/keywords/OG),
     self-canonical + hreflang both ways
   - localizes JSON-LD (urls, names, breadcrumb, FAQ, inLanguage)
   - rewrites asset paths to root-absolute (/assets/...)
   - rewrites internal links to the Arabic counterpart (or English
     fallback for pages not yet generated)
   - turns the EN/AR toggle into navigation between languages
   It also patches each English source page so its "عربي" button +
   `ar` hreflang point to the new /ar/ URL.
   ───────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');

// ── Phase 1 page set + Arabic head metadata ───────────────────
const T = {
  'index.html': {
    title: 'ذا وولز | تشطيب وديكور داخلي ونجارة في دبي',
    desc: 'ذا وولز شركة تشطيبات وديكور داخلي في دبي — نجارة مخصصة وأسطح صلبة وأعمال ألمنيوم وتصميم داخلي ينفذه مهندسون معماريون. حلول تشطيب متكاملة في الإمارات.',
    keywords: 'تشطيب دبي, ديكور داخلي دبي, نجارة دبي, شركة تشطيبات دبي, أعمال ألمنيوم دبي, أسطح صلبة دبي',
  },
  'pages/services.html': {
    title: 'خدماتنا | تشطيب وديكور داخلي في دبي — ذا وولز',
    desc: 'استكشف خدمات ذا وولز في دبي: النجارة والأسطح الصلبة والأعمال الألمنيوم والتصميم الداخلي والتشطيب المتكامل والإشراف الهندسي — يصممها وينفذها فريقنا الداخلي.',
  },
  'pages/contact.html': {
    title: 'تواصل معنا | ذا وولز دبي',
    desc: 'تواصل مع ذا وولز في دبي لمناقشة مشروع التشطيب أو الديكور الداخلي — استشارة مجانية. هاتف وواتساب وبريد إلكتروني وموقع المعرض.',
  },
  'pages/joinery-dubai.html': {
    title: 'نجارة مخصصة في دبي | أعمال خشبية وخزائن — ذا وولز',
    desc: 'نجارة مخصصة في دبي من ذا وولز — خزائن وأبواب ووحدات تلفاز ومطابخ وألواح بارامترية، يصممها مهندسون وتُصنع في ورشتنا الخاصة وفق مواصفاتك.',
    keywords: 'نجارة دبي, نجارة مخصصة دبي, أعمال خشبية دبي, خزائن مخصصة دبي, غرف ملابس دبي',
    serviceName: 'نجارة وأعمال خشبية مخصصة',
    serviceDesc: 'نجارة مخصصة في دبي — خزائن وأبواب ووحدات تلفاز ومطابخ وكاونترات استقبال وألواح بارامترية، تُصنع داخلياً وتُركّب بواسطة ذا وولز.',
    crumb: 'النجارة في دبي',
  },
  'pages/solid-surfaces-dubai.html': {
    title: 'أسطح صلبة في دبي | كوريان وديكتون وحجر — ذا وولز',
    desc: 'تصنيع الأسطح الصلبة في دبي — كوريان وديكتون وسيليستون ولابيتك والحجر الطبيعي لأسطح المطابخ ومكاتب الاستقبال والكسوة والجدران المميزة بفواصل غير مرئية.',
    keywords: 'أسطح صلبة دبي, كوريان دبي, ديكتون دبي, أسطح مطابخ دبي, كسوة جدران دبي',
    serviceName: 'تصنيع الأسطح الصلبة',
    serviceDesc: 'أسطح صلبة في دبي — كوريان وديكتون وسيليستون ولابيتك والحجر الطبيعي لأسطح العمل ومكاتب الاستقبال والكسوة والجدران المميزة بفواصل غير مرئية، من ذا وولز.',
    crumb: 'الأسطح الصلبة في دبي',
  },
  'pages/aluminum-works-dubai.html': {
    title: 'أعمال ألمنيوم في دبي | نوافذ وأبواب وواجهات — ذا وولز',
    desc: 'أعمال الألمنيوم في دبي — نوافذ وأبواب وأنظمة جدران ستارية وواجهات محلات وكسوة، مصممة وفق معايير بلدية دبي ومناخ الإمارات باستخدام أنظمة أوروبية فاخرة.',
    keywords: 'أعمال ألمنيوم دبي, نوافذ ألمنيوم دبي, أبواب ألمنيوم دبي, واجهات زجاجية دبي, جدار ستاري دبي',
    serviceName: 'الأعمال الألمنيوم',
    serviceDesc: 'أعمال ألمنيوم في دبي — نوافذ وأبواب وأنظمة جدران ستارية وواجهات محلات وكسوة، مصممة وفق معايير بلدية دبي ومناخ الإمارات، من ذا وولز.',
    crumb: 'الأعمال الألمنيوم في دبي',
  },
  'pages/interior-design-dubai.html': {
    title: 'تصميم داخلي في دبي | استوديو يقوده مهندسون — ذا وولز',
    desc: 'تصميم داخلي في دبي يقوده مهندسون معماريون — تخطيط المساحات والمفهوم والتصور ثلاثي الأبعاد والأثاث والتوريد للفلل والمكاتب والمحلات والضيافة.',
    keywords: 'تصميم داخلي دبي, ديكور داخلي دبي, مهندس ديكور دبي, تصميم فلل دبي, تصميم مكاتب دبي',
    serviceName: 'التصميم الداخلي',
    serviceDesc: 'تصميم داخلي في دبي يقوده مهندسون معماريون — تخطيط المساحات والمفهوم والتصور ثلاثي الأبعاد ولوحات المواد والإضاءة وتحديد الأثاث والتوريد، من ذا وولز.',
    crumb: 'التصميم الداخلي في دبي',
  },
  'pages/complete-fit-out-dubai.html': {
    title: 'شركة تشطيبات في دبي | تشطيب متكامل تسليم مفتاح — ذا وولز',
    desc: 'تشطيب متكامل في دبي من ذا وولز — تصميم ونجارة وأسطح وألمنيوم وتنسيق كهروميكانيكي وأثاث للمكاتب والفلل والمحلات والمطاعم والعيادات بفريق واحد.',
    keywords: 'تشطيب دبي, شركة تشطيبات دبي, تشطيب مكاتب دبي, تشطيب فلل دبي, تشطيب متكامل دبي',
    serviceName: 'تشطيب متكامل تسليم مفتاح',
    serviceDesc: 'تشطيب متكامل في دبي — تصميم ونجارة وأسطح صلبة وألمنيوم وتنسيق كهروميكانيكي وأثاث للمكاتب والفلل والمحلات والمطاعم والعيادات، يسلّمه فريق واحد من ذا وولز.',
    crumb: 'التشطيب في دبي',
  },
  'pages/architecture-supervision-dubai.html': {
    title: 'هندسة معمارية وإشراف ميداني في دبي — ذا وولز',
    desc: 'خدمات الهندسة المعمارية والإشراف الميداني في دبي — عمارة مفاهيمية ورسومات فنية ومراجعة رسومات تنفيذ وضبط جودة ومعالجة ملاحظات ورسومات نهائية.',
    keywords: 'إشراف هندسي دبي, هندسة معمارية دبي, إدارة مشاريع دبي, ضبط جودة دبي, رسومات تنفيذية دبي',
    serviceName: 'الهندسة المعمارية والإشراف',
    serviceDesc: 'هندسة معمارية وإشراف ميداني في دبي — عمارة مفاهيمية ورسومات فنية ومراجعة رسومات تنفيذ وضبط جودة ومعالجة ملاحظات ورسومات نهائية، من ذا وولز.',
    crumb: 'الهندسة والإشراف في دبي',
  },
  'pages/case-study-villa.html': {
    title: 'دراسة حالة: فيلا فاخرة في نخلة جميرا — ذا وولز',
    desc: 'تشطيب داخلي متكامل لفيلا فاخرة في نخلة جميرا بدبي — خزائن وأعمال نجارة مخصصة وتصميم داخلي بإشراف مهندسي ذا وولز.',
  },
  'pages/case-study-office.html': {
    title: 'دراسة حالة: تشطيب مكتب في مركز دبي المالي — ذا وولز',
    desc: 'تشطيب كامل لمقر شركة في حي البوابة بمركز دبي المالي العالمي على مساحة 1,400 م² — نجارة وأسطح صلبة وأعمال ألمنيوم وإشراف من ذا وولز.',
  },
  'pages/case-study-clinic.html': {
    title: 'دراسة حالة: عيادة طبية في دبي هيلز — ذا وولز',
    desc: 'تشطيب عيادة طبية في دبي هيلز بارك — تصميم وتنفيذ متكامل بإشراف مهندسي ذا وولز مع مراعاة المعايير الطبية.',
  },
  'pages/case-study-lento.html': {
    title: 'دراسة حالة: مطعم لينتو في أم الشيف — ذا وولز',
    desc: 'أثاث مخصص وإشارات لمطعم لينتو في أم الشيف بدبي — أكثر من 18 قطعة فريدة من الفولاذ والخرسانة والجلد، من ذا وولز.',
  },

  // ── Phase 2 ──
  'pages/about.html': {
    title: 'من نحن | ذا وولز — متخصصو التشطيب في دبي',
    desc: 'تعرّف على ذا وولز — شركة تشطيب وديكور داخلي في دبي أسّسها مهندسون معماريون. قصتنا وقيمنا وفريقنا وكيف ننفّذ المشاريع من التصميم حتى التسليم.',
  },
  'pages/portfolio.html': {
    title: 'أعمالنا | ذا وولز — تشطيب وتصميم داخلي في دبي',
    desc: 'تصفّح أعمال ذا وولز من المشاريع المنجزة في دبي — تشطيبات سكنية ومكتبية وتجارية وضيافة بأعمال نجارة فاخرة ولمسات مخصصة.',
  },
  'pages/shop.html': {
    title: 'المتجر | ذا وولز — نجارة وأثاث ومستلزمات منزلية، دبي',
    desc: 'تسوّق منتجات النجارة والأثاث والمستلزمات المنزلية المصنوعة بيد ذا وولز في دبي. ادفع بأمان عبر الإنترنت أو عند الاستلام في جميع أنحاء الإمارات.',
  },
  'pages/faq.html': {
    title: 'الأسئلة الشائعة | ذا وولز — تشطيب وتصميم داخلي في دبي',
    desc: 'إجابات على أكثر الأسئلة شيوعاً حول تكاليف التشطيب والجداول الزمنية والتصاريح والضمانات والتعامل مع ذا وولز في دبي والإمارات.',
  },
  'pages/quote.html': {
    title: 'احصل على عرض سعر | ذا وولز',
    desc: 'اطلب عرض سعر تفصيلياً للتشطيب والتصميم الداخلي من ذا وولز دبي. شارك مخططاتك ورؤيتك وسنرد عليك خلال 24 ساعة.',
  },
  'pages/privacy-policy.html': {
    title: 'سياسة الخصوصية | ذا وولز — تشطيب وتصميم داخلي في دبي',
    desc: 'سياسة خصوصية ذا وولز — كيف نجمع معلوماتك الشخصية ونستخدمها ونحميها عند استخدام موقعنا أو خدماتنا في دبي.',
  },
  'pages/terms-of-use.html': {
    title: 'شروط الاستخدام | ذا وولز — تشطيب وتصميم داخلي في دبي',
    desc: 'شروط استخدام موقع ذا وولز وخدمات التشطيب في دبي. يُرجى قراءة الشروط قبل استخدام الموقع أو التعاقد على خدمات التصميم والنجارة.',
  },
  'pages/blog.html': {
    title: 'المدونة | ذا وولز — رؤى حول التشطيب الداخلي في دبي',
    desc: 'أدلة ونصائح عملية حول التشطيب الداخلي في دبي — النجارة والأسطح الصلبة وتشطيب المكاتب والجداول الزمنية وكيفية اختيار المقاول المناسب في الإمارات.',
  },
  'blog/villa-fitout-timeline-dubai.html': {
    title: 'كم يستغرق تشطيب الفيلا في دبي؟ | مدونة ذا وولز',
    desc: 'من اعتماد التصميم حتى التسليم النهائي، يستغرق تشطيب الفلل في دبي عادةً 8–16 أسبوعاً. نشرح كل مرحلة بجداول زمنية واقعية وأسباب التأخير الشائعة.',
  },
  'blog/joinery-vs-offshelf-furniture.html': {
    title: 'النجارة المخصصة مقابل الأثاث الجاهز — متى يوفّر التفصيل المال؟ | مدونة ذا وولز',
    desc: 'النجارة المخصصة أعلى تكلفة مبدئياً لكنها غالباً أفضل قيمة على المدى الطويل لفلل وشقق دبي. نوضّح متى يكون التفصيل خياراً ذكياً ومتى لا يكون.',
  },
  'blog/solid-surfaces-corian-vs-quartz.html': {
    title: 'الأسطح الصلبة: كوريان مقابل الكوارتز — أين يتفوق كل منهما | مدونة ذا وولز',
    desc: 'كوريان والكوارتز الهندسي شائعان في تشطيبات دبي لكنهما ليسا بديلين متطابقين. دليل يغطي المتانة والتكلفة والمظهر وأفضل استخدام لكل مادة.',
  },
  'blog/hiring-fitout-contractor-uae.html': {
    title: 'ما الذي يجب سؤاله قبل اختيار مقاول تشطيب في الإمارات | مدونة ذا وولز',
    desc: 'اختيار مقاول التشطيب الخطأ في دبي خطأ مكلف. نشارك الأسئلة الدقيقة التي يجب طرحها قبل التوقيع — من الترخيص والتأمين إلى الضمان وإدارة المشروع.',
  },
  'blog/office-fitout-difc-dmcc-checklist.html': {
    title: 'قائمة تشطيب المكاتب لمستأجري مركز دبي المالي وDMCC | مدونة ذا وولز',
    desc: 'لدى مركز دبي المالي العالمي وDMCC متطلبات خاصة تفاجئ المستأجرين لأول مرة. قائمة تغطي الموافقات ومؤهلات المقاول ومواصفات البناء والجداول الزمنية للمنطقتين.',
  },
};

const AR_SET = new Set(Object.keys(T));

const enUrl = (src) => 'https://thewalls.ae/' + (src === 'index.html' ? '' : src);
const arUrl = (src) => 'https://thewalls.ae/ar/' + (src === 'index.html' ? '' : src);
const arAbs = (src) => '/ar/' + (src === 'index.html' ? '' : src);
const enAbs = (src) => '/' + (src === 'index.html' ? '' : src);

function resolveLink(value, src) {
  if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(value)) return null;
  let hash = '', q = '', core = value;
  const hi = core.indexOf('#'); if (hi >= 0) { hash = core.slice(hi); core = core.slice(0, hi); }
  const qi = core.indexOf('?'); if (qi >= 0) { q = core.slice(qi); core = core.slice(0, qi); }
  if (!core.endsWith('.html')) return null;
  const dir = src.includes('/') ? src.slice(0, src.lastIndexOf('/')) : '';
  let target = path.posix.normalize((dir ? dir + '/' : '') + core).replace(/^\.\//, '');
  const abs = AR_SET.has(target)
    ? '/ar/' + (target === 'index.html' ? '' : target)
    : '/' + (target === 'index.html' ? '' : target);
  return abs + q + hash;
}

function localizeJsonLd(raw, src, meta, faqAr) {
  let obj;
  try { obj = JSON.parse(raw); } catch (e) { return null; }
  const graph = obj['@graph'] || [obj];
  for (const node of graph) {
    const type = node['@type'];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes('Service')) {
      node.inLanguage = 'ar';
      if (meta.serviceName) node.name = meta.serviceName;
      if (meta.serviceDesc) node.description = meta.serviceDesc;
    }
    if (types.includes('FAQPage')) {
      node.inLanguage = 'ar';
      // Rebuild from the visible Arabic accordion so the schema always matches
      // the on-page content (Google requires this) and is fully Arabic.
      if (faqAr.length) {
        node.mainEntity = faqAr.map((x) => ({
          '@type': 'Question',
          name: x.q,
          acceptedAnswer: { '@type': 'Answer', text: x.a },
        }));
      }
    }
    if (types.includes('Article') || types.includes('BlogPosting') || types.includes('NewsArticle')) {
      node.inLanguage = 'ar';
      node.headline = meta.title.split(' | ')[0];
      node.description = meta.desc;
    }
    if (types.includes('BreadcrumbList') && node.itemListElement) {
      const NAMES = {
        'Home': 'الرئيسية', 'Services': 'خدماتنا', 'Journal': 'المدونة', 'Blog': 'المدونة',
        'Portfolio': 'أعمالنا', 'Shop': 'المتجر', 'About': 'من نحن', 'About Us': 'من نحن',
        'Contact': 'تواصل معنا', 'FAQ': 'الأسئلة الشائعة',
      };
      const last = node.itemListElement.length;
      node.itemListElement.forEach((li) => {
        if (NAMES[li.name]) li.name = NAMES[li.name];
        else if (li.position === last && meta.crumb) li.name = meta.crumb;
      });
    }
  }
  let out = JSON.stringify(obj, null, 2);
  // EN → AR urls (page's own url/@id; then breadcrumb items & home)
  if (src !== 'index.html') out = out.split(enUrl(src)).join(arUrl(src));
  out = out.split('https://thewalls.ae/pages/').join('https://thewalls.ae/ar/pages/');
  out = out.split('"https://thewalls.ae/"').join('"https://thewalls.ae/ar/"');
  return out;
}

function buildPage(src) {
  const meta = T[src];
  const html = fs.readFileSync(path.join(ROOT, src), 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  $('html').attr('lang', 'ar').attr('dir', 'rtl');

  // Extract Arabic FAQ (before stripping en-only) from accordions, in order
  const faqAr = [];
  const clean = (t) => t.replace(/\s+/g, ' ').trim();
  // Service-page accordions (.faq-acc)
  $('.faq-acc').each((_, el) => {
    const enQ = clean($(el).find('summary .en-only').first().text());
    const q = clean($(el).find('summary .ar-only').first().text());
    const a = clean($(el).find('p.ar-only').first().text());
    if (q && a) faqAr.push({ enQ, q, a });
  });
  // faq.html accordions (.faq-item › .faq-q / .faq-answer)
  if (!faqAr.length) {
    $('.faq-item').each((_, el) => {
      const enQ = clean($(el).find('.faq-q .en-only').first().text());
      const q = clean($(el).find('.faq-q .ar-only').first().text());
      const a = clean($(el).find('.faq-answer .ar-only').first().text());
      if (q && a) faqAr.push({ enQ, q, a });
    });
  }

  // Localize JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    const out = localizeJsonLd($(el).html(), src, meta, faqAr);
    if (out) $(el).text('\n' + out + '\n');
  });

  // Head metadata
  $('title').text(meta.title);
  $('meta[name="description"]').attr('content', meta.desc);
  if (meta.keywords) $('meta[name="keywords"]').attr('content', meta.keywords);
  $('link[rel="canonical"]').attr('href', arUrl(src));
  $('link[rel="alternate"][hreflang="en"]').attr('href', enUrl(src));
  $('link[rel="alternate"][hreflang="ar"]').attr('href', arUrl(src));
  $('link[rel="alternate"][hreflang="x-default"]').attr('href', enUrl(src));
  $('meta[property="og:title"]').attr('content', meta.title);
  $('meta[property="og:description"]').attr('content', meta.desc);
  $('meta[property="og:url"]').attr('content', arUrl(src));
  if ($('meta[property="og:locale"]').length === 0) {
    $('meta[property="og:url"]').after('\n<meta property="og:locale" content="ar_AE"/>');
  }

  // Clean Arabic document: drop English-only nodes — but skip pages whose inline
  // JS manipulates the language spans (e.g. estimator / contact button states),
  // where removing them would break scripts. Those keep both languages (Arabic
  // shown, English hidden via dir=rtl).
  // Unsafe if inline JS queries the language spans, e.g. querySelector('.en-only')
  // or querySelector('span.ar-only') — removing them would null-crash that JS.
  const stripSafe = !/\.(en|ar)-only['"]\s*\)/.test(html);
  if (stripSafe) $('.en-only').remove();

  // Static Arabic nav labels (in case JS is slow/off)
  $('.nav-links a[data-ar]').each((_, el) => { $(el).text($(el).attr('data-ar')); });

  // Language toggle → navigation (set the language preference before leaving,
  // so the destination page renders in the chosen language)
  $('#btnEN').removeClass('active').attr('onclick', "localStorage.setItem('tw_lang','en');location.href='" + enAbs(src) + "'");
  $('#btnAR').addClass('active').attr('onclick', 'return false;');

  // Rewrite internal .html links to AR (or EN fallback)
  $('a[href]').each((_, el) => {
    const v = $(el).attr('href');
    const r = resolveLink(v, src);
    if (r) $(el).attr('href', r);
  });

  let out = $.html();
  // Asset paths → root-absolute (covers href/src + inline style url())
  out = out.replace(/(?:\.\.\/)+assets\//g, '/assets/').replace(/\.\/assets\//g, '/assets/');
  // Force Arabic on initial inline language init (no flash of English)
  out = out.replace(/localStorage\.getItem\('tw_lang'\)\s*\|\|\s*'en'/g, "'ar'");

  const outPath = path.join(ROOT, 'ar', src);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  return outPath;
}

// Patch the English source so its toggle + ar hreflang point to /ar/
function patchEnglish(src) {
  const p = path.join(ROOT, src);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  // Idempotent: matches the original setLang form or a previously-patched form
  s = s.replace(
    /id="btnAR" onclick="[^"]*"/,
    'id="btnAR" onclick="localStorage.setItem(\'tw_lang\',\'ar\');location.href=\'' + arAbs(src) + '\'"'
  );
  s = s.replace(
    /<link rel="alternate" hreflang="ar" href="[^"]*"\/>/,
    '<link rel="alternate" hreflang="ar" href="' + arUrl(src) + '"/>'
  );
  if (s !== before) { fs.writeFileSync(p, s, 'utf8'); return true; }
  return false;
}

let gen = 0, patched = 0;
for (const src of Object.keys(T)) {
  buildPage(src); gen++;
  if (patchEnglish(src)) patched++;
}
console.log(`Generated ${gen} Arabic pages under /ar/. Patched ${patched} English pages.`);
