// Inventory View Controller for MyWarehouseManager®

const Inventory = {
  currentPage: 1,
  pageSize: 5,
  sortCol: 'sku',
  sortAsc: true,
  searchQuery: '',
  filterCategory: '',
  filterStatus: '',

  setup() {
    this.setupFilters();
    this.setupTableSorting();
    this.setupActionListeners();
    this.setupModals();
  },

  init() {
    this.renderTable();
  },

  setupFilters() {
    const searchInput = document.getElementById('inv-table-search');
    const categoryFilter = document.getElementById('inv-filter-category');
    const statusFilter = document.getElementById('inv-filter-status');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.currentPage = 1;
        this.renderTable();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.filterCategory = e.target.value;
        this.currentPage = 1;
        this.renderTable();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.renderTable();
      });
    }
  },

  setupTableSorting() {
    const headers = document.querySelectorAll('#inventory th[data-sort]');
    headers.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (this.sortCol === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortCol = col;
          this.sortAsc = true;
        }

        // Toggle visual indicators
        headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(this.sortAsc ? 'sort-asc' : 'sort-desc');

        this.renderTable();
      });
    });
  },

  setupActionListeners() {
    const addProductBtn = document.getElementById('inv-add-product-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => {
        this.openAddEditProductModal();
      });
    }
  },

  setupModals() {
    // A. Product Form Modals bindings
    const productForm = document.getElementById('modal-product-form');
    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitProductForm(productForm);
      });
    }

    // B. Adjustment Form Modals bindings
    const adjustForm = document.getElementById('modal-adjust-stock-form');
    if (adjustForm) {
      adjustForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitAdjustForm(adjustForm);
      });
    }
  },

  renderTable() {
    const tbody = document.getElementById('inventory-table-body');
    const paginationEl = document.getElementById('inventory-table-pagination');
    if (!tbody) return;

    let products = Store.getProducts();
    const currentRole = Store.getCurrentRole();

    // 1. Search Query Filters
    if (this.searchQuery) {
      products = products.filter(p => 
        p.sku.toLowerCase().includes(this.searchQuery) ||
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.supplier.toLowerCase().includes(this.searchQuery)
      );
    }

    // 2. Category Filters
    if (this.filterCategory) {
      products = products.filter(p => p.category === this.filterCategory);
    }

    // 3. Status Filters
    if (this.filterStatus) {
      products = products.filter(p => {
        if (this.filterStatus === 'in-stock') return p.stock > p.reorderLevel;
        if (this.filterStatus === 'low-stock') return p.stock > 0 && p.stock <= p.reorderLevel;
        if (this.filterStatus === 'out-of-stock') return p.stock === 0;
        return true;
      });
    }

    // 4. Sorting
    products.sort((a, b) => {
      let valA = a[this.sortCol];
      let valB = b[this.sortCol];

      if (this.sortCol === 'stock' || this.sortCol === 'cost' || this.sortCol === 'reorderLevel') {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    // 5. Pagination logic
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginatedProducts = products.slice(startIndex, startIndex + this.pageSize);

    if (paginatedProducts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--gray-400);">No products found in warehouse matching criteria.</td></tr>';
      paginationEl.innerHTML = '';
      return;
    }

    let html = '';
    paginatedProducts.forEach(p => {
      const stockVal = p.stock * p.cost;
      
      let statusClass = 'in-stock';
      let statusText = 'In Stock';
      
      if (p.stock === 0) {
        statusClass = 'out-of-stock';
        statusText = 'Out of Stock';
      } else if (p.stock <= p.reorderLevel) {
        statusClass = 'low-stock';
        statusText = 'Low Stock';
      }

      const actionsHtml = currentRole === 'Warehouse Manager' ? `
        <div class="action-buttons">
          <button class="btn-icon" data-action="adjust" data-id="${p.id}" title="Adjust Stock">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button class="btn-icon" data-action="history" data-id="${p.id}" title="View Ledger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </button>
          <button class="btn-icon" data-action="edit" data-id="${p.id}" title="Edit Product">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
          </button>
          <button class="btn-icon delete" data-action="archive" data-id="${p.id}" title="Archive Product">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      ` : `
        <div class="action-buttons">
          <button class="btn-icon" data-action="history" data-id="${p.id}" title="View Ledger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </button>
        </div>
      `;

      html += `<tr>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${p.sku}</td>
        <td style="font-weight:500;">${p.name}</td>
        <td>${p.category}</td>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${p.stock}</td>
        <td>₹${p.cost.toFixed(2)}</td>
        <td style="font-weight:600;">₹${stockVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>${p.supplier}</td>
        <td style="font-family:'Outfit',sans-serif;">${p.reorderLevel}</td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>${actionsHtml}</td>
      </tr>`;
    });

    tbody.innerHTML = html;

    // Bind Button Click listeners
    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        
        if (action === 'edit') this.openAddEditProductModal(id);
        if (action === 'adjust') this.openAdjustModal(id);
        if (action === 'history') this.openHistoryLedgerModal(id);
        if (action === 'archive') this.triggerArchiveProduct(id);
      });
    });

    this.renderPaginationControls(paginationEl, totalItems, totalPages);
  },

  renderPaginationControls(container, totalItems, totalPages) {
    const startRange = totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endRange = Math.min(this.currentPage * this.pageSize, totalItems);

    container.innerHTML = `
      <div class="pagination-text">Showing <b>${startRange}</b> to <b>${endRange}</b> of <b>${totalItems}</b> products</div>
      <div class="pagination-buttons">
        <button class="btn btn-secondary" id="inv-pg-prev" ${this.currentPage === 1 ? 'disabled' : ''}>Prev</button>
        <button class="btn btn-secondary" id="inv-pg-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    document.getElementById('inv-pg-prev').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTable();
      }
    });

    document.getElementById('inv-pg-next').addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderTable();
      }
    });
  },

  openAddEditProductModal(productId = null) {
    const modalTitle = document.getElementById('modal-product-title');
    const formIdInput = document.getElementById('modal-product-id');
    const skuInput = document.getElementById('modal-product-sku');
    const nameInput = document.getElementById('modal-product-name');
    const categorySelect = document.getElementById('modal-product-category');
    const supplierSelect = document.getElementById('modal-product-supplier');
    const costInput = document.getElementById('modal-product-cost');
    const reorderInput = document.getElementById('modal-product-reorder');
    const stockContainer = document.getElementById('modal-product-stock-container');
    const stockInput = document.getElementById('modal-product-stock');
    const submitBtn = document.getElementById('modal-product-submit-btn');

    // Populate Suppliers list select option details
    supplierSelect.innerHTML = '<option value="">Choose Supplier</option>';
    Store.getSuppliers().forEach(sup => {
      const opt = document.createElement('option');
      opt.value = sup.name;
      opt.textContent = sup.name;
      supplierSelect.appendChild(opt);
    });

    if (productId) {
      const p = Store.getProduct(productId);
      if (!p) return;

      modalTitle.innerText = 'Edit Product Details';
      formIdInput.value = p.id;
      skuInput.value = p.sku;
      skuInput.disabled = true; // SKU code generally shouldn't change
      nameInput.value = p.name;
      categorySelect.value = p.category;
      supplierSelect.value = p.supplier;
      costInput.value = p.cost;
      reorderInput.value = p.reorderLevel;

      stockContainer.style.display = 'none'; // stock can only be adjusted via receiver or adjustments
      stockInput.required = false;

      submitBtn.innerText = 'Update Product';
    } else {
      modalTitle.innerText = 'Add New Product Card';
      formIdInput.value = '';
      skuInput.value = '';
      skuInput.disabled = false;
      nameInput.value = '';
      categorySelect.value = '';
      supplierSelect.value = '';
      costInput.value = '';
      reorderInput.value = '';

      stockContainer.style.display = 'block';
      stockInput.required = true;
      stockInput.value = 0;

      submitBtn.innerText = 'Create Product';
    }

    openModal('modal-product');
  },

  submitProductForm(form) {
    // Clear previous validations
    form.querySelectorAll('.form-group').forEach(grp => grp.classList.remove('has-error'));

    let isValid = true;
    const fields = ['sku', 'name', 'category', 'supplier', 'cost', 'reorder'];
    const id = document.getElementById('modal-product-id').value;
    
    if (!id) {
      fields.push('stock');
    }

    fields.forEach(f => {
      const el = document.getElementById(`modal-product-${f}`);
      if (!el.value.trim()) {
        el.closest('.form-group').classList.add('has-error');
        isValid = false;
      }
    });

    // Special validation logic for SKU duplication
    const sku = document.getElementById('modal-product-sku').value.trim();
    if (sku && !id) {
      const existing = Store.getProductBySku(sku);
      if (existing) {
        const skuEl = document.getElementById('modal-product-sku');
        skuEl.closest('.form-group').classList.add('has-error');
        skuEl.nextElementSibling.innerText = 'SKU Code already exists in warehouse!';
        isValid = false;
      }
    }

    if (isValid) {
      const prodData = {
        sku: sku,
        name: document.getElementById('modal-product-name').value.trim(),
        category: document.getElementById('modal-product-category').value,
        supplier: document.getElementById('modal-product-supplier').value,
        cost: parseFloat(document.getElementById('modal-product-cost').value),
        reorderLevel: parseInt(document.getElementById('modal-product-reorder').value)
      };

      if (id) {
        prodData.id = id;
        Store.saveProduct(prodData);
        showToast('Product specifications updated successfully!', 'success');
      } else {
        prodData.stock = parseInt(document.getElementById('modal-product-stock').value) || 0;
        const saved = Store.saveProduct(prodData);
        // Create initial movement log
        if (prodData.stock > 0) {
          const history = JSON.parse(localStorage.getItem('mwm_inventory_history')) || [];
          history.push({
            id: 'mov-' + Date.now(),
            productId: saved.id,
            date: new Date().toISOString(),
            type: 'ADJUSTMENT',
            reference: 'Initial Seed',
            quantityChange: prodData.stock,
            notes: 'Initial inventory stock balance registration'
          });
          localStorage.setItem('mwm_inventory_history', JSON.stringify(history));
        }
        showToast('New Product added to registry!', 'success');
      }

      closeModal('modal-product');
      this.renderTable();
    }
  },

  openAdjustModal(productId) {
    const p = Store.getProduct(productId);
    if (!p) return;

    document.getElementById('modal-adjust-product-id').value = p.id;
    document.getElementById('modal-adjust-product-name').value = p.name;
    document.getElementById('modal-adjust-current-stock').value = `${p.stock} units`;
    document.getElementById('modal-adjust-qty').value = '';
    document.getElementById('modal-adjust-notes').value = '';

    openModal('modal-adjust-stock');
  },

  submitAdjustForm(form) {
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

    let isValid = true;
    const id = document.getElementById('modal-adjust-product-id').value;
    const reason = document.getElementById('modal-adjust-reason');
    const qty = document.getElementById('modal-adjust-qty');
    const notes = document.getElementById('modal-adjust-notes');

    if (!reason.value) {
      reason.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    const qtyVal = parseInt(qty.value);
    if (isNaN(qtyVal) || qtyVal === 0) {
      qty.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Ensure we aren't adjusting stock below 0
    const p = Store.getProduct(id);
    if (p && p.stock + qtyVal < 0) {
      qty.closest('.form-group').classList.add('has-error');
      qty.nextElementSibling.innerText = `Stock deduction cannot exceed current stock of ${p.stock} units.`;
      isValid = false;
    }

    if (!notes.value.trim()) {
      notes.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (isValid) {
      Store.adjustStock(id, qtyVal, reason.value, notes.value.trim());
      showToast('Inventory level adjusted successfully!', 'success');
      closeModal('modal-adjust-stock');
      this.renderTable();
    }
  },

  openHistoryLedgerModal(productId) {
    const p = Store.getProduct(productId);
    if (!p) return;

    document.getElementById('modal-history-title').innerText = `Stock Ledger: ${p.name} (${p.sku})`;

    const tbody = document.getElementById('modal-history-table-body');
    const history = Store.getInventoryHistory(productId);

    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray-400); padding: 20px;">No historical movements logged for this SKU.</td></tr>';
    } else {
      let html = '';
      history.forEach(h => {
        const dateStr = new Date(h.date).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        
        let qtyChangeHtml = '';
        if (h.quantityChange > 0) {
          qtyChangeHtml = `<span style="color:var(--success); font-weight:600;">+${h.quantityChange}</span>`;
        } else {
          qtyChangeHtml = `<span style="color:var(--danger); font-weight:600;">${h.quantityChange}</span>`;
        }

        html += `<tr>
          <td>${dateStr}</td>
          <td><span class="status-badge ${h.type.toLowerCase() === 'grn' ? 'in-stock' : h.type.toLowerCase() === 'transfer' ? 'dispatched' : 'pending'}">${h.type}</span></td>
          <td style="font-weight:600; font-family:'Outfit',sans-serif;">${h.reference}</td>
          <td>${qtyChangeHtml}</td>
          <td>${h.notes}</td>
        </tr>`;
      });
      tbody.innerHTML = html;
    }

    openModal('modal-history-ledger');
  },

  triggerArchiveProduct(productId) {
    const p = Store.getProduct(productId);
    if (!p) return;

    if (confirm(`Are you sure you want to archive "${p.name}"? This soft-deletes the product from active inventory listings.`)) {
      Store.archiveProduct(productId);
      showToast(`Archived product: ${p.name}`, 'warning');
      this.renderTable();
    }
  }
};
