/* Gaming Hub MA - App Frontend Logic */

// Global State
let globalProducts = [];
let cart = JSON.parse(localStorage.getItem('ghma_cart') || '[]');
let currentCategoryFilter = 'all';
let currentLang = localStorage.getItem('ghma_lang') || 'ar';
let pendingWaText = '';

let pcBuilderState = {
  currentStep: 1,
  selectedCpu: null,
  selectedGpu: null,
  selectedMb: null,
  selectedRam: null,
  selectedStorage: null,
  selectedPsu: null,
  selectedCase: null,
  selectedMouse: null,
  selectedHeadset: null
};

// Translation Dictionaries (AR / FR / EN)
const i18n = {
  ar: {
    navHome: "الرئيسية",
    navProducts: "المنتجات",
    navBuilder: "مُجمّع البيسي 🛠️",
    startBuildBtn: "ابدأ تجميع البيسي ⚡",
    adminLoginBtn: "دخول الإدارة",
    heroTitle: "مرحباً بكم في Gaming Hub MA",
    heroSubtitle: "المتجر المتخصص الأقوى بالمغرب لتجميعات بيسي الألعاب، كروت الشاشة، المعالجات، وإكسسوارات الجيمنج الاحترافية.",
    heroCtaBuild: "ابدأ تجميع البيسي الخاص بك الآن | Start Build Ur PC 🛠️",
    heroCtaCatalog: "تصفح جميع المنتجات",
    builderBannerTitle: "مُجمّع البيسي التفاعلي الذكي (Custom PC Builder)",
    builderBannerDesc: "اختر مكونات البيسي خطوة بخطوة (CPU, GPU, RAM, PSU, Case, Peripherals). الأداة تتحقق تلقائياً من توافق القطع 100% وتحسب استهلاك الطاقة والمجموع بالدرهم (DH) مع إمكانية إرسال التجميعة للواتساب مباشرة!",
    catalogTitle: "كتالوج المنتجات",
    searchPlaceholder: "ابحث عن معالج، كارت شاشة، souris، clavier...",
    buyBtn: "شراء",
    viewBtn: "معاينة",
    cartTitle: "سلة المشتريات (Cart)",
    totalPriceLabel: "المجموع الكلي:",
    waOrderBtn: "إرسال الطلب عبر الواتساب (WhatsApp Order)"
  },
  fr: {
    navHome: "Accueil",
    navProducts: "Produits",
    navBuilder: "PC Builder 🛠️",
    startBuildBtn: "Configurer Votre PC ⚡",
    adminLoginBtn: "Connexion Admin",
    heroTitle: "Bienvenue chez Gaming Hub MA",
    heroSubtitle: "Le magasin N°1 au Maroc pour les PC Gamer sur mesure, Cartes Graphiques, Processeurs et Accessoires Gaming.",
    heroCtaBuild: "Commencer Votre Configuration PC | Start Build 🛠️",
    heroCtaCatalog: "Explorer Tous Les Produits",
    builderBannerTitle: "Configurateur PC Gamer Interactif (Custom PC Builder)",
    builderBannerDesc: "Choisissez vos composants étape par étape (CPU, GPU, RAM, Alim, Boîtier, Périphériques). L'outil vérifie la compatibilité à 100% et calcule le prix en DH avec envoi direct vers WhatsApp!",
    catalogTitle: "Catalogue De Produits",
    searchPlaceholder: "Rechercher processeur, carte graphique, souris, clavier...",
    buyBtn: "Acheter",
    viewBtn: "Aperçu",
    cartTitle: "Mon Panier",
    totalPriceLabel: "Total Global:",
    waOrderBtn: "Commander via WhatsApp"
  },
  en: {
    navHome: "Home",
    navProducts: "Products",
    navBuilder: "PC Builder 🛠️",
    startBuildBtn: "Start PC Build ⚡",
    adminLoginBtn: "Admin Login",
    heroTitle: "Welcome to Gaming Hub MA",
    heroSubtitle: "Morocco's #1 Store for Custom Gaming PCs, GPUs, CPUs, and Professional Gaming Peripherals.",
    heroCtaBuild: "Start Custom PC Builder | Start Build Ur PC 🛠️",
    heroCtaCatalog: "Browse All Products",
    builderBannerTitle: "Interactive Custom PC Builder",
    builderBannerDesc: "Choose your components step-by-step (CPU, GPU, RAM, PSU, Case, Peripherals). 100% compatibility check & live wattage calculation with 1-click WhatsApp order!",
    catalogTitle: "Product Catalog",
    searchPlaceholder: "Search CPU, GPU, mouse, keyboard...",
    buyBtn: "Buy Now",
    viewBtn: "Quick View",
    cartTitle: "Shopping Cart",
    totalPriceLabel: "Total Amount:",
    waOrderBtn: "Order via WhatsApp"
  }
};

