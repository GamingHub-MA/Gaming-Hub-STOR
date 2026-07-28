/* Gaming Hub MA - Store Management Dashboard Logic (Admin) */

let currentEditingImages = [];
let productToDeleteId = null;

// In-memory admin authentication state (NOT saved in localStorage so admin must login every time)
let isSystemAdminLoggedIn = false;

function isAuthAdmin() {
  return isSystemAdminLoggedIn;
}

// Check Admin Authentication Session
function checkAdminSession() {
  const isAuth = isSystemAdminLoggedIn;
  const adminSection = document.getElementById('admin-section');
  const adminBtnLabel = document.getElementById('admin-btn-label');
  const adminNav = document.getElementById('nav-admin');

  if (isAuth) {
    if (adminSection) adminSection.style.display = 'block';
    if (adminNav) adminNav.style.display = 'inline-block';
    if (adminBtnLabel) adminBtnLabel.innerText = 'لوحة التحكم (Admin)';
  } else {
    if (adminSection) adminSection.style.display = 'none';
    if (adminNav) adminNav.style.display = 'none';
    if (adminBtnLabel) adminBtnLabel.innerText = 'دخول الإدارة';
  }
}

// Open Admin Login Modal
function openAdminLoginModal() {
  if (isSystemAdminLoggedIn) {
    // Scroll directly to dashboard
    document.getElementById('admin-section')?.scrollIntoView({ behavior: 'smooth' });
  } else {
    document.getElementById('admin-login-modal')?.classList.add('active');
  }
}

function closeAdminLoginModal() {
  document.getElementById('admin-login-modal')?.classList.remove('active');
}

// Submit Admin Login Form via Firebase Authentication
async function submitAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const errorEl = document.getElementById('login-error-msg');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    if (errorEl) {
      errorEl.innerText = 'يرجى إدخال البريد الإلكتروني وكلمة السر.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (submitBtn) submitBtn.disabled = true;

  try {
    if (window.FirebaseAuth && typeof window.FirebaseAuth.login === 'function') {
      await window.FirebaseAuth.login(email, password);
      if (errorEl) errorEl.style.display = 'none';
      closeAdminLoginModal();
      const pwdInput = document.getElementById('login-password');
      if (pwdInput) pwdInput.value = '';
    } else {
      throw new Error('خدمة المصادقة غير متوفرة');
    }
  } catch (err) {
    console.error("Admin login error:", err);
    if (errorEl) {
      let msg = 'خطأ في البريد الإلكتروني أو كلمة السر!';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'البريد الإلكتروني أو كلمة السر غير صحيحة!';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'تم حظر المحاولات مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة لاحقاً.';
      }
      errorEl.innerText = msg;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function logoutAdmin() {
  try {
    if (window.FirebaseAuth && typeof window.FirebaseAuth.logout === 'function') {
      await window.FirebaseAuth.logout();
    } else {
      isSystemAdminLoggedIn = false;
      checkAdminSession();
    }
  } catch (err) {
    console.error("Logout error:", err);
    isSystemAdminLoggedIn = false;
    checkAdminSession();
  }
  if (typeof applyFilters === 'function') applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Automatically synchronize authentication state with Firebase Auth
(function setupAuthSync() {
  const checkAndListen = () => {
    if (window.FirebaseAuth && typeof window.FirebaseAuth.onAuthStateChanged === 'function') {
      window.FirebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          isSystemAdminLoggedIn = true;
          checkAdminSession();
          renderAdminDashboard();
          if (typeof applyFilters === 'function') applyFilters();
        } else {
          isSystemAdminLoggedIn = false;
          checkAdminSession();
          if (typeof applyFilters === 'function') applyFilters();
        }
      });
    } else {
      setTimeout(checkAndListen, 150);
    }
  };
  checkAndListen();
})();

// -------------------------------------------------------------
// DASHBOARD PRODUCT LISTING & FILTERING
// -------------------------------------------------------------

