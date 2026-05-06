// ============================================================
// GESTIONALE LARAVEL — main.js
// ============================================================

const host = 'http://localhost:8000';

// ---- In-memory cache ----
let _customers = [];
let _products = [];
let _orders = [];

// ---- Displayed rows (for search) ----
let _displayed = { customers: [], products: [], orders: [] };

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  checkApiStatus();
  loadCustomers();
});

// ============================================================
// API STATUS CHECK
// ============================================================
async function checkApiStatus() {
  const el = document.getElementById('api-status');
  const dot = el.querySelector('.status-dot');
  const txt = el.querySelector('.status-text');
  try {
    await apiRequest(`${host}/api/customers`);
    el.className = 'api-status online';
    txt.textContent = 'API connessa';
  } catch {
    el.className = 'api-status offline';
    txt.textContent = 'API non raggiungibile';
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(name) {
  ['customers', 'products', 'orders'].forEach((s) => {
    document
      .getElementById(`section-${s}`)
      .classList.toggle('hidden', s !== name);
  });
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === name);
  });
  // Load data on first visit
  if (name === 'customers' && _customers.length === 0) loadCustomers();
  if (name === 'products' && _products.length === 0) loadProducts();
  if (name === 'orders' && _orders.length === 0) loadOrders();
  // Close mobile sidebar
  closeSidebar();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden', !open);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  // Trap first focusable element
  setTimeout(() => {
    const first = document
      .getElementById(id)
      .querySelector('input, select, textarea');
    if (first) first.focus();
  }, 50);
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document
      .querySelectorAll('.modal-overlay:not(.hidden)')
      .forEach((m) => m.classList.add('hidden'));
  }
});

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--aqua)"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#e06070"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--teal)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

// ============================================================
// CONFIRM DELETE
// ============================================================
function confirmDelete(message, onConfirm) {
  document.getElementById('confirm-text').textContent = message;
  openModal('confirm-modal');
  const btn = document.getElementById('confirm-delete-btn');
  const handler = () => {
    closeModal('confirm-modal');
    btn.removeEventListener('click', handler);
    onConfirm();
  };
  btn.addEventListener('click', handler);
}

// ============================================================
// TABLE SEARCH FILTER
// ============================================================
function filterTable(entity, query) {
  const q = query.toLowerCase().trim();
  const rows = _displayed[entity];
  if (!q) {
    renderRows(entity, rows);
    return;
  }
  const filtered = rows.filter((r) =>
    Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
  );
  renderRows(entity, filtered);
}

// ============================================================
// HELPERS
// ============================================================
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(n) {
  return (
    '€ ' +
    parseFloat(n || 0)
      .toFixed(2)
      .replace('.', ',')
  );
}

function statusLabel(s) {
  const map = {
    pending: 'In attesa',
    processing: 'In lavorazione',
    completed: 'Completato',
    cancelled: 'Annullato',
  };
  return map[s] || s;
}

function statusClass(s) {
  const map = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };
  return map[s] || 'status-pending';
}

function updateBadge(entity, count) {
  const el = document.getElementById(`badge-${entity}`);
  if (el) el.textContent = count;
}

// ============================================================
// CUSTOMERS
// ============================================================
async function loadCustomers() {
  try {
    const data = await apiRequest(`${host}/api/customers`);
    _customers = data;
    _displayed.customers = data;
    renderRows('customers', data);
    updateBadge('customers', data.length);
  } catch {
    showToast('Errore nel caricamento clienti', 'error');
    document.getElementById('tbody-customers').innerHTML = emptyState(
      'Nessun cliente trovato',
      5,
    );
  }
}

function renderRows(entity, rows) {
  if (entity === 'customers') renderCustomerRows(rows);
  if (entity === 'products') renderProductRows(rows);
  if (entity === 'orders') renderOrderRows(rows);
}