// Language Switcher Function
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('ghma_lang', lang);

  // Toggle active button UI
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`lang-btn-${lang}`)?.classList.add('active');

  // Change HTML dir and lang attributes
  document.documentElement.lang = lang;
  if (lang === 'ar') {
    document.body.className = 'rtl';
    document.documentElement.dir = 'rtl';
  } else {
    document.body.className = 'ltr';
    document.documentElement.dir = 'ltr';
  }

  // Update text translations
  const t = i18n[lang] || i18n.ar;

  const navHome = document.getElementById('nav-home'); if (navHome) navHome.innerText = t.navHome;
  const navProducts = document.getElementById('nav-products'); if (navProducts) navProducts.innerText = t.navProducts;
  const navBuilder = document.getElementById('nav-builder'); if (navBuilder) navBuilder.innerText = t.navBuilder;
  const startBtn = document.querySelector('#btn-start-build span'); if (startBtn) startBtn.innerText = t.startBuildBtn;
  const heroTitle = document.querySelector('.hero-title'); if (heroTitle) heroTitle.innerText = t.heroTitle;
  const heroSub = document.querySelector('.hero-subtitle'); if (heroSub) heroSub.innerText = t.heroSubtitle;
  const heroCta1 = document.querySelector('.hero-cta-group .btn-primary span'); if (heroCta1) heroCta1.innerText = t.heroCtaBuild;
  const heroCta2 = document.querySelector('.hero-cta-group .btn-outline span'); if (heroCta2) heroCta2.innerText = t.heroCtaCatalog;
  
  const searchInput = document.getElementById('store-search');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  applyFilters();
}

// Helper to check active admin auth status
function getAdminAuthStatus() {
  if (typeof isAuthAdmin === 'function') {
    return isAuthAdmin();
  }
  return false;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Clear any legacy admin auth in localStorage so admin login is never saved permanently
  localStorage.removeItem('ghma_admin_auth');
  localStorage.removeItem('ghma_admin_email');

  fetchProducts();
  updateCartBadge();
  checkAdminSession();
  checkFirstTimeCustomer();
  checkAndShowNouveauArrivageOnVisit();

  // Drag and drop events setup for upload
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected({ target: { files: e.dataTransfer.files } });
      }
    });
  }
});

// Customer Account Functions
function getSavedCustomerAccount() {
  try {
    const data = localStorage.getItem('ghma_customer_account');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function checkFirstTimeCustomer() {
  const cust = getSavedCustomerAccount();
  if (!cust) {
    // Show modal automatically for first-time visitor
    setTimeout(() => {
      openCustomerModal(true);
    }, 600);
  } else {
    updateCustomerHeaderBtn(cust);
  }
}

function updateCustomerHeaderBtn(cust) {
  const label = document.getElementById('cust-btn-label');
  if (label) {
    if (cust && cust.username) {
      label.innerText = `👤 ${cust.username}`;
    } else {
      label.innerText = 'حسابي';
    }
  }
}

function openCustomerModal(isFirstTime = false) {
  const modal = document.getElementById('customer-account-modal');
  if (!modal) return;

  const cust = getSavedCustomerAccount();
  const usernameInput = document.getElementById('cust-username');
  const phoneInput = document.getElementById('cust-phone');
  const passInput = document.getElementById('cust-password');
  const logoutBtn = document.getElementById('btn-logout-cust');
  const statusMsg = document.getElementById('cust-status-msg');

  if (statusMsg) statusMsg.style.display = 'none';

  if (cust) {
    if (usernameInput) usernameInput.value = cust.username || '';
    if (phoneInput) phoneInput.value = cust.phone || '';
    if (passInput) passInput.value = cust.password || '';
    if (logoutBtn) logoutBtn.style.display = 'block';
  } else {
    if (usernameInput) usernameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (passInput) passInput.value = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  modal.classList.add('active');
}

function closeCustomerModal() {
  const modal = document.getElementById('customer-account-modal');
  if (modal) modal.classList.remove('active');
}

function saveCustomerAccount(e) {
  if (e) e.preventDefault();
  const username = document.getElementById('cust-username')?.value.trim();
  const phone = document.getElementById('cust-phone')?.value.trim();
  const password = document.getElementById('cust-password')?.value.trim();
  const statusMsg = document.getElementById('cust-status-msg');

  if (!username || !phone || !password) {
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.style.background = 'rgba(239, 68, 68, 0.15)';
      statusMsg.style.color = '#f87171';
      statusMsg.innerText = '⚠️ يرجى ملء جميع الحقول (اسم المستخدم، الهاتف، كلمة السر)';
    }
    return;
  }

  const customerData = { username, phone, password, savedAt: new Date().toISOString() };
  localStorage.setItem('ghma_customer_account', JSON.stringify(customerData));
  
  updateCustomerHeaderBtn(customerData);

  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.background = 'rgba(34, 197, 94, 0.15)';
    statusMsg.style.color = '#4ade80';
    statusMsg.innerText = '✅ تم حفظ معلومات حسابك بنجاح!';
  }

  setTimeout(() => {
    closeCustomerModal();
  }, 900);
}

function logoutCustomerAccount() {
  localStorage.removeItem('ghma_customer_account');
  updateCustomerHeaderBtn(null);
  const usernameInput = document.getElementById('cust-username');
  const phoneInput = document.getElementById('cust-phone');
  const passInput = document.getElementById('cust-password');
  if (usernameInput) usernameInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (passInput) passInput.value = '';
  
  const statusMsg = document.getElementById('cust-status-msg');
  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.background = 'rgba(239, 68, 68, 0.15)';
    statusMsg.style.color = '#f87171';
    statusMsg.innerText = 'تم مسح البيانات بنجاح.';
  }
  setTimeout(() => {
    closeCustomerModal();
  }, 800);
}

// -------------------------------------------------------------
// NOUVEAU ARRIVAGE FEATURE POPUP ENGINE
// -------------------------------------------------------------

let currentNouveauProductId = null;

function getNouveauArrivageSettings() {
  try {
    const data = localStorage.getItem('ghma_nouveau_arrivage');
    if (data) return JSON.parse(data);
  } catch (e) {}
  
  const defaultProd = (globalProducts && globalProducts.length > 0) ? globalProducts[0] : null;
  return {
    active: true,
    productId: defaultProd ? defaultProd.id : null,
    title: '🔥 NOUVEAU ARRIVAGE - وصل حديثاً للمتجر!'
  };
}