function populateNouveauArrivageAdminControls() {
  const selectEl = document.getElementById('nouveau-product-select');
  const titleInput = document.getElementById('nouveau-custom-title');
  const activeToggle = document.getElementById('nouveau-active-toggle');

  if (!selectEl || !globalProducts || globalProducts.length === 0) return;

  const currentSettings = (typeof getNouveauArrivageSettings === 'function') ? getNouveauArrivageSettings() : {
    active: true,
    productId: globalProducts[0].id,
    title: '🔥 Nouveau Arrivage - وصل حديثاً للمتجر!'
  };

  const optionsHtml = globalProducts.map(p => `
    <option value="${p.id}" ${p.id === currentSettings.productId ? 'selected' : ''}>
      ${p.name} (${p.price.toLocaleString()} DH) - ${p.category}
    </option>
  `).join('');

  selectEl.innerHTML = optionsHtml;

  if (titleInput && document.activeElement !== titleInput) {
    titleInput.value = currentSettings.title || '🔥 Nouveau Arrivage - وصل حديثاً للمتجر!';
  }

  if (activeToggle) {
    activeToggle.checked = currentSettings.active !== false;
  }
}

async function saveNouveauArrivageSettings() {
  const productId = document.getElementById('nouveau-product-select')?.value;
  const title = document.getElementById('nouveau-custom-title')?.value.trim() || '🔥 Nouveau Arrivage - وصل حديثاً للمتجر!';
  const active = document.getElementById('nouveau-active-toggle')?.checked !== false;
  const statusMsg = document.getElementById('nouveau-admin-status-msg');

  if (!productId) return;

  const settings = {
    active,
    productId,
    title,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('ghma_nouveau_arrivage', JSON.stringify(settings));

  // Persist to Firebase Realtime Database
  if (window.FirebaseDB && typeof window.FirebaseDB.saveNouveauSettings === 'function') {
    try {
      await window.FirebaseDB.saveNouveauSettings(settings);
    } catch (err) {
      console.warn('Saving nouveau settings to Firebase error:', err);
    }
  }

  // Instantly update and open/close modal live on screen
  if (typeof openNouveauArrivageModal === 'function') {
    if (active) {
      openNouveauArrivageModal(false);
    } else if (typeof closeNouveauArrivageModal === 'function') {
      closeNouveauArrivageModal();
    }
  }

  try {
    window.dispatchEvent(new CustomEvent('ghma_nouveau_updated', { detail: settings }));
  } catch (e) {}

  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.background = 'rgba(34, 197, 94, 0.15)';
    statusMsg.style.color = '#4ade80';
    statusMsg.innerText = '✅ تم حفظ وتحديث Nouveau Arrivage بنجاح وتطبيقه للجميع!';
    setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 3500);
  }
}

