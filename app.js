/* ==========================================
   GE_Sky — Interactive Platform Engine (app.js)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  fetchAndRenderData();
  setupStatsAnimation();
});

/* ===== Navbar Controller ===== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // Close nav on link click (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
}

/* ===== Data Fetching and Rendering ===== */
async function fetchAndRenderData() {
  try {
    const response = await fetch('GE_Sky_Comprehensive_Platform_Model_AR.json');
    if (!response.ok) {
      throw new Error('فشل تحميل ملف البيانات الرئيسي');
    }
    const data = await response.json();
    renderAll(data);
  } catch (error) {
    console.error('Error fetching JSON data:', error);
    // If running offline or direct file system, use fallback mock
    useFallbackData();
  }
}

function renderAll(data) {
  renderEcosystems(data["المنظومات"]);
  renderAgents(data["الوكلاء"]);
  renderServices(data["فهرس_الخدمات"]);
  renderUsers(data["المستخدمون_المستهدفون"]);
  renderRoadmap(data["فهرس_الخدمات"], data["استراتيجية_MVP"]);
  renderAdvantages(data["المزايا_التنافسية"]);
  setupFilters(data["الوكلاء"]);
  setupServicesTabs(data["فهرس_الخدمات"]);
}

/* ===== Fallback Mock Data (For local/offline testing) ===== */
function useFallbackData() {
  console.log("Using local fallback data due to CORS or network limitations.");
  const fallback = {
    "المنظومات": [
      { "الاسم_بالعربية": "منظومة الذكاء التسويقي وصناعة الطلب", "الغرض": "تحليل الجمهور واكتشاف النية وتحسين الحملات ودفع النمو", "الخدمات": ["Sky Audience Prism", "Sky Intent Lens", "Sky Campaign Pulse"] },
      { "الاسم_بالعربية": "منظومة المحتوى والهوية والمواءمة السياقية", "الغرض": "إنتاج المحتوى وتوطينه وتخصيصه ومواءمته مع هوية العلامة", "الخدمات": ["Sky Content Forge", "Sky Cultural Sync", "Sky Language Mesh"] },
      { "الاسم_بالعربية": "منظومة التجارة الإلكترونية وتشغيل المتجر", "الغرض": "إنشاء المتجر، وإدارة المنتجات، والبحث، والتوصيات، والتحويل", "الخدمات": ["Sky Store Builder", "Sky Catalog Pilot", "Sky Smart Search"] },
      { "الاسم_بالعربية": "منظومة العملاء والعلاقات والدعم", "الغرض": "ملفات العملاء، والدعم، وتحويل العملاء المحتملين، والمشاعر", "الخدمات": ["Sky CRM Core", "Sky Chat Concierge", "Sky Care 24"] },
      { "الاسم_بالعربية": "منظومة الدفع والثقة والمعاملات", "الغرض": "تنسيق الدفع والفوترة والمخاطر والثقة والمعاملات الآمنة", "الخدمات": ["Sky Pay Bridge", "Sky Secure Checkout", "Sky Trust Shield"] },
      { "الاسم_بالعربية": "منظومة اللوجستيك والتنفيذ والتوصيل", "الغرض": "تنفيذ الطلبات واختيار المزودين وتحسين المسارات وتتبع الشحنات", "الخدمات": ["Sky Fulfill Hub", "Sky Delivery Grid", "Sky Route Mind"] }
    ],
    "الوكلاء": [
      { "الاسم": "Sky Ops Orchestrator", "الاسم_بالعربية": "الوكيل المركزي للتنسيق التشغيلي", "الدور": "ينسق الطلبات والوكلاء والسياق والتسلسل وإعادة المحاولة والنتائج عبر المنصة.", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "الاسم": "Audience Intelligence Agent", "الاسم_بالعربية": "وكيل ذكاء الجمهور", "الدور": "يحلل شرائح العملاء وسلوكهم وقابليتهم للاستهداف.", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "الاسم": "Content Generation Agent", "الاسم_بالعربية": "وكيل توليد المحتوى", "الدور": "ينتج المحتوى الإعلاني والبريدي ومحتوى المنتجات ومحتوى الشبكات الاجتماعية.", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "الاسم": "Campaign Agent", "الاسم_بالعربية": "وكيل الحملات", "الدور": "ينشئ الحملات الإعلانية ويطلقها ويحسنها ويراقبها.", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "الاسم": "CRM Agent", "الاسم_بالعربية": "وكيل إدارة العملاء", "الدور": "يدير ملفات العملاء وتاريخهم وتقسيمهم وعلاقاتهم.", "نوع_الأتمتة": "مؤتمت جزئيًا" },
      { "الاسم": "Support Agent", "الاسم_بالعربية": "وكيل الدعم الذكي", "الدور": "يعالج طلبات الدعم والأسئلة والإرشاد والتصعيد.", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "الاسم": "Inventory Agent", "الاسم_بالعربية": "وكيل المخزون", "الدور": "يتتبع مستويات المخزون وحركته.", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "الاسم": "Delivery Agent", "الاسم_بالعربية": "وكيل التوصيل", "الدور": "يختار مزودي التوصيل وينفذ مسارات الشحن.", "نوع_الأتمتة": "مؤتمت جزئيًا" }
    ],
    "فهرس_الخدمات": [
      { "اسم_الخدمة": "Sky Audience Prism", "الاسم_بالعربية": "موشور الجمهور", "التصنيف": "ذكاء تسويقي", "الوكيل_المسؤول": "Audience Intelligence Agent", "القيمة_المضافة": "يحدد الشرائح الأعلى قابلية للتحويل بدقة", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "اسم_الخدمة": "Sky Content Forge", "الاسم_بالعربية": "مسبك المحتوى", "التصنيف": "توليد المحتوى", "الوكيل_المسؤول": "Content Generation Agent", "القيمة_المضافة": "يولد المحتوى التسويقي على نطاق واسع", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "اسم_الخدمة": "Sky Store Builder", "الاسم_بالعربية": "باني المتجر", "التصنيف": "تشغيل المتجر", "الوكيل_المسؤول": "Store Builder Agent", "القيمة_المضافة": "يطلق النشاط الرقمي بسرعة دون حاجة تقنية عميقة", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "اسم_الخدمة": "Sky Chat Concierge", "الاسم_بالعربية": "مضيف المحادثة", "التصنيف": "الدردشة والدعم المباشر", "الوكيل_المسؤول": "Support Agent", "القيمة_المضافة": "يوفر دعمًا 24/7 واستجابة سريعة", "نوع_الأتمتة": "مؤتمت بالكامل" },
      { "اسم_الخدمة": "Sky Pay Bridge", "الاسم_بالعربية": "جسر الدفع", "التصنيف": "تنسيق الدفع", "الوكيل_المسؤول": "Payment Integration Agent", "القيمة_المضافة": "يوحد وسائل الدفع ومزوديها", "نوع_الأتمتة": "مؤتمت جزئيًا" },
      { "اسم_الخدمة": "Sky Stock Sense", "الاسم_بالعربية": "استشعار المخزون", "التصنيف": "إدارة المخزون", "الوكيل_المسؤول": "Inventory Agent", "القيمة_المضافة": "يمنع العمى التشغيلي في المخزون", "نوع_الأتمتة": "مؤتمت بالكامل" }
    ],
    "المستخدمون_المستهدفون": [
      { "الشريحة": "أصحاب المتاجر الإلكترونية", "الاحتياجات": ["إنشاء المتجر", "إدارة الطلبات", "اكتساب العملاء", "المدفوعات"] },
      { "الشريحة": "الشركات الصغيرة والمتوسطة", "الاحتياجات": ["التحول الرقمي", "تشغيل رقمي منخفض التكلفة", "مبيعات وتسويق"] },
      { "الشريحة": "رواد الأعمال والمؤسسون", "الاحتياجات": ["الانطلاق من الصفر", "نمو منخفض التكلفة", "بنية رقمية متكاملة"] }
    ],
    "استراتيجية_MVP": {
      "خدمات_المرحلة_الأولى": ["Sky Store Builder", "Sky Content Forge", "Sky Campaign Pulse", "Sky Chat Concierge"],
      "خدمات_المرحلة_الثانية": ["Sky RecommendX", "Sky Price Motion", "Sky Delivery Grid"],
      "خدمات_المرحلة_الثالثة": ["Sky Voice Commerce", "Sky Visual Find", "Sky Cultural Sync"]
    },
    "المزايا_التنافسية": [
      "منظومة موحدة بدل الأدوات المتفرقة والأنظمة المعزولة.",
      "نموذج تشغيل مبتكر A2A (وكيل إلى وكيل).",
      "منصة عربية أولاً مع موائمة سياقية وثقافية.",
      "تغطية متكاملة تبدأ من التسويق وصولاً للوجستيك والتسليم."
    ]
  };
  renderAll(fallback);
}