async function fetchNouveauArrivageSettings() {
  if (window.FirebaseDB && typeof window.FirebaseDB.getNouveauSettings === 'function') {
    try {
      const data = await window.FirebaseDB.getNouveauSettings();
      if (data && data.productId) {
        localStorage.setItem('ghma_nouveau_arrivage', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Error fetching nouveau settings from Firebase:', e);
    }
  }
  return getNouveauArrivageSettings();
}

async function checkAndShowNouveauArrivageOnVisit() {
  setTimeout(async () => {
    const settings = await fetchNouveauArrivageSettings();
    if (settings && settings.active !== false && settings.productId) {
      openNouveauArrivageModal();
    }
  }, 1000);
}

function openNouveauArrivageModal(isForcePreview = false) {
  const settings = getNouveauArrivageSettings();
  const modal = document.getElementById('nouveau-arrivage-modal');
  const body = document.getElementById('nouveau-modal-body');
  const titleDisplay = document.getElementById('nouveau-modal-title-display');

  if (!modal || !body) return;

  const targetProdId = isForcePreview ? (document.getElementById('nouveau-product-select')?.value || settings.productId) : settings.productId;
  const prod = globalProducts.find(p => p.id === targetProdId) || globalProducts[0];

  if (!prod) return;

  currentNouveauProductId = prod.id;

  const titleText = isForcePreview ? (document.getElementById('nouveau-custom-title')?.value || settings.title) : (settings.title || '🔥 NOUVEAU ARRIVAGE - وصل حديثاً!');

  if (titleDisplay) {
    titleDisplay.innerHTML = `<i class="fa-solid fa-fire" style="color: #10b981;"></i> <span>${titleText}</span>`;
  }

  const mainImg = prod.images && prod.images.length > 0 ? prod.images[0] : 'assets/logo.jpg';

  let specsHtml = '';
  if (prod.specs && typeof prod.specs === 'object') {
    specsHtml = Object.entries(prod.specs).slice(0, 4).map(([k, v]) => `
      <span class="spec-chip">${k}: ${v}</span>
    `).join('');
  }

  body.innerHTML = `
    <div style="text-align: center; margin-bottom: 14px;">
      <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; font-size: 0.8rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px;">
        ✨ EXCLUSIVE NEW ARRIVAL
      </span>
    </div>

    <div style="background: #000; border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; justify-content: center; height: 210px; margin-bottom: 16px; border: 1px solid var(--border-color); position: relative;">
      <img src="${mainImg}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
      ${prod.discount ? `<span class="badge-tag badge-discount" style="position: absolute; top: 12px; left: 12px; font-size: 0.85rem; padding: 4px 10px;">-${prod.discount}% OFF</span>` : ''}
    </div>

    <div style="text-align: center;">
      <span class="product-category-brand" style="font-size: 0.85rem;">${prod.brand || ''} • ${prod.category || ''}</span>
      <h3 style="font-size: 1.25rem; font-weight: 900; color: var(--text-main); margin: 6px 0 10px 0;">${prod.name}</h3>

      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px;">
        <span style="font-size: 1.6rem; font-weight: 900; color: #10b981;">${prod.price.toLocaleString()} DH</span>
        ${prod.oldPrice ? `<span style="font-size: 1rem; color: var(--text-dim); text-decoration: line-through;">${prod.oldPrice.toLocaleString()} DH</span>` : ''}
      </div>

      ${specsHtml ? `<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-bottom: 12px;">${specsHtml}</div>` : ''}

      <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; max-height: 60px; overflow: hidden;">${prod.description || ''}</p>
    </div>
  `;

  modal.classList.add('active');
}

function closeNouveauArrivageModal() {
  document.getElementById('nouveau-arrivage-modal')?.classList.remove('active');
}

function buyNouveauArrivageProduct() {
  if (currentNouveauProductId) {
    addToCart(currentNouveauProductId);
    closeNouveauArrivageModal();
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === 'ghma_nouveau_arrivage') {
    const settings = getNouveauArrivageSettings();
    if (settings && settings.active !== false && settings.productId) {
      openNouveauArrivageModal();
    } else {
      closeNouveauArrivageModal();
    }
  }
});

window.addEventListener('ghma_nouveau_updated', (e) => {
  const settings = e.detail || getNouveauArrivageSettings();
  if (settings && settings.active !== false && settings.productId) {
    openNouveauArrivageModal();
  } else {
    closeNouveauArrivageModal();
  }
});

// Fetch Products from Firebase Realtime Database & Subscribe to Realtime Updates
async function fetchProducts() {
  if (window.FirebaseDB) {
    // Set up live subscriber so any changes in Firebase RTDB update UI instantly
    window.FirebaseDB.subscribeProducts((loadedProducts) => {
      if (Array.isArray(loadedProducts) && loadedProducts.length > 0) {
        globalProducts = loadedProducts;
        try {
          localStorage.setItem('ghma_products', JSON.stringify(globalProducts));
        } catch (e) {}
      }
      applyFilters();
      if (typeof renderAdminDashboard === 'function') {
        renderAdminDashboard();
      }
      if (typeof populateNouveauArrivageAdminControls === 'function') {
        populateNouveauArrivageAdminControls();
      }
    });

    if (typeof window.FirebaseDB.subscribeNouveau === 'function') {
      window.FirebaseDB.subscribeNouveau((settings) => {
        if (settings && settings.productId) {
          localStorage.setItem('ghma_nouveau_arrivage', JSON.stringify(settings));
        }
      });
    }

    // Direct initial fetch
    let loadedProducts = await window.FirebaseDB.getProducts();
    if (Array.isArray(loadedProducts) && loadedProducts.length > 0) {
      globalProducts = loadedProducts;
    }
  } else {
    const savedLocal = localStorage.getItem('ghma_products');
    if (savedLocal) {
      try {
        const parsedLocal = JSON.parse(savedLocal);
        if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
          globalProducts = parsedLocal;
        }
      } catch (e) {}
    }
  }

  applyFilters();
  if (typeof renderAdminDashboard === 'function') {
    renderAdminDashboard();
  }
  if (typeof populateNouveauArrivageAdminControls === 'function') {
    populateNouveauArrivageAdminControls();
  }
}

// Render Products Grid in Main Store
function renderProducts(productsToRender) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (!productsToRender || productsToRender.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md);">
        <i class="fa-solid fa-ghost" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 16px;"></i>
        <h3 style="font-size: 1.3rem;">لم يتم العثور على أي منتج</h3>
        <p style="color: var(--text-muted); margin-top: 8px;">جرب تغيير كلمة البحث أو الفلاتر المختارة.</p>
      </div>
    `;
    return;
  }

  const isAdmin = getAdminAuthStatus();

  grid.innerHTML = productsToRender.map(p => {
    const mainImg = p.images && p.images.length > 0 ? p.images[0] : 'assets/logo.jpg';
    
    // Stock Badge formatting
    let stockBadgeHtml = '';
    const qty = p.stockQuantity !== undefined ? p.stockQuantity : 10;
    if (p.stockStatus === 'Out of Stock' || qty <= 0) {
      stockBadgeHtml = `<span class="stock-indicator stock-out"><span class="stock-dot"></span>🔴 Out of Stock</span>`;
    } else if (qty <= 5 || p.stockStatus === 'Low Stock') {
      stockBadgeHtml = `<span class="stock-indicator stock-low"><span class="stock-dot"></span>🟡 Low Stock (${qty})</span>`;
    } else {
      stockBadgeHtml = `<span class="stock-indicator stock-in"><span class="stock-dot"></span>🟢 In Stock</span>`;
    }

    // Spec pills summary
    let specsSummaryHtml = '';
    if (p.specs && typeof p.specs === 'object') {
      specsSummaryHtml = Object.entries(p.specs).slice(0, 3).map(([k, v]) => `
        <span class="spec-chip">${k}: ${v}</span>
      `).join('');
    }

    return `
      <div class="product-card">
        <div class="product-img-wrapper">
          <img src="${mainImg}" alt="${p.name}" onerror="this.src='/assets/logo.jpg'">
          <div class="product-badges">
            ${p.discount ? `<span class="badge-tag badge-discount">-${p.discount}%</span>` : ''}
            <span class="badge-tag badge-platform">${p.platform || 'PC'}</span>
          </div>
        </div>

        <div class="product-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="product-category-brand">${p.brand || ''} • ${p.category || ''}</span>
            ${stockBadgeHtml}
          </div>

          <h3 class="product-title" title="${p.name}">${p.name}</h3>

          <div class="product-specs-summary">
            ${specsSummaryHtml}
          </div>

          <div class="product-footer">
            <div class="price-container">
              <span class="current-price">${p.price.toLocaleString()} DH</span>
              ${p.oldPrice ? `<span class="old-price">${p.oldPrice.toLocaleString()} DH</span>` : ''}
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline" style="padding: 8px 12px; font-size: 0.85rem;" onclick="quickViewProduct('${p.id}')" title="معاينة">
                <i class="fa-solid fa-eye"></i>
              </button>
              
              <button class="btn btn-primary" style="padding: 8px 14px; font-size: 0.85rem;" onclick="addToCart('${p.id}')" ${p.stockStatus === 'Out of Stock' ? 'disabled' : ''}>
                <i class="fa-solid fa-cart-plus"></i>
                <span>شراء</span>
              </button>
            </div>
          </div>

          <!-- Admin Quick Edit Buttons (Edit, Copy, Delete) - Visible ONLY to Admin -->
          ${isAdmin ? `
            <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
              <button class="btn btn-outline" style="flex: 1; padding: 6px; font-size: 0.8rem;" onclick="openProductModal('${p.id}')">
                ✏️ Edit
              </button>
              <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.8rem;" onclick="duplicateProduct('${p.id}')">
                📦 Copy
              </button>
              <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.8rem;" onclick="promptDeleteProduct('${p.id}')">
                🗑️ Delete
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Filter and Sort Handler
function applyFilters() {
  const searchTerm = (document.getElementById('store-search')?.value || '').toLowerCase().trim();
  const platform = document.getElementById('filter-platform')?.value || 'all';
  const brand = document.getElementById('filter-brand')?.value || 'all';
  const stock = document.getElementById('filter-stock')?.value || 'all';
  const sortBy = document.getElementById('sort-select')?.value || 'latest';

  let filtered = globalProducts.filter(p => {
    // Category pill filter
    if (currentCategoryFilter !== 'all' && p.category !== currentCategoryFilter) return false;

    // Search query filter
    if (searchTerm) {
      const matchName = p.name.toLowerCase().includes(searchTerm);
      const matchBrand = (p.brand || '').toLowerCase().includes(searchTerm);
      const matchCategory = (p.category || '').toLowerCase().includes(searchTerm);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(searchTerm));
      if (!matchName && !matchBrand && !matchCategory && !matchTags) return false;
    }

    // Platform filter
    if (platform !== 'all' && p.platform !== platform) return false;

    // Brand filter
    if (brand !== 'all' && p.brand !== brand) return false;

    // Stock filter
    if (stock !== 'all') {
      if (stock === 'In Stock' && (p.stockStatus !== 'In Stock' || (p.stockQuantity !== undefined && p.stockQuantity <= 0))) return false;
      if (stock === 'Low Stock' && p.stockQuantity > 5) return false;
      if (stock === 'Out of Stock' && p.stockStatus !== 'Out of Stock' && (p.stockQuantity === undefined || p.stockQuantity > 0)) return false;
    }

    return true;
  });

  // Sort
  if (sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'best-selling') {
    filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  } else if (sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Latest
    filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  }

  renderProducts(filtered);
}

// Category Pill selection
function setCategoryFilter(cat, btnElement) {
  currentCategoryFilter = cat;
  document.querySelectorAll('#category-pills .pill').forEach(el => el.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  applyFilters();
}

// Cart Functions
function addToCart(prodId) {
  const p = globalProducts.find(item => item.id === prodId);
  if (!p) return;

  const existing = cart.find(item => item.id === prodId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...p, qty: 1 });
  }

  saveCart();
  updateCartBadge();
  toggleCartDrawer(true);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) {
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    badge.innerText = totalQty;
  }
}

function saveCart() {
  localStorage.setItem('ghma_cart', JSON.stringify(cart));
}

function toggleCartDrawer(forceOpen = false) {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  if (forceOpen || !drawer.classList.contains('active')) {
    drawer.classList.add('active');
    renderCart();
  } else {
    drawer.classList.remove('active');
  }
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const totalPriceEl = document.getElementById('cart-total-price');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 10px;">
        <i class="fa-solid fa-cart-arrow-down" style="font-size: 2.5rem; color: var(--text-dim); margin-bottom: 12px;"></i>
        <p style="color: var(--text-muted);">السلة فارغة حالياً</p>
      </div>
    `;
    if (totalPriceEl) totalPriceEl.innerText = '0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, idx) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    const img = item.images && item.images.length > 0 ? item.images[0] : '/assets/logo.jpg';

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
        <img src="${img}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px; background: #000;">
        <div style="flex: 1; margin: 0 12px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">${item.name}</h4>
          <span style="font-size: 0.85rem; color: var(--primary); font-weight: 800;">${item.price.toLocaleString()} DH</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn btn-outline" style="padding: 2px 8px;" onclick="changeCartQty(${idx}, -1)">-</button>
          <span style="font-weight: 700; font-size: 0.9rem;">${item.qty}</span>
          <button class="btn btn-outline" style="padding: 2px 8px;" onclick="changeCartQty(${idx}, 1)">+</button>
          <button class="btn btn-danger" style="padding: 4px 8px; margin-left: 6px;" onclick="removeFromCart(${idx})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (totalPriceEl) totalPriceEl.innerText = total.toLocaleString();
}

function changeCartQty(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
    updateCartBadge();
    renderCart();
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  renderCart();
}

function openWaChoiceModal(msgText) {
  pendingWaText = msgText;
  document.getElementById('whatsapp-choice-modal')?.classList.add('active');
}

function closeWaChoiceModal() {
  document.getElementById('whatsapp-choice-modal')?.classList.remove('active');
}

function confirmWaOrder(phoneNum) {
  if (!pendingWaText) return;
  const encoded = encodeURIComponent(pendingWaText);
  window.open(`https://wa.me/${phoneNum}?text=${encoded}`, '_blank');
  closeWaChoiceModal();
}

function sendCartToWhatsApp() {
  if (cart.length === 0) return;
  let total = 0;
  let text = `🎮 *طلب جديد من متجر Gaming Hub MA*\n\n`;

  const cust = getSavedCustomerAccount();
  if (cust && (cust.username || cust.phone)) {
    text += `👤 *معلومات الزبون (Customer):*\n- *اسم المستخدم:* ${cust.username || 'غـير مـحدد'}\n- *رقم الهاتف:* ${cust.phone || 'غـير مـحدد'}\n\n`;
  }

  cart.forEach((item, i) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    text += `${i + 1}. *${item.name}* (x${item.qty}) - ${itemTotal.toLocaleString()} DH\n`;
  });
  text += `\n💰 *المجموع الكلي:* ${total.toLocaleString()} DH\n\nيرجى تأكيد الطلب وتزويدي بمعلومات الشحن!`;

  openWaChoiceModal(text);
}

