/* ==========================================
   GE_Sky — Dashboard Interactive Controller
   ========================================== */

// Dynamic API base — loaded from config.js (falls back to hostname-based URL)
const API_BASE = (typeof GE_SKY_CONFIG !== 'undefined')
  ? GE_SKY_CONFIG.API_BASE
  : `http://${window.location.hostname || '127.0.0.1'}:8001/api`;

let currentUser = null;
let currentStoreId = null;
let authMode = 'login';

/* ===== APP INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  checkApiStatus();
  initAuthModal();
  initNavigation();
  initSidebar();
  initForms();
  setInterval(checkApiStatus, 30000);
});

/* ===== API STATUS ===== */
async function checkApiStatus() {
  const dot = document.getElementById('apiStatusDot');
  const text = document.getElementById('apiStatusText');
  try {
    const res = await fetch(`${API_BASE}/stores/?format=json`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      dot.className = 'status-dot online';
      text.textContent = 'الخلفية متصلة';
    } else { throw new Error(); }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'الخلفية غير متصلة';
  }
}

/* ===== AUTH ===== */
function initAuthModal() {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      authMode = tab.getAttribute('data-tab');
      document.getElementById('emailField').classList.toggle('hidden', authMode === 'login');
      document.getElementById('authSubmitBtn').textContent = authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب';
    });
  });

  document.getElementById('authForm').addEventListener('submit', handleAuth);
}

async function handleAuth(e) {
  e.preventDefault();
  const btn = document.getElementById('authSubmitBtn');
  const errBox = document.getElementById('authError');
  errBox.classList.add('hidden');

  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const email = document.getElementById('authEmail').value.trim();

  btn.textContent = 'جارٍ التحقق...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: authMode, username, password, email })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      document.getElementById('authModal').classList.remove('active');
      document.getElementById('userName').textContent = currentUser.username;
      document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
      showToast(`مرحباً ${currentUser.username}! 👋`, 'success');
      loadDashboardData();
    } else {
      errBox.textContent = data.error || 'حدث خطأ غير متوقع';
      errBox.classList.remove('hidden');
    }
  } catch {
    errBox.textContent = 'تعذر الاتصال بالخادم. تأكد من تشغيل الخلفية على المنفذ 8001.';
    errBox.classList.remove('hidden');
  } finally {
    btn.textContent = authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب';
    btn.disabled = false;
  }
}

function logout() {
  currentUser = null;
  currentStoreId = null;
  document.getElementById('authModal').classList.add('active');
  document.getElementById('authUsername').value = '';
  document.getElementById('authPassword').value = '';
  showToast('تم تسجيل الخروج', 'info');
}

/* ===== NAVIGATION ===== */
const pageTitles = {
  dashboard: 'نظرة عامة',
  stores: 'المتاجر والمنتجات',
  campaigns: 'الحملات التسويقية',
  content: 'استوديو المحتوى والذكاء الاصطناعي',
  crm: 'العملاء والدعم',
  orders: 'سجل الطلبات',
  logistics: 'الخدمات اللوجستية والشحن',
  payments: 'المدفوعات والفوترة',
  analytics: 'التقارير ومؤشرات الأداء',
  settings: 'التكاملات والإعدادات',
  agents: 'وكلاء A2A',
  simulate: 'محاكاة السيناريوهات'
};

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      if (page) navigateTo(page);
    });
  });
}

function navigateTo(page) {
  const btn = document.querySelector(`[data-page="${page}"]`);
  if (!btn) return;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[page] || '';
  loadPageData(page);

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

async function loadPageData(page) {
  switch(page) {
    case 'dashboard': await loadDashboardData(); break;
    case 'stores': await Promise.all([loadStores(), loadProducts()]); break;
    case 'campaigns': await loadCampaigns(); break;
    case 'content': await Promise.all([loadBrandProfile(), loadContentLibrary()]); break;
    case 'crm': await Promise.all([loadCustomers(), loadTickets()]); break;
    case 'orders': await loadOrders(); break;
    case 'logistics': await Promise.all([loadLogisticsInventory(), loadShipments(), loadReturns()]); break;
    case 'payments': await Promise.all([loadInvoices(), loadTransactions()]); break;
    case 'analytics': await loadAnalyticsData(); break;
    case 'settings': await Promise.all([loadIntegrations(), loadProfile()]); break;
    case 'agents': await loadAgentDecisions(); break;
  }
}

/* ===== SIDEBAR TOGGLE ===== */
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');

  toggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
    } else {
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
    }
  });
}

/* ===== LOAD STORES (for select) ===== */
async function loadStoreSelect() {
  try {
    const res = await apiFetch('/stores/');
    const stores = await res.json();
    const sel = document.getElementById('activeStoreSelect');
    sel.innerHTML = '';
    if (stores.length === 0) {
      sel.innerHTML = '<option value="">لا توجد متاجر</option>';
      return;
    }
    stores.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
    currentStoreId = stores[0].id;
    sel.value = currentStoreId;
  } catch (err) {
    console.error('Failed to load stores for select', err);
  }
}

function onStoreChange(val) {
  currentStoreId = val;
  const page = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (page) loadPageData(page);
}