/* ===== Render Ecosystems ===== */
function renderEcosystems(ecosystems) {
  const grid = document.getElementById('ecosystemsGrid');
  grid.innerHTML = '';

  const emojis = ['📢', '🎨', '🛒', '👥', '💳', '🚚', '📦', '📊', '🔍', '⚙️'];

  ecosystems.forEach((eco, index) => {
    const card = document.createElement('div');
    card.className = 'eco-card';
    const emoji = emojis[index % emojis.length];
    
    // Choose dynamic glow effects based on index
    const hue = (index * 36) % 360;
    card.style.setProperty('--eco-color', `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${hue + 40}, 85%, 50%))`);

    const servicesHtml = eco.الخدمات.slice(0, 3).map(serv => 
      `<span class="eco-service-tag">${serv}</span>`
    ).join('');

    card.innerHTML = `
      <div class="eco-emoji">${emoji}</div>
      <h3 class="eco-name-ar">${eco.الاسم_بالعربية}</h3>
      <p class="eco-purpose">${eco.الغرض}</p>
      <div class="eco-services">
        ${servicesHtml}
        ${eco.الخدمات.length > 3 ? `<span class="eco-service-tag">+${eco.الخدمات.length - 3}</span>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ===== Render Agents ===== */
function renderAgents(agents) {
  const grid = document.getElementById('agentsGrid');
  grid.innerHTML = '';

  const emojis = ['🤖', '🧠', '📡', '🛡️', '⚙️', '🔍', '💼', '📦', '🚚', '💬'];

  agents.forEach((agent, index) => {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.setAttribute('data-category', getAgentCategory(agent.الاسم_بالعربية || agent.الاسم));
    
    const emoji = emojis[index % emojis.length];
    const autoType = agent.نوع_الأتمتة === "مؤتمت بالكامل" ? "كامل الأتمتة" : "أتمتة جزئية";
    const autoClass = agent.نوع_الأتمتة === "مؤتمت بالكامل" ? "type-full" : "type-partial";

    card.innerHTML = `
      <div class="agent-avatar">${emoji}</div>
      <h3 class="agent-name-ar">${agent.الاسم_بالعربية || agent.الاسم}</h3>
      <div class="agent-name-en">${agent.الاسم}</div>
      <p class="agent-role">${agent.الدور || 'وكيل ذكي متخصص لإدارة وتحسين وظائف المنظومة الموكلة إليه.'}</p>
      <span class="agent-type ${autoClass}">${autoType}</span>
    `;
    grid.appendChild(card);
  });
}

function getAgentCategory(name) {
  if (name.includes('تسويق') || name.includes('حملات') || name.includes('جمهور') || name.includes('محتوى') || name.includes('هوية') || name.includes('ثقاف') || name.includes('توقيت')) {
    return 'تسويق';
  }
  if (name.includes('كتالوج') || name.includes('متجر') || name.includes('شراء') || name.includes('توصية') || name.includes('تسعير')) {
    return 'تجارة';
  }
  if (name.includes('عميل') || name.includes('دعم') || name.includes('مشاعر') || name.includes('ولاء') || name.includes('معرفة')) {
    return 'عملاء';
  }
  if (name.includes('لوجست') || name.includes('شحن') || name.includes('مسار') || name.includes('تتبع') || name.includes('مرتجع') || name.includes('توصيل') || name.includes('مخزون')) {
    return 'لوجستيك';
  }
  return 'تحليلات';
}

/* ===== Filter Setup ===== */
function setupFilters(agents) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      const cards = document.querySelectorAll('.agent-card');
      
      cards.forEach(card => {
        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ===== Render Services ===== */
function renderServices(services) {
  // Save services globally for tab access
  window.allServices = services;
}

function setupServicesTabs(services) {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panel = document.getElementById('servicesPanels');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabName = btn.getAttribute('data-tab');
      renderServicesByTab(tabName);
    });
  });

  // Default initial render
  renderServicesByTab('marketing');
}

function renderServicesByTab(tab) {
  const panel = document.getElementById('servicesPanels');
  panel.innerHTML = '';
  panel.classList.add('active');

  const services = window.allServices || [];
  
  const filtered = services.filter(service => {
    const desc = service.التصنيف || '';
    if (tab === 'marketing') {
      return desc.includes('تسويق') || desc.includes('حملات') || desc.includes('توجيه') || desc.includes('محتوى') || desc.includes('توطين') || desc.includes('تصميم');
    }
    if (tab === 'ecommerce') {
      return desc.includes('متجر') || desc.includes('منتجات') || desc.includes('شراء') || desc.includes('توصية') || desc.includes('بحث');
    }
    if (tab === 'crm') {
      return desc.includes('عملاء') || desc.includes('دردشة') || desc.includes('دعم') || desc.includes('ولاء') || desc.includes('مشاعر');
    }
    if (tab === 'payments') {
      return desc.includes('دفع') || desc.includes('فوترة') || desc.includes('ثقة') || desc.includes('مخاطر');
    }
    if (tab === 'logistics') {
      return desc.includes('لوجست') || desc.includes('توصيل') || desc.includes('تتبع') || desc.includes('مرتجع') || desc.includes('شحن');
    }
    if (tab === 'analytics') {
      return desc.includes('تحليلات') || desc.includes('ذكاء') || desc.includes('سيناريو') || desc.includes('أداء') || desc.includes('تخطيط');
    }
    return false;
  });

  if (filtered.length === 0) {
    panel.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">لا توجد خدمات متاحة حالياً في هذا القسم.</div>`;
    return;
  }

  filtered.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card';
    const isAuto = service.نوع_الأتمتة === "مؤتمت بالكامل";
    const autoLabel = isAuto ? "مؤتمت بالكامل" : "مؤتمت جزئياً";
    const autoClass = isAuto ? "auto-full" : "auto-partial";

    card.innerHTML = `
      <div class="service-name-ar">${service.الاسم_بالعربية}</div>
      <div class="service-name-en">${service.اسم_الخدمة}</div>
      <p class="service-value">${service.القيمة_المضافة}</p>
      <div class="service-auto ${autoClass}">
        <span>●</span> ${autoLabel}
      </div>
    `;
    panel.appendChild(card);
  });
}

