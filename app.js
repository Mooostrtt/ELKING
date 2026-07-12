// ─────────────────────────────────────────────
//  VIP Packages  –  app.js  (Vanilla ES Module)
// ─────────────────────────────────────────────

// تم وضع الرابط الحقيقي والنهائي لـ Replit الخاص بك 🚀
const BASE = 'https://data-packages-frontend.asdfghjklsoftnx.replit.dev/api';

// ──────────── STATE ────────────
let currentUser  = null;
let packages     = [];
let adminWallet  = '01030982295';
let selCompany   = null;
let selPkg       = null;
let selectedFile = null;

// Restore session from localStorage
try {
  const saved = localStorage.getItem('vip_user');
  if (saved) currentUser = JSON.parse(saved);
} catch {}

// ──────────── TOAST ────────────
let toastTimer = null;
function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3200);
}

// ──────────── NAVIGATION ────────────
function show(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function updateNav() {
  const nav = document.getElementById('navRight');
  if (!nav) return;
  if (currentUser) {
    nav.innerHTML = `
      <span class="nav-user-name">👤 ${esc(currentUser.name)}</span>
      <button class="btn btn-ghost btn-sm" onclick="App.logout()">خروج</button>
    `;
  } else {
    nav.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="App.show('login')">تسجيل الدخول</button>
      <button class="btn btn-gold   btn-sm" onclick="App.show('register')">إنشاء حساب</button>
    `;
  }
}

// ──────────── API HELPER ────────────
async function api(path, opts = {}) {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type' : 'application/json' , ...opts.headers },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `خطأ ${res.status}`);
  return data;
}

// ──────────── LOAD PACKAGES ────────────
async function loadPackages() {
  try {
    const data  = await api('/packages');
    packages    = data.companies || [];
    adminWallet = data.adminWallet || adminWallet;
    renderPackages();
  } catch {
    document.getElementById('pkgContainer').innerHTML =
      `<div class="loader" style="color:#e05555">❌ فشل تحميل الباقات – تحقق من اتصالك وأعد تحميل الصفحة</div>`;
  }
}

// ──────────── COMPANY COLORS ────────────
const CO_COLORS = {
  we:        '#1a56db' ,
  orange:    '#ea580c' ,
  vodafone:  '#dc2626' ,
  etisalat:  '#16a34a' ,
};

// ──────────── RENDER PACKAGES ────────────
function renderPackages() {
  const container = document.getElementById('pkgContainer');
  if (!container) return;
  if (!packages.length) {
    container.innerHTML = `<div class="loader">لا توجد باقات متاحة حالياً</div>`;
    return;
  }

  container.innerHTML = packages.map(co => {
    const color    = CO_COLORS[co.id] || '#c9a24b' ;
    const initials = co.name.slice(0, 3);
    const pkgCards = co.packages.map(pkg => `
      <div class="pkg-card"
           onclick="App.openModal('${co.id}', '${pkg.id}')">
        <div class="pkg-data">${esc(pkg.name)}</div>
        <div class="pkg-dur">${esc(pkg.duration)}</div>
        <div class="pkg-price">${pkg.price}<small>جنيه</small></div>
        <button class="pkg-cta">اطلب الآن</button>
      </div>
    `).join('');

    return `
      <div class="co-section">
        <div class="co-header">
          <div class="co-logo" style="background:${color}">${initials}</div>
          <div>
            <div class="co-name-en">${esc(co.name)}</div>
            <div class="co-name-ar">${esc(co.nameAr)}</div>
          </div>
        </div>
        <div class="pkg-grid">${pkgCards}</div>
      </div>
    `;
  }).join('');
}

// ──────────── OPEN ORDER MODAL ────────────
function openModal(companyId, pkgId) {
  if (!currentUser) {
    toast('يرجى تسجيل الدخول أولاً للطلب', 'bad');
    setTimeout(() => show('login'), 700);
    return;
  }

  const co  = packages.find(c => c.id === companyId);
  const pkg = co?.packages.find(p => p.id === pkgId);
  if (!co || !pkg) return;

  selCompany   = co;
  selPkg       = pkg;
  selectedFile = null;

  document.getElementById('m-pkg-name').textContent = pkg.name;
  document.getElementById('m-co-name').textContent  = `${co.name} – ${co.nameAr}`;
  document.getElementById('m-price').textContent    = `${pkg.price} جنيه`;
  document.getElementById('m-wallet').textContent   = adminWallet;

  document.getElementById('orderForm').reset();
  ['o-target-err', 'o-file-err', 'o-global-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  const btn = document.getElementById('o-submit');
  if (btn) {
    btn.disabled    = false;
    btn.textContent = '✅ إرسال الطلب';
  }

  const zone = document.getElementById('uploadZone');
  if (zone) {
    zone.classList.remove('filled');
    const ico = zone.querySelector('.upload-ico');
    if (ico) ico.style.display = '';
    zone.querySelectorAll('.upload-txt').forEach(el => el.style.display = '');
  }
  const prev = document.getElementById('previewImg');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }

  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  selCompany = null; selPkg = null; selectedFile = null;
}

// ──────────── FILE UPLOAD HANDLER ────────────
function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileErr = document.getElementById('o-file-err');
  if (!file.type.startsWith('image/')) {
    if (fileErr) fileErr.textContent = 'يجب رفع ملف صورة فقط (PNG, JPG, WEBP)';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    if (fileErr) fileErr.textContent = 'حجم الصورة يجب ألا يتجاوز 10MB';
    return;
  }

  selectedFile = file;
  if (fileErr) fileErr.textContent = '';

  const zone = document.getElementById('uploadZone');
  if (zone) {
    zone.classList.add('filled');
    const ico = zone.querySelector('.upload-ico');
    if (ico) ico.style.display = 'none';
    zone.querySelectorAll('.upload-txt').forEach(el => el.style.display = 'none');
  }

  const prev = document.getElementById('previewImg');
  if (prev) {
    prev.src   = URL.createObjectURL(file);
    prev.style.display = 'block';
  }
}

// ──────────── SUBMIT ORDER ────────────
async function handleOrderSubmit(e) {
  e.preventDefault();
  let valid = true;

  const targetPhone = document.getElementById('o-target').value.trim();
  ['o-target-err', 'o-file-err', 'o-global-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  if (!targetPhone) {
    document.getElementById('o-target-err').textContent = 'يرجى إدخال رقم الهاتف';
    valid = false;
  } else if (!/^0[0-9]{10}$/.test(targetPhone)) {
    document.getElementById('o-target-err').textContent = 'رقم الهاتف غير صحيح – 11 رقم يبدأ بـ 0';
    valid = false;
  }

  if (!selectedFile) {
    document.getElementById('o-file-err').textContent = 'يرجى رفع صورة التحويل أولاً';
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('o-submit');
  if (btn) {
    btn.disabled    = true;
    btn.textContent = '⏳ جاري الإرسال...';
  }

  try {
    const fd = new FormData();
    fd.append('targetPhone', targetPhone);
    fd.append('company',     selCompany.nameAr);
    fd.append('packageName', selPkg.name);
    fd.append('packagePrice', String(selPkg.price));
    fd.append('userName',    currentUser.name);
    fd.append('userPhone',   currentUser.phone);
    fd.append('screenshot',  selectedFile);

    const res  = await fetch(`${BASE}/submit-order`, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      document.getElementById('o-global-err').textContent = data.error || 'حدث خطأ، حاول مرة أخرى';
      if (btn) { btn.disabled = false; btn.textContent = '✅ إرسال الطلب'; }
      return;
    }

    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    toast(data.message || 'تم إرسال طلبك بنجاح! ✅', 'ok');
    selCompany = null; selPkg = null; selectedFile = null;

  } catch {
    document.getElementById('o-global-err').textContent = 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت';
    if (btn) { btn.disabled = false; btn.textContent = '✅ إرسال الطلب'; }
  }
}

// ──────────── LOGIN ────────────
async function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors('l');

  const phone = document.getElementById('l-phone').value.trim();
  const pass  = document.getElementById('l-pass').value;
  let valid   = true;

  if (!phone) { setErr('l-phone-err', 'أدخل رقم الهاتف'); valid = false; }
  if (!pass)  { setErr('l-pass-err', 'أدخل كلمة المرور'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('l-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحقق...'; }

  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password: pass }),
    });
    currentUser = data.user;
    localStorage.setItem('vip_user', JSON.stringify(currentUser));
    updateNav();
    show('packages');
    toast(`مرحباً ${currentUser.name}! 👋`, 'ok');
  } catch (err) {
    setErr('l-global-err', err.message || 'خطأ في تسجيل الدخول');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'دخول'; }
  }
}

// ──────────── REGISTER ────────────
async function handleRegister(e) {
  e.preventDefault();
  clearAuthErrors('r');

  const name  = document.getElementById('r-name').value.trim();
  const phone = document.getElementById('r-phone').value.trim();
  const pass  = document.getElementById('r-pass').value;
  let valid   = true;

  if (!name)  { setErr('r-name-err', 'أدخل اسمك الكامل'); valid = false; }
  if (!phone) { setErr('r-phone-err', 'أدخل رقم الهاتف');  valid = false; }
  else if (!/^0[0-9]{10}$/.test(phone)) {
    setErr('r-phone-err', 'رقم غير صحيح – 11 رقم يبدأ بـ 0'); valid = false;
  }
  if (!pass)           { setErr('r-pass-err', 'أدخل كلمة المرور'); valid = false; }
  else if (pass.length < 4) { setErr('r-pass-err', 'كلمة المرور 4 أحرف على الأقل'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('r-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التسجيل...'; }

  try {
    const data = await api('/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password: pass }),
    });
    currentUser = data.user;
    localStorage.setItem('vip_user', JSON.stringify(currentUser));
    updateNav();
    show('packages');
    toast(`تم إنشاء حسابك! مرحباً ${currentUser.name} 🎉`, 'ok');
  } catch (err) {
    setErr('r-global-err', err.message || 'خطأ في التسجيل');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'إنشاء الحساب'; }
  }
}

// ──────────── LOGOUT ────────────
function logout() {
  currentUser = null;
  localStorage.removeItem('vip_user');
  updateNav();
  show('packages');
  toast('تم تسجيل الخروج بنجاح', 'ok');
}

// ──────────── HELPERS ────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearAuthErrors(prefix) {
  ['phone-err', 'pass-err', 'name-err', 'global-err'].forEach(s => {
    const el = document.getElementById(`${prefix}-${s}`);
    if (el) el.textContent = '';
  });
}

// ──────────── EYE TOGGLE ────────────
function bindEyeToggles() {
  document.querySelectorAll('.eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';  btn.textContent = '🙈';
      } else {
        input.type = 'password'; btn.textContent = '👁️';
      }
    });
  });
}

// ──────────── PUBLIC API (called from HTML) ────────────
window.App = { show, goPackages: () => show('packages'), logout, openModal, closeModal };

// ──────────── INIT ────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  show('packages');

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  
  const regForm = document.getElementById('regForm');
  if (regForm) regForm.addEventListener('submit', handleRegister);
  
  const orderForm = document.getElementById('orderForm');
  if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
  
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.addEventListener('change', onFileChange);

  bindEyeToggles();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  loadPackages();
});

