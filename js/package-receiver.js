// Package Receiver View Controller for MyWarehouseManager®

const PackageReceiver = {
  currentPage: 1,
  pageSize: 5,
  sortCol: 'grn',
  sortAsc: false,
  searchQuery: '',

  setup() {
    this.setupFormSubmit();
    this.setupHistoryTable();
    this.setupAutocompleteListener();
  },

  init() {
    this.setupDate();
    this.populateDropdowns();
    this.populateAutocompleteDatalist();
    this.renderHistoryTable();
  },

  setupDate() {
    const dateInput = document.getElementById('pkg-date');
    if (dateInput) {
      dateInput.value = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  },

  populateDropdowns() {
    const supplierSelect = document.getElementById('pkg-supplier');
    if (!supplierSelect) return;

    const suppliers = Store.getSuppliers();
    const currentVal = supplierSelect.value;
    
    // Clear and reset options
    supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
    suppliers.forEach(sup => {
      const opt = document.createElement('option');
      opt.value = sup.name;
      opt.textContent = sup.name;
      supplierSelect.appendChild(opt);
    });
    
    // Preserve current selection if valid
    if (currentVal) supplierSelect.value = currentVal;
  },

  populateAutocompleteDatalist() {
    const dataList = document.getElementById('pkg-product-list');
    if (!dataList) return;

    const products = Store.getProducts();
    
    // Populate auto-complete list
    dataList.innerHTML = '';
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      dataList.appendChild(opt);
    });
  },

  setupAutocompleteListener() {
    const productInput = document.getElementById('pkg-product');
    const categorySelect = document.getElementById('pkg-category');
    const costInput = document.getElementById('pkg-cost');
    
    if (!productInput) return;

    // Handle selection event
    productInput.addEventListener('input', () => {
      const products = Store.getProducts();
      const match = products.find(p => p.name.toLowerCase() === productInput.value.trim().toLowerCase());
      if (match) {
        // Auto-fill category and unit cost
        categorySelect.value = match.category;
        costInput.value = match.cost;
        
        // Remove error states if visible
        categorySelect.closest('.form-group').classList.remove('has-error');
        costInput.closest('.form-group').classList.remove('has-error');
      }
    });
  },

  setupFormSubmit() {
    const form = document.getElementById('receive-package-form');
    const resetBtn = document.getElementById('pkg-reset-btn');

    if (!form) return;

    // Remove validation errors on input change
    form.querySelectorAll('.form-control').forEach(ctrl => {
      ctrl.addEventListener('input', () => {
        ctrl.closest('.form-group').classList.remove('has-error');
      });
      ctrl.addEventListener('change', () => {
        ctrl.closest('.form-group').classList.remove('has-error');
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (this.validateForm(form)) {
        const pkgData = {
          supplier: document.getElementById('pkg-supplier').value,
          invoiceNo: document.getElementById('pkg-invoice').value.trim(),
          productName: document.getElementById('pkg-product').value.trim(),
          category: document.getElementById('pkg-category').value,
          batchNo: document.getElementById('pkg-batch').value.trim(),
          quantity: parseInt(document.getElementById('pkg-quantity').value),
          cost: parseFloat(document.getElementById('pkg-cost').value),
          expiryDate: document.getElementById('pkg-expiry').value,
          notes: document.getElementById('pkg-notes').value.trim()
        };

        const savedPkg = Store.savePackage(pkgData);
        showToast(`Package received successfully! GRN generated: ${savedPkg.grn}`, 'success');
        
        // Render detailed receipt slip modal
        this.viewGrnDetails(savedPkg.grn);

        // Reset form & reload
        form.reset();
        this.setupDate();
        this.populateAutocompleteDatalist(); // reload autocomplete product list
        this.currentPage = 1;
        this.renderHistoryTable();
      } else {
        showToast('Please correct validation errors on the form.', 'error');
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        this.setupDate();
        form.querySelectorAll('.form-group').forEach(grp => grp.classList.remove('has-error'));
      });
    }
  },

  validateForm(form) {
    let isValid = true;

    // Supplier Validation
    const supplier = document.getElementById('pkg-supplier');
    if (!supplier.value) {
      supplier.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Invoice Validation
    const invoice = document.getElementById('pkg-invoice');
    if (!invoice.value.trim()) {
      invoice.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Product Name Validation
    const product = document.getElementById('pkg-product');
    if (!product.value.trim()) {
      product.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Category Validation
    const category = document.getElementById('pkg-category');
    if (!category.value) {
      category.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Batch Validation
    const batch = document.getElementById('pkg-batch');
    if (!batch.value.trim()) {
      batch.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Quantity Validation
    const quantity = document.getElementById('pkg-quantity');
    const qVal = parseInt(quantity.value);
    if (isNaN(qVal) || qVal <= 0) {
      quantity.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Cost Validation
    const cost = document.getElementById('pkg-cost');
    const cVal = parseFloat(cost.value);
    if (isNaN(cVal) || cVal <= 0) {
      cost.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    return isValid;
  },

  setupHistoryTable() {
    const searchInput = document.getElementById('pkg-history-search');
    const headers = document.querySelectorAll('#package-receiver th[data-sort]');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.currentPage = 1;
        this.renderHistoryTable();
      });
    }

    headers.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (this.sortCol === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortCol = col;
          this.sortAsc = true;
        }
        
        // Update header UI arrows
        headers.forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(this.sortAsc ? 'sort-asc' : 'sort-desc');

        this.renderHistoryTable();
      });
    });
  },

  renderHistoryTable() {
    const tbody = document.getElementById('pkg-history-table-body');
    const paginationEl = document.getElementById('pkg-history-pagination');
    if (!tbody) return;

    let packages = Store.getPackages();

    // 1. Apply search filter
    if (this.searchQuery) {
      packages = packages.filter(p => 
        p.grn.toLowerCase().includes(this.searchQuery) ||
        p.supplier.toLowerCase().includes(this.searchQuery) ||
        p.productName.toLowerCase().includes(this.searchQuery) ||
        p.invoiceNo.toLowerCase().includes(this.searchQuery)
      );
    }

    // 2. Apply Sorting
    packages.sort((a, b) => {
      let valA = a[this.sortCol];
      let valB = b[this.sortCol];

      if (this.sortCol === 'quantity' || this.sortCol === 'cost') {
        valA = Number(valA);
        valB = Number(valB);
      } else if (this.sortCol === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    const totalItems = packages.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, totalPages);

    // 3. Apply Pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginatedPackages = packages.slice(startIndex, startIndex + this.pageSize);

    if (paginatedPackages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray-400);">No goods receipt transactions found.</td></tr>';
      paginationEl.innerHTML = '';
      return;
    }

    let html = '';
    paginatedPackages.forEach(p => {
      const dateStr = new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      html += `<tr>
        <td style="font-weight: 600; font-family: 'Outfit', sans-serif;">${p.grn}</td>
        <td>${dateStr}</td>
        <td>${p.supplier}</td>
        <td>${p.productName}</td>
        <td>${p.quantity}</td>
        <td>
          <button class="btn-icon" data-grn-view="${p.grn}" title="View GRN slip">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </td>
      </tr>`;
    });

    tbody.innerHTML = html;

    // Bind Details Trigger Clicks
    tbody.querySelectorAll('[data-grn-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const grn = btn.getAttribute('data-grn-view');
        this.viewGrnDetails(grn);
      });
    });

    // Render Pagination Controls
    this.renderPaginationControls(paginationEl, totalItems, totalPages);
  },

  renderPaginationControls(container, totalItems, totalPages) {
    const startRange = totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endRange = Math.min(this.currentPage * this.pageSize, totalItems);

    container.innerHTML = `
      <div class="pagination-text">Showing <b>${startRange}</b> to <b>${endRange}</b> of <b>${totalItems}</b> packages</div>
      <div class="pagination-buttons">
        <button class="btn btn-secondary" id="pkg-pg-prev" ${this.currentPage === 1 ? 'disabled' : ''}>Prev</button>
        <button class="btn btn-secondary" id="pkg-pg-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    document.getElementById('pkg-pg-prev').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderHistoryTable();
      }
    });

    document.getElementById('pkg-pg-next').addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderHistoryTable();
      }
    });
  },

  viewGrnDetails(grnNo) {
    const packages = Store.getPackages();
    const pkg = packages.find(p => p.grn === grnNo);
    if (!pkg) return;

    const modalBody = document.getElementById('modal-grn-details-body');
    const dateStr = new Date(pkg.date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const totalVal = pkg.quantity * pkg.cost;

    modalBody.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px; font-family:'Inter', sans-serif;">
        <div style="border-bottom: 2px dashed var(--gray-200); padding-bottom: 16px; text-align: center;">
          <h2 style="font-family:'Outfit', sans-serif; font-weight:700; color:var(--primary); margin-bottom:4px;">MyWarehouseManager®</h2>
          <p style="font-size:0.8rem; color:var(--gray-400);">CORPORATE GOODS RECEIPT SLIP</p>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.85rem; border-bottom:1px solid var(--gray-100); padding-bottom:16px;">
          <div>
            <span style="color:var(--gray-400); display:block;">GRN ID:</span>
            <b style="font-family:'Outfit', sans-serif; font-size:1rem; color:var(--primary);">${pkg.grn}</b>
          </div>
          <div>
            <span style="color:var(--gray-400); display:block;">Date & Time:</span>
            <b>${dateStr}</b>
          </div>
          <div>
            <span style="color:var(--gray-400); display:block;">Invoice Code:</span>
            <b>${pkg.invoiceNo}</b>
          </div>
          <div>
            <span style="color:var(--gray-400); display:block;">Supplier:</span>
            <b>${pkg.supplier}</b>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem; border-bottom:1px solid var(--gray-100); padding-bottom:16px;">
          <div style="display:flex; justify-content:space-between; font-weight:600; border-bottom:1px solid var(--gray-100); padding-bottom:6px; margin-bottom:6px;">
            <span>Item Details</span>
            <span>Quantity</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <div>
              <div style="font-weight:600; color:var(--primary);">${pkg.productName}</div>
              <div style="font-size:0.75rem; color:var(--gray-400); margin-top:2px;">
                Category: ${pkg.category} | Batch: ${pkg.batchNo} ${pkg.expiryDate ? `| Exp: ${pkg.expiryDate}` : ''}
              </div>
            </div>
            <div style="font-weight:600; font-family:'Outfit', sans-serif;">${pkg.quantity} units</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.85rem; border-bottom:1px solid var(--gray-100); padding-bottom:16px;">
          <div>
            <span style="color:var(--gray-400); display:block;">Unit Purchase Price:</span>
            <b>₹${pkg.cost.toFixed(2)}</b>
          </div>
          <div>
            <span style="color:var(--gray-400); display:block;">Total Shipment Valuation:</span>
            <b style="font-family:'Outfit', sans-serif; font-size:1.1rem; color:var(--accent);">₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
          </div>
        </div>

        ${pkg.notes ? `
          <div style="font-size:0.80rem; background-color:var(--gray-50); padding:10px; border-radius:var(--border-radius-sm); border: 1px solid var(--gray-200);">
            <span style="color:var(--gray-500); font-weight:600; display:block; margin-bottom:4px;">Delivery Notes:</span>
            <p style="color:var(--gray-700);">${pkg.notes}</p>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--gray-400); margin-top:8px;">
          <span>Received By: ${pkg.receivedBy}</span>
          <span>MyWarehouseManager®</span>
        </div>
      </div>
    `;

    // Hook Print receipt button inside modal
    const printBtn = document.getElementById('btn-print-grn-slip');
    printBtn.onclick = () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print GRN ${pkg.grn}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
              hr { border: none; border-top: 1px dashed #ccc; margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
              th { background-color: #f7f7f7; font-weight: bold; }
            </style>
          </head>
          <body>
            ${modalBody.innerHTML}
            <script>window.print();<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    openModal('modal-grn-details');
  }
};