/* ===== Render Users ===== */
function renderUsers(users) {
  const grid = document.getElementById('usersGrid');
  grid.innerHTML = '';

  const userEmojis = {
    "أصحاب المتاجر الإلكترونية": "🛍️",
    "الشركات الصغيرة والمتوسطة": "🏢",
    "رواد Entrepreneurs": "🚀",
    "رواد الأعمال والمؤسسون": "💡",
    "المسوقون الرقميون": "🎯",
    "الوكالات": "🤝",
    "العلامات التجارية": "💎",
    "شركاء اللوجستيك والتوصيل": "🚚",
    "مزودو خدمات الدفع": "💳",
    "الجهات الحكومية والمؤسساتية": "🏛️"
  };

  users.slice(0, 5).forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card';
    const emoji = userEmojis[user.الشريحة] || "👤";
    
    const needsHtml = user.Needs ? user.Needs.map(need => `<span class="user-need">${need}</span>`).join('') :
                      user.الاحتياجات ? user.الاحتياجات.map(need => `<span class="user-need">${need}</span>`).join('') : '';

    card.innerHTML = `
      <div class="user-icon">${emoji}</div>
      <h3 class="user-type">${user.الشريحة}</h3>
      <div class="user-needs">${needsHtml}</div>
    `;
    grid.appendChild(card);
  });
}

