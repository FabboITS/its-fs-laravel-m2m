const HOST = 'http://localhost:8000';

let _customers = [];
let _products = [];
let _orders = [];

let _visible = { customers: [], products: [], orders: [] };

function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  document.getElementById('theme-label').textContent = dark
    ? 'Tema chiaro'
    : 'Tema scuro';
}

function applyStoredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    const lbl = document.getElementById('theme-label');
    if (lbl) lbl.textContent = 'Tema chiaro';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyStoredTheme();
  pingApi();
  loadCustomers();
});

async function pingApi() {
  const pill = document.getElementById('api-pill');
  const label = pill.querySelector('.api-label');
  try {
    await apiRequest(`${HOST}/api/customers`);
    pill.className = 'api-pill online';
    label.textContent = 'API connessa';
  } catch {
    pill.className = 'api-pill offline';
    label.textContent = 'API non raggiungibile';
  }
}

function switchSection(name) {
  ['customers', 'products', 'orders'].forEach((s) => {
    document.getElementById(`page-${s}`).classList.toggle('hidden', s !== name);
  });
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.section === name);
  });

  if (name === 'customers' && _customers.length === 0) loadCustomers();
  if (name === 'products' && _products.length === 0) loadProducts();
  if (name === 'orders' && _orders.length === 0) loadOrders();

  closeSidebar();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sb-overlay');
  const open = sb.classList.toggle('open');
  ov.classList.toggle('hidden', !open);
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.add('hidden');
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  setTimeout(() => {
    const first = document
      .getElementById(id)
      .querySelector('input:not([type=hidden]), select');
    if (first) first.focus();
  }, 60);
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('overlay')) closeModal(e.target.id);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')
    document
      .querySelectorAll('.overlay:not(.hidden)')
      .forEach((o) => closeModal(o.id));
});

function toast(msg, type = 'info') {
  const icons = {
    ok: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pacific-blue)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    err: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--powder-blue)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type] ?? icons.info}<span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3400);
}

function askDelete(msg, onOk) {
  document.getElementById('confirm-msg').textContent = msg;
  openModal('modal-confirm');
  const btn = document.getElementById('confirm-ok');
  const once = () => {
    btn.removeEventListener('click', once);
    closeModal('modal-confirm');
    onOk();
  };
  btn.addEventListener('click', once);
}

function filterRows(entity, q) {
  const val = q.toLowerCase().trim();
  const base = _visible[entity];
  renderTable(
    entity,
    val
      ? base.filter((r) =>
          Object.values(r).some((v) =>
            String(v ?? '')
              .toLowerCase()
              .includes(val),
          ),
        )
      : base,
  );
}

const fmtDate = (s) =>
  s
    ? new Date(s).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
const fmtPrice = (n) =>
  '€\u202f' +
  parseFloat(n ?? 0)
    .toFixed(2)
    .replace('.', ',');
const esc = (s) => {
  const d = document.createElement('div');
  d.textContent = String(s ?? '');
  return d.innerHTML;
};

const STATUS_LABEL = {
  pending: 'In attesa',
  processing: 'In lavorazione',
  completed: 'Completato',
  cancelled: 'Annullato',
};
const STATUS_CLS = {
  pending: 's-pending',
  processing: 's-processing',
  completed: 's-completed',
  cancelled: 's-cancelled',
};

function setBadge(entity, n) {
  const el = document.getElementById(`cnt-${entity}`);
  if (el) el.textContent = n;
}

function renderTable(entity, rows) {
  if (entity === 'customers') renderCustomers(rows);
  if (entity === 'products') renderProducts(rows);
  if (entity === 'orders') renderOrders(rows);
}

function renderCustomers(rows) {
  const tb = document.getElementById('tbody-customers');
  if (!rows.length) {
    tb.innerHTML = empty(5, 'Nessun cliente trovato');
    return;
  }
  tb.innerHTML = rows
    .map(
      (c) => `
    <tr>
      <td><span class="chip-id">${c.id}</span></td>
      <td><span class="cell-name">${esc(c.name)}</span></td>
      <td><span class="cell-mono">${esc(c.email)}</span></td>
      <td>${fmtDate(c.created_at)}</td>
      <td>
        <div class="act-btns">
          <button class="btn-act edit" onclick="editCustomer(${c.id})" title="Modifica">
            ${iconEdit}
          </button>
          <button class="btn-act del" onclick="deleteCustomer(${c.id},'${esc(c.name)}')" title="Elimina">
            ${iconTrash}
          </button>
        </div>
      </td>
    </tr>`,
    )
    .join('');
}