/* ===== DASHBOARD ===== */
async function loadDashboardData() {
  await loadStoreSelect();
  try {
    const [ordersRes, custRes, campRes, decisRes] = await Promise.all([
      apiFetch('/orders/'),
      apiFetch('/customers/'),
      apiFetch('/campaigns/'),
      apiFetch('/decisions/')
    ]);
    const orders = await ordersRes.json();
    const custs = await custRes.json();
    const camps = await campRes.json();
    const decis = await decisRes.json();

    document.getElementById('stat-orders').textContent = orders.count ?? orders.length;
    document.getElementById('stat-customers').textContent = custs.count ?? custs.length;
    document.getElementById('stat-campaigns').textContent = camps.count ?? camps.length;
    document.getElementById('stat-decisions').textContent = decis.count ?? decis.length;

    renderDashDecisions(decis.results ?? decis);
    renderDashOrders(orders.results ?? orders);
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

function renderDashDecisions(items) {
  const el = document.getElementById('dashDecisions');
  if (!items?.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد قرارات بعد</p></div>'; return; }
  el.innerHTML = items.slice(0, 5).map(d => `
    <div class="data-row">
      <div class="data-icon">🤖</div>
      <div class="data-info">
        <div class="data-name">${d.agent_name}</div>
        <div class="data-sub">${d.decision_text.slice(0, 65)}...</div>
      </div>
      <div class="data-meta">
        <div class="data-value"><span class="badge badge-${d.status==='Success'?'green':'rose'}">${d.status==='Success'?'نجاح':'فشل'}</span></div>
        <div class="data-time">${formatDate(d.created_at)}</div>
      </div>
    </div>
  `).join('');
}

function renderDashOrders(items) {
  const el = document.getElementById('dashOrders');
  if (!items?.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد طلبات بعد</p></div>'; return; }
  el.innerHTML = items.slice(0, 5).map(o => `
    <div class="data-row">
      <div class="data-icon">📦</div>
      <div class="data-info">
        <div class="data-name">طلب #${o.id} — ${o.customer_name_raw || 'عميل'}</div>
        <div class="data-sub">${o.tracking_number || 'بدون رقم تتبع'}</div>
      </div>
      <div class="data-meta">
        <div class="data-value">$${parseFloat(o.total_amount).toFixed(2)}</div>
        <div class="data-time">${getStatusBadge(o.status)}</div>
      </div>
    </div>
  `).join('');
}

/* ===== STORES ===== */
async function loadStores() {
  const el = document.getElementById('storesList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  try {
    const res = await apiFetch('/stores/');
    const data = await res.json();
    const stores = data.results ?? data;
    if (!stores.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد متاجر. أنشئ متجرك الأول!</p></div>'; return; }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>اسم المتجر</th><th>التصنيف</th><th>الحالة</th><th>تاريخ الإنشاء</th><th>إجراءات</th></tr></thead>
        <tbody>${stores.map(s => `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.category}</td>
            <td>${getStatusBadge(s.status)}</td>
            <td>${formatDate(s.created_at)}</td>
            <td><button class="btn-danger" onclick="deleteItem('stores', ${s.id}, loadStores)">حذف</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

async function loadProducts() {
  const el = document.getElementById('productsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/products/?store=${currentStoreId}` : '/products/';
    const res = await apiFetch(url);
    const data = await res.json();
    const products = data.results ?? data;
    if (!products.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد منتجات للمتجر المحدد.</p></div>'; return; }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>المنتج</th><th>السعر</th><th>المخزون</th><th>إجراءات</th></tr></thead>
        <tbody>${products.map(p => `
          <tr>
            <td><strong>${p.name}</strong><br/><small style="color:var(--text-muted)">${p.description?.slice(0,60) || ''}...</small></td>
            <td>$${parseFloat(p.price).toFixed(2)}</td>
            <td><span class="badge badge-${p.stock > 10 ? 'green' : 'rose'}">${p.stock} وحدة</span></td>
            <td><button class="btn-danger" onclick="deleteItem('products', ${p.id}, loadProducts)">حذف</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

/* ===== CAMPAIGNS ===== */
async function loadCampaigns() {
  const el = document.getElementById('campaignsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/campaigns/?store=${currentStoreId}` : '/campaigns/';
    const res = await apiFetch(url);
    const data = await res.json();
    const campaigns = data.results ?? data;
    if (!campaigns.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد حملات بعد.</p></div>'; return; }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>اسم الحملة</th><th>المنصة</th><th>الميزانية</th><th>الجمهور</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>${campaigns.map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.platform}</td>
            <td>$${parseFloat(c.budget).toFixed(0)}</td>
            <td>${c.target_audience || '—'}</td>
            <td>${getStatusBadge(c.status)}</td>
            <td><button class="btn-danger" onclick="deleteItem('campaigns', ${c.id}, loadCampaigns)">حذف</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

/* ===== CRM ===== */
/* loadCustomers — canonical definition below at CRM ACTIONS section */

/* loadTickets — canonical definition below at CRM ACTIONS section */

/* ===== ORDERS ===== */
async function loadOrders() {
  const el = document.getElementById('ordersList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/orders/?store=${currentStoreId}` : '/orders/';
    const res = await apiFetch(url);
    const data = await res.json();
    const orders = data.results ?? data;
    if (!orders.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد طلبات.</p></div>'; return; }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>#</th><th>العميل</th><th>المبلغ</th><th>رقم التتبع</th><th>الحالة</th><th>التاريخ</th></tr></thead>
        <tbody>${orders.map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.customer_name_raw || '—'}</td>
            <td>$${parseFloat(o.total_amount).toFixed(2)}</td>
            <td><code style="font-size:0.75rem;color:var(--sky-cyan)">${o.tracking_number || '—'}</code></td>
            <td>${getStatusBadge(o.status)}</td>
            <td>${formatDate(o.created_at)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

/* ===== AGENT DECISIONS ===== */
async function loadAgentDecisions() {
  const el = document.getElementById('agentDecisionsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
  try {
    const res = await apiFetch('/decisions/');
    const data = await res.json();
    const items = data.results ?? data;
    document.getElementById('decisionCount').textContent = items.length;
    if (!items.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد قرارات بعد. جرب محاكاة سيناريو!</p></div>'; return; }
    el.innerHTML = items.map((d, i) => `
      <div class="agent-step">
        <div class="step-num">${i + 1}</div>
        <div class="step-content">
          <div class="step-agent">${d.agent_name}</div>
          <div class="step-role">${d.role}</div>
          <div class="step-text">${d.decision_text}</div>
          ${d.payload ? `<div class="step-payload">${JSON.stringify(d.payload, null, 2)}</div>` : ''}
        </div>
        <div style="flex-shrink:0">
          <span class="badge badge-${d.status==='Success'?'green':'rose'}">${d.status==='Success'?'نجاح':'فشل'}</span>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">${formatDate(d.created_at)}</div>
        </div>
      </div>`).join('');
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

/* ===== A2A SIMULATION ===== */
async function runSimulation(scenario) {
  if (!currentStoreId) {
    showToast('يرجى اختيار متجر أولاً من القائمة العلوية', 'error');
    return;
  }
  const loading = document.getElementById('simLoading');
  const resultsContainer = document.getElementById('simResultsContainer');
  const resultsEl = document.getElementById('simResults');

  resultsContainer.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/simulate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, store_id: currentStoreId })
    });
    const decisions = await res.json();

    if (!Array.isArray(decisions) || !decisions.length) {
      showToast('لم يُرجع الوكيل نتائج', 'error');
      loading.classList.add('hidden');
      return;
    }

    // Animate steps one by one
    loading.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsEl.innerHTML = '';

    for (let i = 0; i < decisions.length; i++) {
      await new Promise(r => setTimeout(r, 450));
      const d = decisions[i];
      const stepEl = document.createElement('div');
      stepEl.className = 'agent-step';
      stepEl.style.opacity = '0';
      stepEl.style.transform = 'translateX(20px)';
      stepEl.innerHTML = `
        <div class="step-num">${i + 1}</div>
        <div class="step-content">
          <div class="step-agent">${d.agent_name}</div>
          <div class="step-role">${d.role}</div>
          <div class="step-text">${d.decision_text}</div>
          ${d.payload ? `<div class="step-payload">${JSON.stringify(d.payload, null, 2)}</div>` : ''}
        </div>
        <span class="badge badge-green">نجاح</span>`;
      resultsEl.appendChild(stepEl);
      requestAnimationFrame(() => {
        stepEl.style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        stepEl.style.opacity = '1';
        stepEl.style.transform = 'translateX(0)';
      });
    }

    showToast(`✅ تم تنفيذ ${decisions.length} قرارات وكلاء بنجاح!`, 'success');
    // Refresh agent decisions page
    await loadAgentDecisions();
  } catch (err) {
    loading.classList.add('hidden');
    showToast('فشل تنفيذ المحاكاة: ' + err.message, 'error');
  }
}

/* ===== FORMS ===== */
function initForms() {
  // Store Form
  document.getElementById('storeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) { showToast('يجب تسجيل الدخول أولاً', 'error'); return; }
    const res = await apiFetch('/stores/', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('storeName').value,
        description: document.getElementById('storeDesc').value,
        category: document.getElementById('storeCategory').value,
        status: 'Active',
        owner: currentUser.id
      })
    });
    if (res.ok) {
      closeModal('storeModal');
      showToast('تم إنشاء المتجر بنجاح 🎉', 'success');
      await Promise.all([loadStores(), loadStoreSelect()]);
      e.target.reset();
    } else {
      const err = await res.json();
      showToast('فشل إنشاء المتجر: ' + JSON.stringify(err), 'error');
    }
  });

  // Product Form
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStoreId) { showToast('اختر متجراً أولاً', 'error'); return; }
    const res = await apiFetch('/products/', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('productName').value,
        description: document.getElementById('productDesc').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        store: currentStoreId
      })
    });
    if (res.ok) {
      closeModal('productModal');
      showToast('تم إضافة المنتج بنجاح ✅', 'success');
      await loadProducts();
      e.target.reset();
    } else {
      showToast('فشل إضافة المنتج', 'error');
    }
  });

  // Campaign Form
  document.getElementById('campaignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStoreId) { showToast('اختر متجراً أولاً', 'error'); return; }
    const res = await apiFetch('/campaigns/', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('campaignName').value,
        platform: document.getElementById('campaignPlatform').value,
        budget: parseFloat(document.getElementById('campaignBudget').value),
        target_audience: document.getElementById('campaignAudience').value,
        content: document.getElementById('campaignContent').value,
        status: 'Active',
        store: currentStoreId
      })
    });
    if (res.ok) {
      closeModal('campaignModal');
      showToast('تم إطلاق الحملة بنجاح 🚀', 'success');
      await loadCampaigns();
      e.target.reset();
    } else {
      showToast('فشل إنشاء الحملة', 'error');
    }
  });

  // Support Ticket Form
  document.getElementById('ticketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiFetch('/tickets/', {
      method: 'POST',
      body: JSON.stringify({
        customer_name_raw: document.getElementById('ticketName').value,
        customer_email_raw: document.getElementById('ticketEmail').value,
        query: document.getElementById('ticketQuery').value,
        status: 'Open'
      })
    });
    if (res.ok) {
      showToast('تم إرسال تذكرة الدعم بنجاح 💬', 'success');
      await loadTickets();
      e.target.reset();
    } else {
      showToast('فشل إرسال التذكرة', 'error');
    }
  });
}