function renderCustomerRows(rows) {
  const tbody = document.getElementById('tbody-customers');
  if (!rows.length) {
    tbody.innerHTML = emptyState('Nessun cliente trovato', 5);
    return;
  }
  tbody.innerHTML = rows
    .map(
      (c) => `
    <tr>
      <td><span class="id-chip">${c.id}</span></td>
      <td><span class="name-cell">${escHtml(c.name)}</span></td>
      <td><span class="email-cell">${escHtml(c.email)}</span></td>
      <td>${formatDate(c.created_at)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action info" onclick="editCustomer(${c.id})" title="Modifica">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action danger" onclick="deleteCustomer(${c.id}, '${escHtml(c.name)}')" title="Elimina">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join('');
}

function openCustomerModal(customer = null) {
  document.getElementById('customer-id').value = customer ? customer.id : '';
  document.getElementById('customer-name').value = customer
    ? customer.name
    : '';
  document.getElementById('customer-email').value = customer
    ? customer.email
    : '';
  document.getElementById('customer-modal-title').textContent = customer
    ? 'Modifica Cliente'
    : 'Nuovo Cliente';
  document.getElementById('customer-save-label').textContent = customer
    ? 'Aggiorna Cliente'
    : 'Salva Cliente';
  openModal('customer-modal');
}

async function editCustomer(id) {
  const c = _customers.find((x) => x.id === id);
  if (c) openCustomerModal(c);
}

async function saveCustomer() {
  const id = document.getElementById('customer-id').value;
  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  if (!name || !email) {
    showToast('Nome ed email sono obbligatori', 'error');
    return;
  }
  try {
    if (id) {
      await apiRequest(`${host}/api/customers/${id}`, 'PUT', { name, email });
      showToast('Cliente aggiornato con successo', 'success');
    } else {
      await apiRequest(`${host}/api/customers`, 'POST', { name, email });
      showToast('Cliente creato con successo', 'success');
    }
    closeModal('customer-modal');
    loadCustomers();
  } catch {
    showToast('Errore nel salvataggio del cliente', 'error');
  }
}

async function deleteCustomer(id, name) {
  confirmDelete(`Eliminare il cliente "${name}"?`, async () => {
    try {
      await apiRequest(`${host}/api/customers/${id}`, 'DELETE');
      showToast('Cliente eliminato', 'success');
      loadCustomers();
    } catch {
      showToast("Errore durante l'eliminazione", 'error');
    }
  });
}

// ============================================================
// PRODUCTS
// ============================================================
async function loadProducts() {
  try {
    const data = await apiRequest(`${host}/api/products`);
    _products = data;
    _displayed.products = data;
    renderRows('products', data);
    updateBadge('products', data.length);
  } catch {
    showToast('Errore nel caricamento prodotti', 'error');
    document.getElementById('tbody-products').innerHTML = emptyState(
      'Nessun prodotto trovato',
      5,
    );
  }
}

function renderProductRows(rows) {
  const tbody = document.getElementById('tbody-products');
  if (!rows.length) {
    tbody.innerHTML = emptyState('Nessun prodotto trovato', 5);
    return;
  }
  tbody.innerHTML = rows
    .map((p) => {
      const stock = parseInt(p.stock);
      const stockClass = stock === 0 ? 'zero' : stock < 5 ? 'low' : 'ok';
      return `
      <tr>
        <td><span class="id-chip">${p.id}</span></td>
        <td><span class="name-cell">${escHtml(p.name)}</span></td>
        <td><span class="price-chip">${formatPrice(p.price)}</span></td>
        <td><span class="stock-chip ${stockClass}">${stock}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-action info" onclick="editProduct(${p.id})" title="Modifica">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-action danger" onclick="deleteProduct(${p.id}, '${escHtml(p.name)}')" title="Elimina">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

function openProductModal(product = null) {
  document.getElementById('product-id').value = product ? product.id : '';
  document.getElementById('product-name').value = product ? product.name : '';
  document.getElementById('product-price').value = product ? product.price : '';
  document.getElementById('product-stock').value = product ? product.stock : '';
  document.getElementById('product-modal-title').textContent = product
    ? 'Modifica Prodotto'
    : 'Nuovo Prodotto';
  document.getElementById('product-save-label').textContent = product
    ? 'Aggiorna Prodotto'
    : 'Salva Prodotto';
  openModal('product-modal');
}

async function editProduct(id) {
  const p = _products.find((x) => x.id === id);
  if (p) openProductModal(p);
}

async function saveProduct() {
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  if (!name || isNaN(price) || isNaN(stock)) {
    showToast('Compila tutti i campi correttamente', 'error');
    return;
  }
  try {
    if (id) {
      await apiRequest(`${host}/api/products/${id}`, 'PUT', {
        name,
        price,
        stock,
      });
      showToast('Prodotto aggiornato con successo', 'success');
    } else {
      await apiRequest(`${host}/api/products`, 'POST', { name, price, stock });
      showToast('Prodotto creato con successo', 'success');
    }
    closeModal('product-modal');
    loadProducts();
  } catch {
    showToast('Errore nel salvataggio del prodotto', 'error');
  }
}

async function deleteProduct(id, name) {
  confirmDelete(`Eliminare il prodotto "${name}"?`, async () => {
    try {
      await apiRequest(`${host}/api/products/${id}`, 'DELETE');
      showToast('Prodotto eliminato', 'success');
      loadProducts();
    } catch {
      showToast("Errore durante l'eliminazione", 'error');
    }
  });
}

// ============================================================
// ORDERS
// ============================================================
async function loadOrders() {
  try {
    const data = await apiRequest(`${host}/api/orders`);
    _orders = data;
    _displayed.orders = data;
    renderRows('orders', data);
    updateBadge('orders', data.length);
  } catch {
    showToast('Errore nel caricamento ordini', 'error');
    document.getElementById('tbody-orders').innerHTML = emptyState(
      'Nessun ordine trovato',
      6,
    );
  }
}

function renderOrderRows(rows) {
  const tbody = document.getElementById('tbody-orders');
  if (!rows.length) {
    tbody.innerHTML = emptyState('Nessun ordine trovato', 6);
    return;
  }
  tbody.innerHTML = rows
    .map((o) => {
      const customerName = o.customer
        ? escHtml(o.customer.name)
        : `Cliente #${o.customer_id}`;
      const products = o.products || [];
      const productTags = products.length
        ? products
            .slice(0, 3)
            .map((p) => `<span class="product-tag">${escHtml(p.name)}</span>`)
            .join('') +
          (products.length > 3
            ? `<span class="product-tag">+${products.length - 3}</span>`
            : '')
        : '<span style="color:var(--text-muted);font-size:0.8rem">—</span>';
      return `
      <tr>
        <td><span class="id-chip">${o.id}</span></td>
        <td><span class="name-cell">${customerName}</span></td>
        <td><span class="price-chip">${formatPrice(o.total_amount)}</span></td>
        <td><span class="status-badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
        <td><div class="product-tags">${productTags}</div></td>
        <td>
          <div class="action-btns">
            <button class="btn-action info" onclick="viewOrder(${o.id})" title="Dettaglio">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-action danger" onclick="deleteOrder(${o.id})" title="Elimina">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

async function openOrderModal() {
  // Make sure we have customers and products loaded
  if (_customers.length === 0) await loadCustomers();
  if (_products.length === 0) await loadProducts();

  // Reset form
  document.getElementById('order-id').value = '';
  document.getElementById('order-modal-title').textContent = 'Nuovo Ordine';
  document.getElementById('order-status').value = 'pending';

  // Populate customer select
  const sel = document.getElementById('order-customer');
  sel.innerHTML =
    '<option value="">Seleziona un cliente...</option>' +
    _customers
      .map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`)
      .join('');

  // Build product picker
  buildProductPicker([]);

  openModal('order-modal');
}

function buildProductPicker(selectedProducts) {
  const picker = document.getElementById('product-picker');
  if (!_products.length) {
    picker.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">Nessun prodotto disponibile</p>';
    return;
  }
  picker.innerHTML = _products
    .map((p) => {
      const sel = selectedProducts.find((s) => s.id === p.id);
      const checked = sel ? 'checked' : '';
      const qty = sel ? (sel.pivot ? sel.pivot.quantity : 1) : 1;
      return `
      <div class="product-picker-item" id="picker-item-${p.id}">
        <input type="checkbox" id="pick-${p.id}" data-price="${p.price}" ${checked}
          onchange="togglePickerItem(${p.id}, this.checked); recalcTotal()" />
        <label for="pick-${p.id}" class="product-picker-name">${escHtml(p.name)}</label>
        <span class="product-picker-price">${formatPrice(p.price)}</span>
        <input type="number" class="qty-input" id="qty-${p.id}" value="${qty}" min="1"
          ${!sel ? 'disabled' : ''} oninput="recalcTotal()" />
      </div>
    `;
    })
    .join('');
  recalcTotal();
}

function togglePickerItem(id, checked) {
  const qtyInput = document.getElementById(`qty-${id}`);
  qtyInput.disabled = !checked;
  if (checked) qtyInput.value = qtyInput.value || 1;
}

function recalcTotal() {
  let total = 0;
  _products.forEach((p) => {
    const chk = document.getElementById(`pick-${p.id}`);
    const qty = document.getElementById(`qty-${p.id}`);
    if (chk && chk.checked && qty) {
      total += parseFloat(p.price) * parseInt(qty.value || 1);
    }
  });
  document.getElementById('order-total-display').textContent =
    formatPrice(total);
}

async function saveOrder() {
  const customerId = document.getElementById('order-customer').value;
  const status = document.getElementById('order-status').value;

  if (!customerId) {
    showToast('Seleziona un cliente', 'error');
    return;
  }

  const products = [];
  let total = 0;

  _products.forEach((p) => {
    const chk = document.getElementById(`pick-${p.id}`);
    const qty = document.getElementById(`qty-${p.id}`);
    if (chk && chk.checked) {
      const q = parseInt(qty.value) || 1;
      products.push({ product_id: p.id, quantity: q });
      total += parseFloat(p.price) * q;
    }
  });

  if (!products.length) {
    showToast('Aggiungi almeno un prodotto', 'error');
    return;
  }

  const payload = {
    customer_id: parseInt(customerId),
    total_amount: parseFloat(total.toFixed(2)),
    status,
    products,
  };

  try {
    await apiRequest(`${host}/api/orders`, 'POST', payload);
    showToast('Ordine creato con successo', 'success');
    closeModal('order-modal');
    loadOrders();
  } catch {
    showToast("Errore nella creazione dell'ordine", 'error');
  }
}

async function viewOrder(id) {
  try {
    const o = await apiRequest(`${host}/api/orders/${id}`);
    const customerName = o.customer ? o.customer.name : `#${o.customer_id}`;
    const products = o.products || [];
    const productRows = products.length
      ? products
          .map(
            (p) => `
          <div class="detail-product-row">
            <span class="detail-product-name">${escHtml(p.name)}</span>
            <div class="detail-product-meta">
              <span>x${p.pivot ? p.pivot.quantity : '?'}</span>
              <span>${formatPrice(p.price)}</span>
            </div>
          </div>
        `,
          )
          .join('')
      : '<p style="color:var(--text-muted);font-size:0.875rem">Nessun prodotto</p>';

    document.getElementById('order-detail-content').innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <label>ID Ordine</label>
          <span><span class="id-chip">${o.id}</span></span>
        </div>
        <div class="detail-item">
          <label>Cliente</label>
          <span>${escHtml(customerName)}</span>
        </div>
        <div class="detail-item">
          <label>Stato</label>
          <span><span class="status-badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></span>
        </div>
        <div class="detail-item">
          <label>Totale</label>
          <span class="price-chip">${formatPrice(o.total_amount)}</span>
        </div>
        <div class="detail-item">
          <label>Creato il</label>
          <span>${formatDate(o.created_at)}</span>
        </div>
      </div>
      <p class="detail-products-title">Prodotti nell'ordine (${products.length})</p>
      ${productRows}
    `;
    openModal('order-detail-modal');
  } catch {
    showToast("Impossibile caricare i dettagli dell'ordine", 'error');
  }
}

async function deleteOrder(id) {
  confirmDelete(`Eliminare l'ordine #${id}?`, async () => {
    try {
      await apiRequest(`${host}/api/orders/${id}`, 'DELETE');
      showToast('Ordine eliminato', 'success');
      loadOrders();
    } catch {
      showToast("Errore durante l'eliminazione", 'error');
    }
  });
}

// ============================================================
// UTILS
// ============================================================
function emptyState(text, colspan) {
  return `<tr>
    <td colspan="${colspan}">
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${text}</p>
      </div>
    </td>
  </tr>`;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}