function renderAdminDashboard() {
  populateNouveauArrivageAdminControls();

  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('admin-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('admin-filter-category')?.value || 'all';
  const stockFilter = document.getElementById('admin-filter-stock')?.value || 'all';
  const sortBy = document.getElementById('admin-sort')?.value || 'date';

  let list = [...globalProducts];

  // Filtering
  list = list.filter(p => {
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (stockFilter !== 'all') {
      const qty = p.stockQuantity !== undefined ? p.stockQuantity : 10;
      if (stockFilter === 'In Stock' && (p.stockStatus === 'Out of Stock' || qty <= 0)) return false;
      if (stockFilter === 'Low Stock' && (qty > 5 || qty <= 0)) return false;
      if (stockFilter === 'Out of Stock' && p.stockStatus !== 'Out of Stock' && qty > 0) return false;
    }
    if (searchTerm) {
      const matchName = p.name.toLowerCase().includes(searchTerm);
      const matchBrand = (p.brand || '').toLowerCase().includes(searchTerm);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(searchTerm));
      if (!matchName && !matchBrand && !matchTags) return false;
    }
    return true;
  });

  // Sorting
  if (sortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'price') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'sales') {
    list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  } else {
    list.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
          لا توجد منتجات تطابق البحث أو الفلاتر المختارة.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const mainImg = p.images && p.images.length > 0 ? p.images[0] : '/assets/logo.jpg';
    
    // Stock Badge
    let stockBadge = '';
    const qty = p.stockQuantity !== undefined ? p.stockQuantity : 10;
    if (p.stockStatus === 'Out of Stock' || qty <= 0) {
      stockBadge = `<span class="stock-indicator stock-out"><span class="stock-dot"></span>🔴 Out of Stock</span>`;
    } else if (qty <= 5 || p.stockStatus === 'Low Stock') {
      stockBadge = `<span class="stock-indicator stock-low"><span class="stock-dot"></span>🟡 Low Stock (${qty})</span>`;
    } else {
      stockBadge = `<span class="stock-indicator stock-in"><span class="stock-dot"></span>🟢 In Stock (${qty})</span>`;
    }

    return `
      <tr>
        <td>
          <div class="tbl-product">
            <img src="${mainImg}" class="tbl-img" onerror="this.src='/assets/logo.jpg'">
            <div>
              <div style="font-weight: 800; color: var(--text-main); font-size: 0.95rem;">${p.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${p.platform || 'PC'}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-weight: 700; color: var(--primary); font-size: 0.85rem;">${p.category}</span>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${p.brand}</div>
        </td>
        <td>
          <div style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${p.price.toLocaleString()} DH</div>
          ${p.oldPrice ? `<div style="font-size: 0.78rem; color: var(--text-dim); text-decoration: line-through;">${p.oldPrice.toLocaleString()} DH</div>` : ''}
        </td>
        <td>${stockBadge}</td>
        <td>
          <div class="tbl-actions">
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.85rem;" onclick="openProductModal('${p.id}')" title="تعديل">
              ✏️ Edit
            </button>
            <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.85rem;" onclick="quickViewProduct('${p.id}')" title="معاينة">
              👁️ Preview
            </button>
            <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.85rem;" onclick="duplicateProduct('${p.id}')" title="نسخ">
              📦 Duplicate
            </button>
            <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.85rem;" onclick="promptDeleteProduct('${p.id}')" title="حذف">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// EDIT / ADD PRODUCT MODAL & DRAG-AND-DROP IMAGE UPLOADER
// -------------------------------------------------------------

function openProductModal(prodId = null) {
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('product-modal-title');
  if (!modal) return;

  if (prodId) {
    const p = globalProducts.find(item => item.id === prodId);
    if (!p) return;

    modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل المنتج (Edit: ${p.name})`;
    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-price').value = p.price;
    document.getElementById('edit-prod-oldprice').value = p.oldPrice || '';
    document.getElementById('edit-prod-category').value = p.category;
    document.getElementById('edit-prod-brand').value = p.brand;
    document.getElementById('edit-prod-platform').value = p.platform || 'PC';
    document.getElementById('edit-prod-stockstatus').value = p.stockStatus || 'In Stock';
    document.getElementById('edit-prod-stockqty').value = p.stockQuantity !== undefined ? p.stockQuantity : 10;
    document.getElementById('edit-prod-tags').value = (p.tags || []).join(', ');
    document.getElementById('edit-prod-description').value = p.description || '';
    document.getElementById('edit-prod-specs').value = p.specs ? JSON.stringify(p.specs, null, 2) : '';

    currentEditingImages = p.images ? [...p.images] : ['/assets/logo.jpg'];
  } else {
    modalTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> إضافة منتج جديد (Add New Product)`;
    document.getElementById('product-form').reset();
    document.getElementById('edit-prod-id').value = '';
    currentEditingImages = [];
  }

  renderImagePreviewList();
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal')?.classList.remove('active');
}

function renderImagePreviewList() {
  const container = document.getElementById('image-preview-list');
  if (!container) return;

  container.innerHTML = currentEditingImages.map((url, idx) => `
    <div class="image-preview-item ${idx === 0 ? 'main-image' : ''}">
      <img src="${url}" onerror="this.src='/assets/logo.jpg'">
      ${idx === 0 ? `<span class="main-tag">MAIN ⭐</span>` : ''}
      <div class="image-actions">
        ${idx !== 0 ? `<button type="button" class="img-btn" onclick="setMainImage(${idx})" title="تحديد كصورة رئيسية">⭐</button>` : ''}
        ${idx > 0 ? `<button type="button" class="img-btn" onclick="moveImageOrder(${idx}, -1)" title="تحريك لأعلى">⬆️</button>` : ''}
        ${idx < currentEditingImages.length - 1 ? `<button type="button" class="img-btn" onclick="moveImageOrder(${idx}, 1)" title="تحريك لأسفل">⬇️</button>` : ''}
        <button type="button" class="img-btn" onclick="deleteImageFromList(${idx})" title="حذف الصورة">🗑️</button>
      </div>
    </div>
  `).join('');
}

function setMainImage(index) {
  const [target] = currentEditingImages.splice(index, 1);
  currentEditingImages.unshift(target);
  renderImagePreviewList();
}

function moveImageOrder(index, direction) {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < currentEditingImages.length) {
    const temp = currentEditingImages[index];
    currentEditingImages[index] = currentEditingImages[newIndex];
    currentEditingImages[newIndex] = temp;
    renderImagePreviewList();
  }
}

function deleteImageFromList(index) {
  currentEditingImages.splice(index, 1);
  renderImagePreviewList();
}

function triggerFileInput() {
  document.getElementById('file-input')?.click();
}

function handleFilesSelected(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      currentEditingImages.push(base64Data);
      renderImagePreviewList();
    };
    reader.readAsDataURL(file);
  });
}

function addImageFromUrl() {
  const input = document.getElementById('image-url-input');
  if (!input || !input.value.trim()) return;

  currentEditingImages.push(input.value.trim());
  input.value = '';
  renderImagePreviewList();
}

// SAVE PRODUCT (SAVE CHANGES)
async function saveProduct(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('edit-prod-id').value || `prod-${Date.now()}`;
  const name = document.getElementById('edit-prod-name').value.trim();
  const price = parseFloat(document.getElementById('edit-prod-price').value) || 0;
  const oldPrice = parseFloat(document.getElementById('edit-prod-oldprice').value) || null;
  const category = document.getElementById('edit-prod-category').value;
  const brand = document.getElementById('edit-prod-brand').value.trim();
  const platform = document.getElementById('edit-prod-platform').value;
  const stockStatus = document.getElementById('edit-prod-stockstatus').value;
  const stockQuantity = parseInt(document.getElementById('edit-prod-stockqty').value) || 0;
  const description = document.getElementById('edit-prod-description').value.trim();
  const tagsStr = document.getElementById('edit-prod-tags').value;
  const specsStr = document.getElementById('edit-prod-specs').value;

  let specs = {};
  if (specsStr.trim()) {
    try {
      specs = JSON.parse(specsStr);
    } catch (err) {
      specs = { Details: specsStr.trim() };
    }
  }

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
  const images = currentEditingImages.length > 0 ? currentEditingImages : ['/assets/logo.jpg'];

  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const productData = {
    id,
    name,
    price,
    oldPrice,
    discount,
    category,
    brand,
    platform,
    stockStatus,
    stockQuantity,
    description,
    specs,
    tags,
    images,
    dateAdded: new Date().toISOString()
  };

  if (window.FirebaseDB && typeof window.FirebaseDB.saveProduct === 'function') {
    try {
      await window.FirebaseDB.saveProduct(productData);
    } catch (err) {
      console.warn('Saving product to Firebase warning:', err);
    }
  }

  // Update local in-memory array live
  const existingIdx = globalProducts.findIndex(p => p.id === id);
  if (existingIdx !== -1) {
    globalProducts[existingIdx] = productData;
  } else {
    globalProducts.unshift(productData);
  }

  // Persist products list so additions/edits remain on page refresh
  persistProductsLocally();

  closeProductModal();
  applyFilters(); // Instant update in store catalog
  renderAdminDashboard(); // Instant update in admin table

  // Refresh Nouveau Arrivage popup live if this edited product is currently displayed
  const currentNouveauSettings = (typeof getNouveauArrivageSettings === 'function') ? getNouveauArrivageSettings() : null;
  if (currentNouveauSettings && currentNouveauSettings.productId === id && currentNouveauSettings.active !== false) {
    if (typeof openNouveauArrivageModal === 'function') {
      openNouveauArrivageModal(false);
    }
  }
}

function persistProductsLocally() {
  try {
    localStorage.setItem('ghma_products', JSON.stringify(globalProducts));
  } catch (e) {
    console.error('Error persisting products', e);
  }
}

// 👁️ PREVIEW BEFORE SAVING
function previewCurrentEditProduct() {
  const name = document.getElementById('edit-prod-name').value || 'اسم المنتج التجريبي';
  const price = parseFloat(document.getElementById('edit-prod-price').value) || 0;
  const oldPrice = parseFloat(document.getElementById('edit-prod-oldprice').value) || null;
  const category = document.getElementById('edit-prod-category').value;
  const brand = document.getElementById('edit-prod-brand').value;
  const description = document.getElementById('edit-prod-description').value;

  const previewItem = {
    id: 'preview-temp',
    name,
    price,
    oldPrice,
    category,
    brand,
    description,
    images: currentEditingImages
  };

  quickViewProduct('preview-temp');
  // Inject mock preview item into global search temporarily
  const modalBody = document.getElementById('preview-modal-body');
  if (modalBody) {
    const mainImg = currentEditingImages.length > 0 ? currentEditingImages[0] : '/assets/logo.jpg';
    modalBody.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div style="background: #000; border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; justify-content: center;">
          <img src="${mainImg}" style="max-width: 100%; max-height: 260px; object-fit: contain;">
        </div>
        <div>
          <span class="product-category-brand">${brand} • ${category}</span>
          <h3 style="font-size: 1.3rem; font-weight: 800; margin: 8px 0;">${name}</h3>
          
          <div style="margin: 12px 0;">
            <span style="font-size: 1.6rem; font-weight: 900; color: var(--primary);">${price.toLocaleString()} DH</span>
            ${oldPrice ? `<span style="font-size: 1rem; color: var(--text-dim); text-decoration: line-through; margin-right: 10px;">${oldPrice.toLocaleString()} DH</span>` : ''}
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 16px;">${description || ''}</p>
        </div>
      </div>
    `;
  }
}