/* ===== Render Roadmap ===== */
function renderRoadmap(services, mvp) {
  const p1Container = document.getElementById('phase1Services');
  const p2Container = document.getElementById('phase2Services');
  const p3Container = document.getElementById('phase3Services');

  p1Container.innerHTML = '';
  p2Container.innerHTML = '';
  p3Container.innerHTML = '';

  const phase1List = mvp.خدمات_المرحلة_الأولى || [];
  const phase2List = mvp.خدمات_المرحلة_الثانية || [];
  const phase3List = mvp.خدمات_المرحلة_الثالثة || [];

  // Match English code names with Arabic translations
  const translate = (enName) => {
    const found = services.find(s => s.اسم_الخدمة.toLowerCase() === enName.toLowerCase());
    return found ? found.الاسم_بالعربية : enName;
  };

  phase1List.forEach(item => {
    p1Container.innerHTML += `<span class="phase-service-tag">${translate(item)}</span>`;
  });
  phase2List.forEach(item => {
    p2Container.innerHTML += `<span class="phase-service-tag">${translate(item)}</span>`;
  });
  phase3List.forEach(item => {
    p3Container.innerHTML += `<span class="phase-service-tag">${translate(item)}</span>`;
  });
}

/* ===== Advantages ===== */
function renderAdvantages(advantages) {
  const grid = document.getElementById('advantagesGrid');
  grid.innerHTML = '';

  advantages.forEach((adv, index) => {
    const card = document.createElement('div');
    card.className = 'advantage-card';
    card.innerHTML = `
      <div class="advantage-icon">⭐</div>
      <p class="advantage-text">${adv}</p>
    `;
    grid.appendChild(card);
  });
}

/* ===== Stats Counting Animation ===== */
function setupStatsAnimation() {
  const stats = document.querySelectorAll('.big-num');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'), 10);
        animateCount(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

function animateCount(element, target) {
  let start = 0;
  const duration = 1500; // ms
  const stepTime = Math.abs(Math.floor(duration / target));
  
  const timer = setInterval(() => {
    start += 1;
    element.textContent = start;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    }
  }, stepTime);
}