function renderProducts(rows) {
  const tb = document.getElementById('tbody-products');
  if (!rows.length) {
    tb.innerHTML = empty(5, 'Nessun prodotto trovato');
    return;
  }
  tb.innerHTML = rows
    .map((p) => {
      const s = parseInt(p.stock);
      const sc = s === 0 ? 'stock-zero' : s < 5 ? 'stock-low' : 'stock-ok';
      return `
      <tr>
        <td><span class="chip-id">${p.id}</span></td>
        <td><span class="cell-name">${esc(p.name)}</span></td>
        <td><span class="cell-price">${fmtPrice(p.price)}</span></td>
        <td><span class="stock-badge ${sc}">${s}</span></td>
        <td>
          <div class="act-btns">
            <button class="btn-act edit" onclick="editProduct(${p.id})" title="Modifica">
              ${iconEdit}
            </button>
            <button class="btn-act del" onclick="deleteProduct(${p.id},'${esc(p.name)}')" title="Elimina">
              ${iconTrash}
            </button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function renderOrders(rows) {
  const tb = document.getElementById('tbody-orders');
  if (!rows.length) {
    tb.innerHTML = empty(6, 'Nessun ordine trovato');
    return;
  }
  tb.innerHTML = rows
    .map((o) => {
      const cust = o.customer
        ? esc(o.customer.name)
        : `Cliente #${o.customer_id}`;
      const prods = o.products || [];
      const tags = prods.length
        ? prods
            .slice(0, 3)
            .map((p) => `<span class="prod-tag">${esc(p.name)}</span>`)
            .join('') +
          (prods.length > 3
            ? `<span class="prod-tag">+${prods.length - 3}</span>`
            : '')
        : '<span style="color:var(--text-muted);font-size:0.8rem">—</span>';
      return `
      <tr>
        <td><span class="chip-id">${o.id}</span></td>
        <td><span class="cell-name">${cust}</span></td>
        <td><span class="cell-price">${fmtPrice(o.total_amount)}</span></td>
        <td><span class="status-badge ${STATUS_CLS[o.status] ?? 's-pending'}">${STATUS_LABEL[o.status] ?? o.status}</span></td>
        <td><div class="prod-tags">${tags}</div></td>
        <td>
          <div class="act-btns">
            <button class="btn-act view" onclick="viewOrder(${o.id})" title="Dettaglio">
              ${iconEye}
            </button>
            <button class="btn-act del" onclick="deleteOrder(${o.id})" title="Elimina">
              ${iconTrash}
            </button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function empty(cols, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg><p>${msg}</p></div></td></tr>`;
}

const iconEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const iconTrash = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
const iconEye = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

async function loadCustomers() {
  try {
    const data = await apiRequest(`${HOST}/api/customers`);
    _customers = Array.isArray(data) ? data : [];
    _visible.customers = _customers;
    renderTable('customers', _customers);
    setBadge('customers', _customers.length);
  } catch {
    toast('Errore nel caricamento clienti', 'err');
    document.getElementById('tbody-customers').innerHTML = empty(
      5,
      'Errore nel caricamento',
    );
  }
}

async function loadProducts() {
  try {
    const data = await apiRequest(`${HOST}/api/products`);
    _products = Array.isArray(data) ? data : [];
    _visible.products = _products;
    renderTable('products', _products);
    setBadge('products', _products.length);
  } catch {
    toast('Errore nel caricamento prodotti', 'err');
    document.getElementById('tbody-products').innerHTML = empty(
      5,
      'Errore nel caricamento',
    );
  }
}

async function loadOrders() {
  try {
    const data = await apiRequest(`${HOST}/api/orders`);
    _orders = Array.isArray(data) ? data : [];
    _visible.orders = _orders;
    renderTable('orders', _orders);
    setBadge('orders', _orders.length);
  } catch {
    toast('Errore nel caricamento ordini', 'err');
    document.getElementById('tbody-orders').innerHTML = empty(
      6,
      'Errore nel caricamento',
    );
  }
}

function openCustomerForm(customer = null) {
  document.getElementById('c-id').value = customer?.id ?? '';
  document.getElementById('c-name').value = customer?.name ?? '';
  document.getElementById('c-email').value = customer?.email ?? '';

  document.getElementById('modal-customer-title').textContent = customer
    ? 'Modifica Cliente'
    : 'Nuovo Cliente';
  document.getElementById('c-save-btn').textContent = customer
    ? 'Aggiorna'
    : 'Salva';

  document.getElementById('c-name').classList.remove('error');
  document.getElementById('c-email').classList.remove('error');

  openModal('modal-customer');
}

function editCustomer(id) {
  const c = _customers.find((x) => x.id === id);
  if (c) openCustomerForm(c);
}

async function saveCustomer() {
  const id = document.getElementById('c-id').value;
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();

  let ok = true;
  document.getElementById('c-name').classList.toggle('error', !name);
  document.getElementById('c-email').classList.toggle('error', !email);
  if (!name || !email) {
    toast('Nome ed email sono obbligatori', 'err');
    return;
  }

  const btn = document.getElementById('c-save-btn');
  btn.disabled = true;
  try {
    if (id) {
      await apiRequest(`${HOST}/api/customers/${id}`, 'PUT', { name, email });
      toast('Cliente aggiornato', 'ok');
    } else {
      await apiRequest(`${HOST}/api/customers`, 'POST', { name, email });
      toast('Cliente creato', 'ok');
    }
    closeModal('modal-customer');
    await loadCustomers();
  } catch {
    toast('Errore nel salvataggio del cliente', 'err');
  } finally {
    btn.disabled = false;
  }
}

function deleteCustomer(id, name) {
  askDelete(`Eliminare il cliente "${name}"?`, async () => {
    try {
      await apiRequest(`${HOST}/api/customers/${id}`, 'DELETE');
      toast('Cliente eliminato', 'ok');
      await loadCustomers(); // ← auto-refresh
    } catch {
      toast("Errore durante l'eliminazione", 'err');
    }
  });
}

function openProductForm(product = null) {
  document.getElementById('p-id').value = product?.id ?? '';
  document.getElementById('p-name').value = product?.name ?? '';
  document.getElementById('p-price').value = product?.price ?? '';
  document.getElementById('p-stock').value = product?.stock ?? '';

  document.getElementById('modal-product-title').textContent = product
    ? 'Modifica Prodotto'
    : 'Nuovo Prodotto';
  document.getElementById('p-save-btn').textContent = product
    ? 'Aggiorna'
    : 'Salva';

  ['p-name', 'p-price', 'p-stock'].forEach((id) =>
    document.getElementById(id).classList.remove('error'),
  );
  openModal('modal-product');
}

function editProduct(id) {
  const p = _products.find((x) => x.id === id);
  if (p) openProductForm(p);
}

async function saveProduct() {
  const id = document.getElementById('p-id').value;
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  const stock = parseInt(document.getElementById('p-stock').value);

  document.getElementById('p-name').classList.toggle('error', !name);
  document.getElementById('p-price').classList.toggle('error', isNaN(price));
  document.getElementById('p-stock').classList.toggle('error', isNaN(stock));
  if (!name || isNaN(price) || isNaN(stock)) {
    toast('Compila tutti i campi', 'err');
    return;
  }

  const btn = document.getElementById('p-save-btn');
  btn.disabled = true;
  try {
    if (id) {
      await apiRequest(`${HOST}/api/products/${id}`, 'PUT', {
        name,
        price,
        stock,
      });
      toast('Prodotto aggiornato', 'ok');
    } else {
      await apiRequest(`${HOST}/api/products`, 'POST', { name, price, stock });
      toast('Prodotto creato', 'ok');
    }
    closeModal('modal-product');
    await loadProducts();
  } catch {
    toast('Errore nel salvataggio del prodotto', 'err');
  } finally {
    btn.disabled = false;
  }
}

function deleteProduct(id, name) {
  askDelete(`Eliminare il prodotto "${name}"?`, async () => {
    try {
      await apiRequest(`${HOST}/api/products/${id}`, 'DELETE');
      toast('Prodotto eliminato', 'ok');
      await loadProducts(); // ← auto-refresh
    } catch {
      toast("Errore durante l'eliminazione", 'err');
    }
  });
}

async function openOrderForm() {
  // Carica dipendenze se vuote
  if (!_customers.length) await loadCustomers();
  if (!_products.length) await loadProducts();

  // Reset campi
  document.getElementById('o-id').value = '';
  document.getElementById('o-status').value = 'pending';
  document.getElementById('modal-order-title').textContent = 'Nuovo Ordine';

  const sel = document.getElementById('o-customer');
  sel.innerHTML =
    '<option value="">Seleziona…</option>' +
    _customers
      .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`)
      .join('');

  buildPicker([]);
  openModal('modal-order');
}

function buildPicker(selected = []) {
  const picker = document.getElementById('o-picker');
  if (!_products.length) {
    picker.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.85rem;padding:6px 0">Nessun prodotto disponibile</p>';
    return;
  }
  picker.innerHTML = _products
    .map((p) => {
      const sel = selected.find((s) => s.id === p.id);
      const qty = sel?.pivot?.quantity ?? 1;
      return `
      <div class="picker-row" onclick="togglePickerCheck(event, ${p.id})">
        <input type="checkbox" id="chk-${p.id}" data-price="${p.price}"
          ${sel ? 'checked' : ''}
          onchange="onPickerChange(${p.id}, this.checked); calcTotal()"
          onclick="event.stopPropagation()" />
        <span class="picker-name">${esc(p.name)}</span>
        <span class="picker-price">${fmtPrice(p.price)}</span>
        <input type="number" class="qty-box" id="qty-${p.id}"
          value="${qty}" min="1"
          ${!sel ? 'disabled' : ''}
          oninput="calcTotal()"
          onclick="event.stopPropagation()" />
      </div>`;
    })
    .join('');
  calcTotal();
}

function togglePickerCheck(e, id) {
  if (e.target.tagName === 'INPUT') return;
  const chk = document.getElementById(`chk-${id}`);
  chk.checked = !chk.checked;
  onPickerChange(id, chk.checked);
  calcTotal();
}

function onPickerChange(id, checked) {
  const qty = document.getElementById(`qty-${id}`);
  qty.disabled = !checked;
  if (checked && (!qty.value || parseInt(qty.value) < 1)) qty.value = 1;
}

function calcTotal() {
  let t = 0;
  _products.forEach((p) => {
    const chk = document.getElementById(`chk-${p.id}`);
    const qty = document.getElementById(`qty-${p.id}`);
    if (chk?.checked) t += parseFloat(p.price) * (parseInt(qty?.value) || 1);
  });
  document.getElementById('o-total').textContent = fmtPrice(t);
}

async function saveOrder() {
  const customerId = document.getElementById('o-customer').value;
  const status = document.getElementById('o-status').value;

  if (!customerId) {
    toast('Seleziona un cliente', 'err');
    return;
  }

  const products = [];
  let total = 0;
  _products.forEach((p) => {
    const chk = document.getElementById(`chk-${p.id}`);
    const qty = document.getElementById(`qty-${p.id}`);
    if (chk?.checked) {
      const q = parseInt(qty?.value) || 1;
      products.push({ product_id: p.id, quantity: q });
      total += parseFloat(p.price) * q;
    }
  });

  if (!products.length) {
    toast('Seleziona almeno un prodotto', 'err');
    return;
  }

  const payload = {
    customer_id: parseInt(customerId),
    total_amount: parseFloat(total.toFixed(2)),
    status,
    products,
  };

  try {
    await apiRequest(`${HOST}/api/orders`, 'POST', payload);
    toast('Ordine creato', 'ok');
    closeModal('modal-order');
    await loadOrders();
  } catch {
    toast("Errore nella creazione dell'ordine", 'err');
  }
}

async function viewOrder(id) {
  try {
    const o = await apiRequest(`${HOST}/api/orders/${id}`);
    const cname = o.customer?.name ?? `#${o.customer_id}`;
    const prods = o.products ?? [];

    const prodRows = prods.length
      ? prods
          .map(
            (p) => `
          <div class="detail-prod-row">
            <span class="detail-prod-name">${esc(p.name)}</span>
            <div class="detail-prod-meta">
              <span>×${p.pivot?.quantity ?? '?'}</span>
              <span>${fmtPrice(p.price)}</span>
            </div>
          </div>`,
          )
          .join('')
      : '<p style="color:var(--text-muted);font-size:0.875rem">Nessun prodotto</p>';

    document.getElementById('order-detail-body').innerHTML = `
      <div class="detail-grid">
        <div class="detail-cell"><label>ID</label><span><span class="chip-id">${o.id}</span></span></div>
        <div class="detail-cell"><label>Cliente</label><span>${esc(cname)}</span></div>
        <div class="detail-cell"><label>Stato</label><span><span class="status-badge ${STATUS_CLS[o.status] ?? 's-pending'}">${STATUS_LABEL[o.status] ?? o.status}</span></span></div>
        <div class="detail-cell"><label>Totale</label><span class="cell-price">${fmtPrice(o.total_amount)}</span></div>
        <div class="detail-cell"><label>Creato il</label><span>${fmtDate(o.created_at)}</span></div>
      </div>
      <p class="detail-prod-label">Prodotti (${prods.length})</p>
      ${prodRows}`;

    openModal('modal-order-detail');
  } catch {
    toast('Impossibile caricare i dettagli', 'err');
  }
}

function deleteOrder(id) {
  askDelete(`Eliminare l'ordine #${id}?`, async () => {
    try {
      await apiRequest(`${HOST}/api/orders/${id}`, 'DELETE');
      toast('Ordine eliminato', 'ok');
      await loadOrders();
    } catch {
      toast("Errore durante l'eliminazione", 'err');
    }
  });
}