// 📦 DUPLICATE PRODUCT
async function duplicateProduct(prodId) {
  const p = globalProducts.find(item => item.id === prodId);
  if (!p) return;

  const copyProduct = {
    ...p,
    id: `prod-${Date.now()}`,
    name: `${p.name} (نسخة مكررة)`,
    dateAdded: new Date().toISOString()
  };

  if (window.FirebaseDB && typeof window.FirebaseDB.saveProduct === 'function') {
    try {
      await window.FirebaseDB.saveProduct(copyProduct);
    } catch (err) {
      console.warn('Saving duplicated product to Firebase warning:', err);
    }
  }

  globalProducts.unshift(copyProduct);
  persistProductsLocally();
  applyFilters();
  renderAdminDashboard();
  openProductModal(copyProduct.id);
}

// 🗑️ DELETE PRODUCT WITH CONFIRMATION
function promptDeleteProduct(prodId) {
  productToDeleteId = prodId;
  const p = globalProducts.find(item => item.id === prodId);
  const titleEl = document.getElementById('delete-prod-title');
  if (titleEl && p) {
    titleEl.innerText = `هل أنت متأكد من حذف المنتج: "${p.name}"؟`;
  }
  document.getElementById('delete-confirm-modal')?.classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('delete-confirm-modal')?.classList.remove('active');
  productToDeleteId = null;
}

async function confirmDeleteProduct() {
  if (!productToDeleteId) return;

  if (window.FirebaseDB && typeof window.FirebaseDB.deleteProduct === 'function') {
    try {
      await window.FirebaseDB.deleteProduct(productToDeleteId);
    } catch (err) {
      console.warn('Deleting product from Firebase warning:', err);
    }
  }

  // Remove from global array
  globalProducts = globalProducts.filter(p => p.id !== productToDeleteId);
  persistProductsLocally();

  // Remove from cart if present
  cart = cart.filter(c => c.id !== productToDeleteId);
  saveCart();
  updateCartBadge();

  closeDeleteModal();
  applyFilters(); // Instant update in store catalog
  renderAdminDashboard(); // Instant update in admin table
}