// Quick View Modal
function quickViewProduct(prodId) {
  const p = globalProducts.find(item => item.id === prodId);
  if (!p) return;

  const modalBody = document.getElementById('preview-modal-body');
  const mainImg = p.images && p.images.length > 0 ? p.images[0] : 'assets/logo.jpg';

  let specsRows = '';
  if (p.specs && typeof p.specs === 'object') {
    specsRows = Object.entries(p.specs).map(([k, v]) => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-color); font-size: 0.88rem;">
        <span style="color: var(--text-muted); font-weight: 700;">${k}:</span>
        <span style="color: var(--text-main);">${v}</span>
      </div>
    `).join('');
  }

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div style="background: #000; border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; justify-content: center;">
        <img src="${mainImg}" style="max-width: 100%; max-height: 260px; object-fit: contain;">
      </div>
      <div>
        <span class="product-category-brand">${p.brand} • ${p.category}</span>
        <h3 style="font-size: 1.3rem; font-weight: 800; margin: 8px 0;">${p.name}</h3>
        
        <div style="margin: 12px 0;">
          <span style="font-size: 1.6rem; font-weight: 900; color: var(--primary);">${p.price.toLocaleString()} DH</span>
          ${p.oldPrice ? `<span style="font-size: 1rem; color: var(--text-dim); text-decoration: line-through; margin-right: 10px;">${p.oldPrice.toLocaleString()} DH</span>` : ''}
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 16px;">${p.description || ''}</p>

        <button class="btn btn-primary" style="width: 100%;" onclick="addToCart('${p.id}'); closePreviewModal();">
          <i class="fa-solid fa-cart-plus"></i>
          <span>إضافة إلى السلة</span>
        </button>
      </div>
    </div>

    ${specsRows ? `
      <div style="margin-top: 24px; background: var(--bg-input); padding: 16px; border-radius: var(--radius-md);">
        <h4 style="font-weight: 800; font-size: 0.95rem; margin-bottom: 10px; color: var(--primary);">المواصفات التقنية (Specs):</h4>
        ${specsRows}
      </div>
    ` : ''}
  `;

  document.getElementById('product-preview-modal')?.classList.add('active');
}

function closePreviewModal() {
  document.getElementById('product-preview-modal')?.classList.remove('active');
}

// -------------------------------------------------------------
// INTERACTIVE CUSTOM PC BUILDER ENGINE (مُجمّع البيسي الذكي)
// -------------------------------------------------------------

function openPcBuilderModal() {
  document.getElementById('pc-builder-modal')?.classList.add('active');
  renderBuilderStep();
}

function closePcBuilderModal() {
  document.getElementById('pc-builder-modal')?.classList.remove('active');
}

function goBuilderStep(stepNum) {
  pcBuilderState.currentStep = stepNum;
  renderBuilderStep();
}

function prevBuilderStep() {
  if (pcBuilderState.currentStep > 1) {
    pcBuilderState.currentStep -= 1;
    renderBuilderStep();
  }
}

function nextBuilderStep() {
  if (pcBuilderState.currentStep < 9) {
    pcBuilderState.currentStep += 1;
    renderBuilderStep();
  }
}

function renderBuilderStep() {
  const step = pcBuilderState.currentStep;
  
  // Update step navigation UI
  document.querySelectorAll('#builder-steps-bar .step-item').forEach((el, idx) => {
    el.classList.remove('active', 'completed');
    if (idx + 1 === step) {
      el.classList.add('active');
    } else if (idx + 1 < step) {
      el.classList.add('completed');
    }
  });

  // Buttons visibility
  const prevBtn = document.getElementById('btn-builder-prev');
  const nextBtn = document.getElementById('btn-builder-next');
  const waBtn = document.getElementById('btn-builder-whatsapp');

  if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-flex' : 'none';
  if (nextBtn) nextBtn.style.display = step < 9 ? 'inline-flex' : 'none';
  if (waBtn) waBtn.style.display = step === 9 ? 'inline-flex' : 'none';

  // Evaluate Live Compatibility & Wattage
  calculateBuilderStats();

  // Render Step Content
  const container = document.getElementById('builder-step-content');
  if (!container) return;

  if (step === 1) {
    // Select CPU
    renderBuilderItemPicker(container, 'CPUs', 'اختر المعالج (Choose CPU)', pcBuilderState.selectedCpu, (item) => {
      pcBuilderState.selectedCpu = item;
      renderBuilderStep();
    });
  } else if (step === 2) {
    // Select GPU
    renderBuilderItemPicker(container, 'GPUs', 'اختر كارت الشاشة (Choose GPU)', pcBuilderState.selectedGpu, (item) => {
      pcBuilderState.selectedGpu = item;
      renderBuilderStep();
    });
  } else if (step === 3) {
    // Select Motherboard
    renderBuilderItemPicker(container, 'Motherboards', 'اختر اللوحة الأم (Choose Motherboard)', pcBuilderState.selectedMb, (item) => {
      pcBuilderState.selectedMb = item;
      renderBuilderStep();
    });
  } else if (step === 4) {
    // Select RAM
    renderBuilderItemPicker(container, 'RAM', 'اختر الرامات (Choose RAM)', pcBuilderState.selectedRam, (item) => {
      pcBuilderState.selectedRam = item;
      renderBuilderStep();
    });
  } else if (step === 5) {
    // Select Storage
    renderBuilderItemPicker(container, 'Storage', 'اختر وحدة التخزين (Choose Storage SSD)', pcBuilderState.selectedStorage, (item) => {
      pcBuilderState.selectedStorage = item;
      renderBuilderStep();
    });
  } else if (step === 6) {
    // Select PSU
    renderBuilderItemPicker(container, 'Power Supplies', 'اختر الباور سبلاي (Choose Power Supply PSU)', pcBuilderState.selectedPsu, (item) => {
      pcBuilderState.selectedPsu = item;
      renderBuilderStep();
    });
  } else if (step === 7) {
    // Select Case
    renderBuilderItemPicker(container, 'Cases', 'اختر الكيس (Choose PC Case)', pcBuilderState.selectedCase, (item) => {
      pcBuilderState.selectedCase = item;
      renderBuilderStep();
    });
  } else if (step === 8) {
    // Select Peripherals (Mouse, Keyboard, Headset)
    renderPeripheralsStep(container);
  } else if (step === 9) {
    // Summary
    renderBuilderSummary(container);
  }
}

// Render Pickable Cards for PC Component Selection
function renderBuilderItemPicker(container, category, title, currentlySelected, selectCallback) {
  const items = globalProducts.filter(p => p.category === category);

  if (items.length === 0) {
    container.innerHTML = `<p style="padding: 20px; color: var(--text-muted);">لا توجد عناصر متوفرة في تصنيف ${category}</p>`;
    return;
  }

  container.innerHTML = `
    <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 16px; color: var(--primary);">${title}</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
      ${items.map(item => {
        const isSelected = currentlySelected && currentlySelected.id === item.id;
        const img = item.images && item.images.length > 0 ? item.images[0] : '/assets/logo.jpg';
        return `
          <div class="product-card" style="border: ${isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; box-shadow: ${isSelected ? '0 0 16px var(--primary-glow)' : 'none'}; cursor: pointer;" onclick="selectBuilderItem('${category}', '${item.id}')">
            <div style="position: relative; height: 130px; background: #000; padding: 10px; display: flex; align-items: center; justify-content: center;">
              <img src="${img}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
              ${isSelected ? `<span style="position: absolute; top: 8px; right: 8px; background: var(--primary); color: #000; font-size: 0.75rem; font-weight: 900; padding: 2px 8px; border-radius: 12px;">محدد ✓</span>` : ''}
            </div>
            <div style="padding: 12px;">
              <h5 style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); height: 2.6em; overflow: hidden;">${item.name}</h5>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="font-weight: 800; color: var(--primary); font-size: 0.95rem;">${item.price.toLocaleString()} DH</span>
                <span class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;">${isSelected ? 'محدد' : 'اختيار'}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function selectBuilderItem(category, itemId) {
  const item = globalProducts.find(p => p.id === itemId);
  if (!item) return;

  if (category === 'CPUs') pcBuilderState.selectedCpu = item;
  else if (category === 'GPUs') pcBuilderState.selectedGpu = item;
  else if (category === 'Motherboards') pcBuilderState.selectedMb = item;
  else if (category === 'RAM') pcBuilderState.selectedRam = item;
  else if (category === 'Storage') pcBuilderState.selectedStorage = item;
  else if (category === 'Power Supplies') pcBuilderState.selectedPsu = item;
  else if (category === 'Cases') pcBuilderState.selectedCase = item;

  renderBuilderStep();
}