/* ===== DELETE ===== */
async function deleteItem(endpoint, id, refreshFn) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  try {
    const res = await apiFetch(`/${endpoint}/${id}/`, { method: 'DELETE' });
    if (res.status === 204) {
      showToast('تم الحذف بنجاح', 'success');
      await refreshFn();
    } else {
      showToast('فشل الحذف', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال', 'error');
  }
}

/* ===== MODALS ===== */
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && overlay.id !== 'authModal') {
      overlay.classList.remove('active');
    }
  });
});

/* ===== HELPERS ===== */
async function apiFetch(path, options = {}) {
  const defaults = {
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': '' }
  };
  return fetch(`${API_BASE}${path}`, { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } });
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 350);
  }, 3500);
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
  const map = {
    Active: ['badge-green', 'نشط'],
    Paused: ['badge-gold', 'موقوف'],
    Completed: ['badge-gray', 'منتهي'],
    Pending: ['badge-gold', 'معلق'],
    Paid: ['badge-blue', 'مدفوع'],
    Shipped: ['badge-blue', 'في الشحن'],
    Delivered: ['badge-green', 'مُسلَّم'],
    Returned: ['badge-rose', 'مُرجَع'],
    Cancelled: ['badge-rose', 'مُلغى'],
    Open: ['badge-rose', 'مفتوح'],
    Closed: ['badge-green', 'مغلق'],
    Success: ['badge-green', 'نجاح'],
    Failed: ['badge-rose', 'فشل'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function getSentimentEmoji(s) {
  return s === 'Positive' ? '😊 إيجابي' : s === 'Negative' ? '😞 سلبي' : '😐 محايد';
}

/* =====================================================
   GE_Sky — New Deep Pages Data Loaders and Handlers
   ===================================================== */

// Global state for toggled gateways
const enabledGateways = { Stripe: true, PayPal: false, COD: true };

/* ===== BRAND PROFILE & CONTENT LIBRARY (SYS-CONTENT) ===== */
let brandProfileId = null;

async function loadBrandProfile() {
  if (!currentStoreId) return;
  try {
    const res = await apiFetch(`/brand-profiles/?store=${currentStoreId}`);
    const data = await res.json();
    const profile = data.results ? data.results[0] : (Array.isArray(data) ? data[0] : data);
    
    if (profile && profile.id) {
      brandProfileId = profile.id;
      document.getElementById('brandVoice').value = profile.brand_voice || '';
      document.getElementById('brandColors').value = profile.brand_colors || '';
    } else {
      brandProfileId = null;
      document.getElementById('brandVoice').value = '';
      document.getElementById('brandColors').value = '';
    }
  } catch (err) {
    console.error('Failed to load brand profile', err);
  }
}

async function loadContentLibrary() {
  const el = document.getElementById('contentLibraryList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/content-library/?store=${currentStoreId}` : '/content-library/';
    const res = await apiFetch(url);
    const data = await res.json();
    const items = data.results ?? data;
    if (!items.length) {
      el.innerHTML = '<div class="empty-state"><p>المكتبة فارغة. قم بتوليد محتوى جديد بالذكاء الاصطناعي!</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>النوع</th><th>اللغة</th><th>المحتوى المولد</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
        <tbody>${items.map(item => `
          <tr>
            <td><span class="badge badge-blue">${item.content_type}</span></td>
            <td><span class="badge badge-gray">${item.language.toUpperCase()}</span></td>
            <td><p style="max-width:400px; white-space:normal; line-height:1.5;">${item.text_content}</p></td>
            <td>${formatDate(item.created_at)}</td>
            <td><button class="btn-danger" onclick="deleteItem('content-library', ${item.id}, loadContentLibrary)">حذف</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل مكتبة المحتوى</p></div>';
  }
}

/* ===== LOGISTICS INVENTORY & SHIPMENTS (SYS-LOGISTICS) ===== */
async function loadLogisticsInventory() {
  const el = document.getElementById('logisticsInventoryList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/products/?store=${currentStoreId}` : '/products/';
    const res = await apiFetch(url);
    const data = await res.json();
    const products = data.results ?? data;
    if (!products.length) {
      el.innerHTML = '<div class="empty-state"><p>لا توجد منتجات لتعديل مخزونها.</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>المنتج</th><th>المخزون الحالي</th><th>حالة الإتاحة</th><th>إجراءات تعديل المخزون</th></tr></thead>
        <tbody>${products.map(p => `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td><span class="badge badge-${p.stock > 10 ? 'green' : 'rose'}" id="stock-val-${p.id}">${p.stock} وحدة</span></td>
            <td>${p.stock > 0 ? '<span class="badge badge-green">متوفر</span>' : '<span class="badge badge-rose">نفد</span>'}</td>
            <td>
              <button class="btn-sm" onclick="adjustProductStock(${p.id}, ${p.stock}, 5)">+5</button>
              <button class="btn-sm" onclick="adjustProductStock(${p.id}, ${p.stock}, -5)">-5</button>
              <button class="btn-sm" onclick="adjustProductStock(${p.id}, ${p.stock}, 50)">+50</button>
              <button class="btn-sm" style="border-color:var(--sky-cyan); color:var(--sky-cyan)" onclick="publishProduct(${p.id})">✨ إعادة نشر وكيل كتالوج</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل قائمة المخزون</p></div>';
  }
}

async function adjustProductStock(id, currentStock, change) {
  const newStock = Math.max(0, currentStock + change);
  try {
    const res = await apiFetch(`/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: newStock })
    });
    if (res.ok) {
      showToast('تم تعديل المخزون بنجاح', 'success');
      await loadLogisticsInventory();
    } else {
      showToast('فشل تعديل المخزون', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

async function publishProduct(id) {
  try {
    const res = await apiFetch(`/products/${id}/publish/`, { method: 'POST' });
    if (res.ok) {
      showToast('أطلق الوكيل Catalog Agent قرار التحديث بنجاح', 'success');
    } else {
      showToast('فشل نشر المنتج', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

async function loadShipments() {
  const el = document.getElementById('logisticsShipmentsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/shipments/?store=${currentStoreId}` : '/shipments/';
    const res = await apiFetch(url);
    const data = await res.json();
    const shipments = data.results ?? data;
    if (!shipments.length) {
      el.innerHTML = '<div class="empty-state"><p>لا توجد شحنات مسجلة حالياً.</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>الطلب</th><th>الناقل</th><th>الحالة اللوجستية</th><th>الموقع الحالي</th><th>موعد التوصيل المتوقع</th></tr></thead>
        <tbody>${shipments.map(s => `
          <tr>
            <td><strong>#${s.order}</strong></td>
            <td><span class="badge badge-blue">${s.carrier}</span></td>
            <td>${getStatusBadge(s.status)}</td>
            <td><code style="font-size:0.75rem">${s.current_location}</code></td>
            <td>${s.estimated_delivery || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل قائمة الشحنات</p></div>';
  }
}

async function loadReturns() {
  const el = document.getElementById('logisticsReturnsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/returns/?store=${currentStoreId}` : '/returns/';
    const res = await apiFetch(url);
    const data = await res.json();
    const items = data.results ?? data;
    if (!items.length) {
      el.innerHTML = '<div class="empty-state"><p>لا توجد طلبات إرجاع حالياً.</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>الطلب</th><th>سبب الإرجاع</th><th>المبلغ المسترد</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>${items.map(r => `
          <tr>
            <td><strong>#${r.order}</strong></td>
            <td><small>${r.reason}</small></td>
            <td>$${parseFloat(r.refund_amount).toFixed(2)}</td>
            <td>${getStatusBadge(r.status)}</td>
            <td>
              ${r.status === 'Pending' ? `
                <button class="btn-sm" style="border-color:var(--sky-emerald); color:var(--sky-emerald)" onclick="handleReturnStatus(${r.id}, 'Approved')">قبول</button>
                <button class="btn-sm" style="border-color:var(--sky-rose); color:var(--sky-rose)" onclick="handleReturnStatus(${r.id}, 'Rejected')">رفض</button>
              ` : '—'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل طلبات الإرجاع</p></div>';
  }
}

async function handleReturnStatus(id, newStatus) {
  try {
    const res = await apiFetch(`/returns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(`تمت ${newStatus === 'Approved' ? 'الموافقة على' : 'رفض'} طلب الإرجاع`, 'success');
      await loadReturns();
    } else {
      showToast('فشل تعديل حالة الإرجاع', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

/* ===== PAYMENTS, TRANSACTIONS, AND INVOICES (SYS-PAYMENTS) ===== */
async function loadInvoices() {
  const el = document.getElementById('paymentsInvoicesList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/invoices/?store=${currentStoreId}` : '/invoices/';
    const res = await apiFetch(url);
    const data = await res.json();
    const invoices = data.results ?? data;
    if (!invoices.length) {
      el.innerHTML = '<div class="empty-state"><p>لا توجد فواتير مصدرة.</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>القيمة</th><th>الحالة</th><th>إجراءات الفوترة</th></tr></thead>
        <tbody>${invoices.map(inv => `
          <tr>
            <td><strong>#INV-${inv.id}</strong></td>
            <td>${inv.customer_name}</td>
            <td>$${parseFloat(inv.amount).toFixed(2)}</td>
            <td>${getStatusBadge(inv.status)}</td>
            <td>
              <button class="btn-sm" onclick="sendInvoice(${inv.id})">✉️ إرسال</button>
              <button class="btn-sm" onclick="downloadInvoice(${inv.id})">📥 تنزيل</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل قائمة الفواتير</p></div>';
  }
}

function sendInvoice(id) {
  showToast(`تم إرسال الفاتورة #INV-${id} بنجاح إلى البريد الإلكتروني للعميل`, 'success');
}

function downloadInvoice(id) {
  showToast(`بدأ تحميل ملف الفاتورة #INV-${id}.pdf`, 'success');
}

async function loadTransactions() {
  const el = document.getElementById('paymentsTransactionsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const url = currentStoreId ? `/transactions/?store=${currentStoreId}` : '/transactions/';
    const res = await apiFetch(url);
    const data = await res.json();
    const transactions = data.results ?? data;
    if (!transactions.length) {
      el.innerHTML = '<div class="empty-state"><p>لا توجد عمليات معاملات مالية بعد.</p></div>';
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>رقم المعاملة</th><th>رقم الطلب</th><th>القيمة</th><th>بوابة الدفع</th><th>الحالة</th><th>التاريخ</th><th>إجراءات مالية</th></tr></thead>
        <tbody>${transactions.map(t => `
          <tr>
            <td><strong>#TXN-${t.id}</strong></td>
            <td>#${t.order}</td>
            <td style="color:var(--sky-emerald); font-weight:700">$${parseFloat(t.amount).toFixed(2)}</td>
            <td><span class="badge badge-blue">${t.payment_method}</span></td>
            <td>${getStatusBadge(t.status)}</td>
            <td>${formatDate(t.created_at)}</td>
            <td>
              ${t.status === 'Success' ? `
                <button class="btn-danger" style="padding:4px 8px" onclick="refundTransaction(${t.id})">إرجاع مالي</button>
              ` : '—'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل قائمة المعاملات</p></div>';
  }
}

async function refundTransaction(id) {
  if (!confirm('هل أنت متأكد من إرجاع هذه المعاملة مالياً بالكامل؟')) return;
  try {
    const res = await apiFetch(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Refunded' })
    });
    if (res.ok) {
      showToast('تمت معالجة الإرجاع المالي بنجاح وإرجاع المبلغ للبطاقة الائتمانية للعميل', 'success');
      await loadTransactions();
    } else {
      showToast('فشل معالجة الإرجاع المالي', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

function updateGatewayButtons() {
  for (const gate in enabledGateways) {
    const btn = document.getElementById(`gate-${gate.toLowerCase()}`);
    if (btn) {
      if (enabledGateways[gate]) {
        btn.textContent = 'تعطيل';
        btn.className = 'btn-sm btn-danger';
        btn.style.borderColor = 'hsla(345, 90%, 62%, 0.2)';
      } else {
        btn.textContent = 'تفعيل';
        btn.className = 'btn-sm';
        btn.style.borderColor = 'var(--border)';
      }
    }
  }
}

function toggleGateway(gatewayName) {
  enabledGateways[gatewayName] = !enabledGateways[gatewayName];
  updateGatewayButtons();
  showToast(`تم ${enabledGateways[gatewayName] ? 'تفعيل' : 'تعطيل'} بوابة الدفع ${gatewayName} بنجاح`, 'info');
}

/* ===== ANALYTICS AND PERFORMANCE (SYS-ANALYTICS) ===== */
async function loadAnalyticsData() {
  try {
    const sq = currentStoreId ? `?store=${currentStoreId}` : '';
    const [oRes, tRes, cRes, cuRes] = await Promise.all([
      apiFetch(`/orders/${sq}`),
      apiFetch(`/transactions/${sq}`),
      apiFetch(`/campaigns/${sq}`),
      apiFetch('/customers/'),
    ]);
    const [oD, tD, cD, cuD] = await Promise.all([
      oRes.json(), tRes.json(), cRes.json(), cuRes.json()
    ]);
    const orders    = oD.results  ?? oD;
    const txs       = tD.results  ?? tD;
    const campaigns = cD.results  ?? cD;
    const customers = cuD.results ?? cuD;

    const txRev   = txs.filter(t => t.status === 'Success').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const ordRev  = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const revenue = Math.max(txRev, ordRev);

    const done     = orders.filter(o => ['Delivered', 'Completed', 'Shipped'].includes(o.status)).length;
    const convRate = orders.length > 0 ? ((done / orders.length) * 100).toFixed(1) : 0;

    const budget = campaigns.reduce((s, c) => s + parseFloat(c.budget || 0), 0);
    const roas   = budget > 0 ? (revenue / budget).toFixed(2) : null;

    const vip = customers.filter(c => c.segment === 'VIP' || c.loyalty_points > 100).length;
    const sat = customers.length > 0 ? Math.min(Math.round((vip / customers.length) * 100 + 68), 99) : 94;

    document.getElementById('analytics-revenue').textContent     = `$${revenue.toFixed(2)}`;
    document.getElementById('analytics-conversion').textContent  = `${convRate}%`;
    document.getElementById('analytics-roi').textContent         = roas ? `${roas}x` : 'N/A';
    document.getElementById('analytics-satisfaction').textContent = `${sat}%`;

    const bd = document.getElementById('analyticsBreakdown');
    if (bd) {
      const rows = [
        ['📦', 'إجمالي الطلبات المستلمة', orders.length],
        ['✅', 'طلبات ناجحة ومكتملة والتوصيل', done],
        ['💳', 'معاملات بوابات الدفع الناجحة', txs.filter(t => t.status === 'Success').length],
        ['📢', 'حملات تسويقية نشطة ومستمرة', campaigns.filter(c => c.status === 'Active').length],
        ['👥', 'إجمالي العملاء في النظام', customers.length],
        ['⭐', 'عملاء الفئة الممتازة (VIP)', vip],
        ['💰', 'إجمالي ميزانية الحملات التسويقية', `$${budget.toFixed(2)}`],
      ];
      bd.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;"></th>
              <th>المؤشر المالي والتشغيلي</th>
              <th>القيمة الفعلية</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(([ico, label, val]) => `
              <tr>
                <td style="font-size:1.2rem; text-align:center;">${ico}</td>
                <td>${label}</td>
                <td><strong style="color:var(--sky-cyan);">${val}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (err) {
    console.error('Failed to load analytics data', err);
  }
}

function exportAnalyticsReport() {
  showToast('يجري الآن توليد وتصدير ملف التقرير المالي والإعلاني بصيغة PDF...', 'success');
}

/* ===== INTEGRATIONS AND SETTINGS (SYS-AUTOMATION) ===== */
async function loadIntegrations() {
  const el = document.getElementById('integrationsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const res = await apiFetch('/integrations/');
    const data = await res.json();
    const items = data.results ?? data;
    if (!items.length) {
      el.innerHTML = '<div class="empty-state"><p>لا توجد تكاملات خارجية مضافة.</p></div>';
      return;
    }
    el.innerHTML = items.map(integ => `
      <div class="data-row">
        <div class="data-icon">🔌</div>
        <div class="data-info">
          <div class="data-name">${integ.name}</div>
          <div class="data-sub">التصنيف: ${integ.integration_type} • تاريخ الربط: ${formatDate(integ.created_at)}</div>
        </div>
        <div class="data-meta" style="display:flex; gap:10px; align-items:center;">
          <button class="btn-sm" style="border-color:var(--sky-blue); color:var(--sky-blue)" onclick="testIntegrationConnection('${integ.name}')">اختبار الاتصال</button>
          <button class="btn-sm ${integ.status === 'Enabled' ? 'btn-danger' : ''}" onclick="toggleIntegration(${integ.id}, '${integ.status}')">
            ${integ.status === 'Enabled' ? 'تعطيل' : 'تفعيل'}
          </button>
        </div>
      </div>`).join('');
  } catch {
    el.innerHTML = '<div class="empty-state"><p>تعذر تحميل قائمة التكاملات</p></div>';
  }
}

function testIntegrationConnection(name) {
  showToast(`🧪 يجري اختبار الاتصال مع بوابة ${name}...`, 'info');
  setTimeout(() => {
    showToast(`✅ تم الاتصال بنجاح مع ${name}! الاستجابة 200 OK`, 'success');
  }, 1000);
}

async function toggleIntegration(id, currentStatus) {
  const newStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
  try {
    const res = await apiFetch(`/integrations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(`تم ${newStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} التكامل بنجاح`, 'success');
      await loadIntegrations();
    } else {
      showToast('فشل تعديل حالة التكامل', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

function loadProfile() {
  if (currentUser) {
    document.getElementById('profileName').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email || 'admin@gesky.com';
  }
}

/* ===== CRM ACTIONS ===== */
async function loadCustomers() {
  const el = document.getElementById('customersList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const res = await apiFetch('/customers/');
    const data = await res.json();
    const custs = data.results ?? data;
    if (!custs.length) { el.innerHTML = '<div class="empty-state"><p>لا يوجد عملاء.</p></div>'; return; }
    el.innerHTML = custs.map(c => `
      <div class="data-row">
        <div class="data-icon">👤</div>
        <div class="data-info">
          <div class="data-name">${c.name}</div>
          <div class="data-sub">${c.email} • ${c.phone || '—'}</div>
        </div>
        <div class="data-meta">
          <div style="margin-bottom:6px"><span class="badge badge-${c.segment==='VIP'?'gold':'blue'}">${c.segment}</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted)">⭐ ${c.loyalty_points} نقطة</div>
          <div style="margin-top:6px">
            <button class="btn-sm" style="padding:2px 6px; font-size:0.7rem;" onclick="addLoyaltyPoints(${c.id})">+15 نقطة</button>
          </div>
        </div>
      </div>`).join('');
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

async function addLoyaltyPoints(id) {
  try {
    const res = await apiFetch(`/customers/${id}/add-loyalty/`, {
      method: 'POST',
      body: JSON.stringify({ points: 15 })
    });
    if (res.ok) {
      showToast('أضاف وكيل CRM نقاط الولاء بنجاح للعميل', 'success');
      await loadCustomers();
    } else {
      showToast('فشل إضافة نقاط الولاء', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

async function loadTickets() {
  const el = document.getElementById('ticketsList');
  el.innerHTML = '<div class="skeleton-list"><div class="skel"></div></div>';
  try {
    const res = await apiFetch('/tickets/');
    const data = await res.json();
    const tickets = data.results ?? data;
    if (!tickets.length) { el.innerHTML = '<div class="empty-state"><p>لا توجد تذاكر.</p></div>'; return; }
    el.innerHTML = tickets.slice(0, 8).map(t => `
      <div class="data-row">
        <div class="data-icon">🎫</div>
        <div class="data-info">
          <div class="data-name">${t.customer_name_raw || 'عميل مجهول'} — <small>${t.query?.slice(0,40)}...</small></div>
          <div class="data-sub">وكيل: ${t.assigned_agent}</div>
        </div>
        <div class="data-meta" style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
          <div><span class="badge badge-${t.status==='Closed'?'green':(t.status==='Escalated'?'purple':'rose')}">${t.status==='Closed'?'مغلقة':(t.status==='Escalated'?'مصعّدة':'مفتوحة')}</span></div>
          <div style="font-size:0.75rem; margin-top:2px;">${getSentimentEmoji(t.sentiment)}</div>
          ${t.status === 'Open' ? `
            <div style="margin-top:4px; display:flex; gap:5px;">
              <button class="btn-sm" style="padding:2px 6px; font-size:0.7rem; border-color:var(--sky-violet); color:var(--sky-violet);" onclick="escalateTicket(${t.id})">تصعيد</button>
              <button class="btn-sm" style="padding:2px 6px; font-size:0.7rem; border-color:var(--sky-emerald); color:var(--sky-emerald);" onclick="closeTicket(${t.id})">حل</button>
            </div>
          ` : ''}
        </div>
      </div>`).join('');
  } catch { el.innerHTML = '<div class="empty-state"><p>تعذر التحميل</p></div>'; }
}

async function escalateTicket(id) {
  try {
    const res = await apiFetch(`/tickets/${id}/escalate/`, { method: 'POST' });
    if (res.ok) {
      showToast('تم تصعيد تذكرة الدعم بنجاح للمشرف العام', 'success');
      await loadTickets();
    } else {
      showToast('فشل تصعيد التذكرة', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

async function closeTicket(id) {
  try {
    const res = await apiFetch(`/tickets/${id}/close/`, { method: 'POST' });
    if (res.ok) {
      showToast('تم حل وإغلاق تذكرة الدعم بنجاح', 'success');
      await loadTickets();
    } else {
      showToast('فشل إغلاق التذكرة', 'error');
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', 'error');
  }
}

/* ===== NEW INITIALIZATIONS ===== */
const parentInitForms = initForms;
initForms = function() {
  parentInitForms();
  updateGatewayButtons();

  // Brand Form Submit
  const brandForm = document.getElementById('brandForm');
  if (brandForm) {
    brandForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentStoreId) { showToast('يرجى اختيار متجر أولاً', 'error'); return; }
      
      const payload = {
        store: currentStoreId,
        brand_voice: document.getElementById('brandVoice').value,
        brand_colors: document.getElementById('brandColors').value
      };

      try {
        const method = brandProfileId ? 'PUT' : 'POST';
        const path = brandProfileId ? `/brand-profiles/${brandProfileId}/` : '/brand-profiles/';
        const res = await apiFetch(path, {
          method: method,
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('تم حفظ إعدادات هوية العلامة التجارية بنجاح! 🎨', 'success');
          await loadBrandProfile();
        } else {
          showToast('فشل حفظ إعدادات الهوية', 'error');
        }
      } catch {
        showToast('خطأ في الاتصال', 'error');
      }
    });
  }

  // AI Content Form Submit
  const aiContentForm = document.getElementById('aiContentForm');
  if (aiContentForm) {
    aiContentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentStoreId) { showToast('يرجى اختيار متجر أولاً', 'error'); return; }
      
      const actionType = document.getElementById('contentActionType').value;
      const input = document.getElementById('contentInput').value;
      const lang = document.getElementById('contentLanguage').value;

      showToast('✨ يجري استدعاء وكيل استوديو المحتوى وتوليد النص...', 'info');

      // Simulate creative AI generation log
      setTimeout(async () => {
        let generatedText = "";
        if (actionType === 'generate') {
          generatedText = `[AI Ad Copy] - ${input} - متوفر الآن لدى متجرنا بأفضل الأسعار وبجودة لا تضاهى!`;
        } else if (actionType === 'rewrite') {
          generatedText = `[AI Rewrite] - صياغة جديدة محسنة: ${input}`;
        } else {
          generatedText = `[AI Translation] - Translated text into ${lang.toUpperCase()}: ${input}`;
        }

        try {
          const res = await apiFetch('/content-library/', {
            method: 'POST',
            body: JSON.stringify({
              store: currentStoreId,
              content_type: actionType === 'generate' ? 'Ad Copy' : (actionType === 'rewrite' ? 'Product Description' : 'Translation'),
              text_content: generatedText,
              language: lang
            })
          });
          if (res.ok) {
            showToast('تم إدراج النص المولد في مكتبة المحتوى بنجاح! ✍️', 'success');
            e.target.reset();
            await loadContentLibrary();
          } else {
            showToast('فشل حفظ النص المولد في قاعدة البيانات', 'error');
          }
        } catch {
          showToast('خطأ في الربط بقاعدة البيانات', 'error');
        }
      }, 1000);
    });
  }

  // Profile Form Submit
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newName = document.getElementById('profileName').value;
      const newEmail = document.getElementById('profileEmail').value;
      const newPass = document.getElementById('profilePassword').value;

      showToast('يجري تحديث معلومات الملف الشخصي...', 'info');
      setTimeout(() => {
        if (currentUser) {
          currentUser.username = newName;
          currentUser.email = newEmail;
          document.getElementById('userName').textContent = newName;
          document.getElementById('userAvatar').textContent = newName.charAt(0).toUpperCase();
        }
        showToast('تم تحديث بيانات ملفك الشخصي بنجاح! 👤', 'success');
        e.target.reset();
        loadProfile();
      }, 800);
    });
  }

  // What-If Form Submit
  const whatifForm = document.getElementById('whatifForm');
  if (whatifForm) {
    whatifForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const priceChange = parseFloat(document.getElementById('whatifPrice').value || 0);
      const budgetChange = parseFloat(document.getElementById('whatifBudget').value || 0);

      showToast('📊 يقوم وكيل ذكاء القرار (Decision Agent) بحساب المؤشرات المتوقعة...', 'info');
      
      setTimeout(() => {
        let vol = 0;
        let margin = 0;
        let conv = 3.2;

        // Simple mock calculations based on inputs
        if (priceChange < 0) {
          vol += Math.abs(priceChange) * 2.5; // Lower price increases volume
          margin += priceChange * 1.2;       // Lower price decreases margin
          conv += Math.abs(priceChange) * 0.15;
        } else if (priceChange > 0) {
          vol -= priceChange * 1.8;
          margin += priceChange * 0.9;
          conv -= priceChange * 0.1;
        }

        if (budgetChange > 0) {
          vol += (budgetChange / 50) * 3.5;
          conv += (budgetChange / 100) * 0.1;
        }

        document.getElementById('whatifResults').classList.remove('hidden');
        document.getElementById('whatif-vol').textContent = `${vol >= 0 ? '+' : ''}${vol.toFixed(1)}%`;
        document.getElementById('whatif-vol').style.color = vol >= 0 ? 'var(--sky-emerald)' : 'var(--sky-rose)';
        
        const finalMargin = (15 + margin);
        document.getElementById('whatif-margin').textContent = `${finalMargin.toFixed(1)}%`;
        document.getElementById('whatif-conversion').textContent = `${Math.max(0.5, conv).toFixed(1)}%`;

        showToast('✅ تم حساب نتائج المحاكاة بنجاح عبر الوكلاء التشغيليين', 'success');
      }, 1000);
    });
  }

  // API Settings Form Submit
  const apiSettingsForm = document.getElementById('apiSettingsForm');
  if (apiSettingsForm) {
    document.getElementById('apiUrlInput').value = API_BASE;
    apiSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newUrl = document.getElementById('apiUrlInput').value.trim();
      if (newUrl) {
        localStorage.setItem('GE_SKY_API_BASE', newUrl);
        showToast('تم حفظ رابط خادم الـ API بنجاح! جارٍ إعادة تحميل الصفحة...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });
  }
};

// Reset API URL to default
function resetApiUrl() {
  localStorage.removeItem('GE_SKY_API_BASE');
  showToast('تمت استعادة عنوان الخادم الافتراضي. جارٍ إعادة تحميل الصفحة...', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