function renderPeripheralsStep(container) {
  const mice = globalProducts.filter(p => p.category === 'Mice');
  const headsets = globalProducts.filter(p => p.category === 'Headsets');
  const mics = globalProducts.filter(p => p.category === 'Microphones');

  container.innerHTML = `
    <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 16px; color: var(--primary);">اختر الإكسسوارات الملحقة (Mouse, Keyboard, Headset)</h4>
    
    <div style="margin-bottom: 24px;">
      <h5 style="font-weight: 700; color: var(--text-muted); margin-bottom: 10px;">🖱️ الفأرة (Mouse / Souris):</h5>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${mice.map(m => {
          const isSelected = pcBuilderState.selectedMouse && pcBuilderState.selectedMouse.id === m.id;
          return `
            <div style="background: var(--bg-input); border: ${isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; padding: 10px; border-radius: var(--radius-sm); cursor: pointer;" onclick="pcBuilderState.selectedMouse = (pcBuilderState.selectedMouse?.id === '${m.id}' ? null : globalProducts.find(p=>p.id==='${m.id}')); renderBuilderStep();">
              <div style="font-size: 0.85rem; font-weight: 700;">${m.name}</div>
              <div style="color: var(--primary); font-weight: 800; font-size: 0.85rem; margin-top: 4px;">${m.price.toLocaleString()} DH</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div>
      <h5 style="font-weight: 700; color: var(--text-muted); margin-bottom: 10px;">🎧 السماعات (Headset / Casque):</h5>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${headsets.map(h => {
          const isSelected = pcBuilderState.selectedHeadset && pcBuilderState.selectedHeadset.id === h.id;
          return `
            <div style="background: var(--bg-input); border: ${isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; padding: 10px; border-radius: var(--radius-sm); cursor: pointer;" onclick="pcBuilderState.selectedHeadset = (pcBuilderState.selectedHeadset?.id === '${h.id}' ? null : globalProducts.find(p=>p.id==='${h.id}')); renderBuilderStep();">
              <div style="font-size: 0.85rem; font-weight: 700;">${h.name}</div>
              <div style="color: var(--primary); font-weight: 800; font-size: 0.85rem; margin-top: 4px;">${h.price.toLocaleString()} DH</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBuilderSummary(container) {
  const parts = [
    { label: 'CPU (المعالج)', item: pcBuilderState.selectedCpu },
    { label: 'GPU (كارت الشاشة)', item: pcBuilderState.selectedGpu },
    { label: 'Motherboard (اللوحة الأم)', item: pcBuilderState.selectedMb },
    { label: 'RAM (الرامات)', item: pcBuilderState.selectedRam },
    { label: 'Storage (التخزين SSD)', item: pcBuilderState.selectedStorage },
    { label: 'Power Supply (الباور سبلاي)', item: pcBuilderState.selectedPsu },
    { label: 'Case (الكيس)', item: pcBuilderState.selectedCase },
    { label: 'Mouse (الفأرة)', item: pcBuilderState.selectedMouse },
    { label: 'Headset (السماعات)', item: pcBuilderState.selectedHeadset }
  ].filter(p => p.item !== null);

  let total = 0;
  parts.forEach(p => total += p.item.price);

  container.innerHTML = `
    <h4 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 16px; color: var(--primary);">🎉 النتيجة النهائية لتجميعة البيسي الخارقة (Final Custom PC Summary)</h4>
    
    <div class="receipt-box">
      ${parts.map(p => `
        <div class="receipt-item">
          <div>
            <span style="font-size: 0.8rem; color: var(--primary); font-weight: 700;">${p.label}</span>
            <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">${p.item.name}</h5>
          </div>
          <span style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${p.item.price.toLocaleString()} DH</span>
        </div>
      `).join('')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 2px solid var(--primary);">
        <span style="font-size: 1.2rem; font-weight: 800;">المجموع الكلي (Total):</span>
        <span style="font-size: 1.6rem; font-weight: 900; color: var(--primary);">${total.toLocaleString()} DH</span>
      </div>
    </div>
  `;
}

function calculateBuilderStats() {
  let totalPrice = 0;
  let estimatedTdp = 100; // Base system fans & motherboard overhead

  const cpu = pcBuilderState.selectedCpu;
  const gpu = pcBuilderState.selectedGpu;
  const mb = pcBuilderState.selectedMb;
  const psu = pcBuilderState.selectedPsu;

  if (cpu) {
    totalPrice += cpu.price;
    const cpuTdp = parseInt(cpu.specs?.TDP || '100');
    estimatedTdp += cpuTdp;
  }
  if (gpu) {
    totalPrice += gpu.price;
    const gpuTdp = parseInt(gpu.specs?.TDP || '220');
    estimatedTdp += gpuTdp;
  }
  if (mb) totalPrice += mb.price;
  if (pcBuilderState.selectedRam) totalPrice += pcBuilderState.selectedRam.price;
  if (pcBuilderState.selectedStorage) totalPrice += pcBuilderState.selectedStorage.price;
  if (psu) totalPrice += psu.price;
  if (pcBuilderState.selectedCase) totalPrice += pcBuilderState.selectedCase.price;
  if (pcBuilderState.selectedMouse) totalPrice += pcBuilderState.selectedMouse.price;
  if (pcBuilderState.selectedHeadset) totalPrice += pcBuilderState.selectedHeadset.price;

  // Update total price element
  const totalEl = document.getElementById('builder-total-price');
  if (totalEl) totalEl.innerText = totalPrice.toLocaleString();

  // Update wattage meter
  const wattText = document.getElementById('builder-wattage-text');
  const wattFill = document.getElementById('builder-wattage-fill');
  if (wattText) wattText.innerText = `${estimatedTdp} Watt`;
  
  const psuCapacity = psu ? parseInt(psu.specs?.Wattage || '750') : 750;
  const fillPercent = Math.min(100, Math.round((estimatedTdp / psuCapacity) * 100));
  if (wattFill) wattFill.style.width = `${fillPercent}%`;

  // Socket & Wattage Compatibility check
  const compatBadge = document.getElementById('builder-compat-text');
  const compatContainer = document.getElementById('builder-compat-badge');
  let isCompatible = true;
  let reason = 'التوافقية 100% متناغمة (Compatibility Check Pass 🟢)';

  // Check CPU & Motherboard socket match
  if (cpu && mb) {
    const cpuSocket = (cpu.specs?.Socket || '').toUpperCase();
    const mbSocket = (mb.specs?.Socket || '').toUpperCase();
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      isCompatible = false;
      reason = `⚠️ غير متوافق: المعالج (${cpuSocket}) لا يركب على اللوحة الأم (${mbSocket})`;
    }
  }

  // Check PSU Wattage safety
  if (psu && estimatedTdp > psuCapacity - 50) {
    isCompatible = false;
    reason = `⚠️ الباور سبلاي اخترته weak (${psuCapacity}W) لا يكفي لاستهلاك الطاقة المقدر (${estimatedTdp}W)`;
  }

  if (compatBadge && compatContainer) {
    if (isCompatible) {
      compatBadge.className = 'compat-good';
      compatBadge.innerText = reason;
      compatContainer.querySelector('i').className = 'fa-solid fa-circle-check compat-good';
    } else {
      compatBadge.className = 'compat-warn';
      compatBadge.innerText = reason;
      compatContainer.querySelector('i').className = 'fa-solid fa-triangle-exclamation compat-warn';
    }
  }
}

function sendPcBuildToWhatsApp() {
  const parts = [
    { label: 'CPU', item: pcBuilderState.selectedCpu },
    { label: 'GPU', item: pcBuilderState.selectedGpu },
    { label: 'Motherboard', item: pcBuilderState.selectedMb },
    { label: 'RAM', item: pcBuilderState.selectedRam },
    { label: 'Storage', item: pcBuilderState.selectedStorage },
    { label: 'PSU', item: pcBuilderState.selectedPsu },
    { label: 'Case', item: pcBuilderState.selectedCase },
    { label: 'Mouse', item: pcBuilderState.selectedMouse },
    { label: 'Headset', item: pcBuilderState.selectedHeadset }
  ].filter(p => p.item !== null);

  if (parts.length === 0) return;

  let total = 0;
  let text = `⚡ *تجميعة بيسي مخصصة من Gaming Hub MA*\n\n`;

  const cust = getSavedCustomerAccount();
  if (cust && (cust.username || cust.phone)) {
    text += `👤 *معلومات الزبون (Customer):*\n- *اسم المستخدم:* ${cust.username || 'غـير مـحدد'}\n- *رقم الهاتف:* ${cust.phone || 'غـير مـحدد'}\n\n`;
  }

  parts.forEach((p, i) => {
    total += p.item.price;
    text += `${i + 1}. *${p.label}:* ${p.item.name} (${p.item.price.toLocaleString()} DH)\n`;
  });
  text += `\n💰 *المجموع الكلي:* ${total.toLocaleString()} DH\n\nيرجى تأكيد طلب التجميعة والقطع!`;

  openWaChoiceModal(text);
}
