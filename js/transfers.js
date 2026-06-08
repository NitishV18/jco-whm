// Transfer Orders & Branch Intake View Controller for MyWarehouseManager®

const Transfers = {
  // Transfer Creator state
  creatorRowsCount: 0,
  
  // Transfer Logs state
  currentPage: 1,
  pageSize: 5,
  sortCol: 'transferNo',
  sortAsc: false,
  searchQuery: '',
  filterStatus: '',

  setup() {
    this.setupLogsTable();
    this.setupCreatorListeners();
  },

  init() {
    this.resetCreatorForm();
    this.renderLogsTable();
  },

  initBranchReceiver() {
    this.populateBranchReceiverDropdown();
    this.renderBranchReceiverTable();
  },

  // ================= 1. CREATE TRANSFER ORDER =================
  setupCreatorListeners() {
    const form = document.getElementById('create-transfer-form');
    const addRowBtn = document.getElementById('to-add-product-row-btn');
    const resetBtn = document.getElementById('to-reset-btn');

    if (!form) return;

    // Bind Add Row action
    addRowBtn.onclick = () => this.addProductRow();

    // Reset action
    resetBtn.onclick = () => {
      this.resetCreatorForm();
    };

    // Submit Action
    form.onsubmit = (e) => {
      e.preventDefault();
      this.submitTransferForm(form);
    };
  },

  resetCreatorForm() {
    const toNoInput = document.getElementById('to-number');
    const toDateInput = document.getElementById('to-date');
    const branchSelect = document.getElementById('to-branch');
    const container = document.getElementById('to-products-rows-container');
    const form = document.getElementById('create-transfer-form');

    if (!toNoInput) return;

    // Reset layout
    container.innerHTML = '';
    this.creatorRowsCount = 0;
    form.reset();

    // Auto-generations
    toNoInput.value = Store.generateTransferNo();
    toDateInput.value = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Populate Branches dropdown
    branchSelect.innerHTML = '<option value="">Choose Branch</option>';
    Store.getBranches().forEach(br => {
      const opt = document.createElement('option');
      opt.value = br.name;
      opt.textContent = br.name;
      branchSelect.appendChild(opt);
    });

    // Inject initial product row
    this.addProductRow();
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  },

  addProductRow() {
    const container = document.getElementById('to-products-rows-container');
    if (!container) return;

    const rowId = `to-row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const products = Store.getProducts();

    const rowDiv = document.createElement('div');
    rowDiv.className = 'dynamic-row';
    rowDiv.id = rowId;

    let productOptions = '<option value="">Select Product</option>';
    products.forEach(p => {
      productOptions += `<option value="${p.id}" data-sku="${p.sku}" data-stock="${p.stock}">${p.name} (${p.sku})</option>`;
    });

    rowDiv.innerHTML = `
      <div class="form-group">
        <label>Select Product *</label>
        <select class="form-control row-product" required>
          ${productOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Available Stock</label>
        <input type="number" class="form-control row-avail" value="0" readonly>
      </div>
      <div class="form-group">
        <label>Qty Requested *</label>
        <input type="number" class="form-control row-qty" min="1" required>
      </div>
      <button type="button" class="btn btn-icon delete row-delete-btn" style="margin-bottom:0;" title="Remove row">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    `;

    container.appendChild(rowDiv);
    this.creatorRowsCount++;

    // Hook change event to sync Available Stock
    const prodSelect = rowDiv.querySelector('.row-product');
    const availInput = rowDiv.querySelector('.row-avail');
    const qtyInput = rowDiv.querySelector('.row-qty');
    const deleteBtn = rowDiv.querySelector('.row-delete-btn');

    prodSelect.addEventListener('change', () => {
      const selected = prodSelect.options[prodSelect.selectedIndex];
      const stock = selected.getAttribute('data-stock') || 0;
      availInput.value = stock;
      qtyInput.max = stock; // bound quantity limit
      
      // Clear errors
      prodSelect.closest('.form-group').classList.remove('has-error');
      qtyInput.closest('.form-group').classList.remove('has-error');
    });

    qtyInput.addEventListener('input', () => {
      qtyInput.closest('.form-group').classList.remove('has-error');
    });

    // Delete row event
    deleteBtn.addEventListener('click', () => {
      if (this.creatorRowsCount > 1) {
        rowDiv.remove();
        this.creatorRowsCount--;
      } else {
        showToast('At least one product is required in a transfer order.', 'warning');
      }
    });
  },

  submitTransferForm(form) {
    const branchSelect = document.getElementById('to-branch');
    const rows = document.querySelectorAll('#to-products-rows-container .dynamic-row');
    
    // Clear validation errors
    form.querySelectorAll('.form-group').forEach(grp => grp.classList.remove('has-error'));

    let isValid = true;

    if (!branchSelect.value) {
      branchSelect.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (rows.length === 0) {
      showToast('Please add at least one product row to transfer.', 'error');
      return;
    }

    const items = [];
    
    rows.forEach(row => {
      const prodSelect = row.querySelector('.row-product');
      const qtyInput = row.querySelector('.row-qty');
      const availVal = parseInt(row.querySelector('.row-avail').value) || 0;

      if (!prodSelect.value) {
        prodSelect.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      const qtyVal = parseInt(qtyInput.value);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        qtyInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      } else if (qtyVal > availVal) {
        qtyInput.closest('.form-group').classList.add('has-error');
        showToast(`Requested quantity exceeds available stock for selected product.`, 'error');
        isValid = false;
      }

      if (isValid && prodSelect.value) {
        const prod = Store.getProduct(prodSelect.value);
        if (prod) {
          // Check for duplicate items inside this transfer
          if (items.some(item => item.productId === prod.id)) {
            prodSelect.closest('.form-group').classList.add('has-error');
            showToast(`Duplicate product selected: ${prod.name}`, 'error');
            isValid = false;
          } else {
            items.push({
              productId: prod.id,
              sku: prod.sku,
              name: prod.name,
              quantityRequested: qtyVal
            });
          }
        }
      }
    });

    if (isValid) {
      const transferData = {
        branch: branchSelect.value,
        items: items,
        notes: document.getElementById('to-notes').value.trim()
      };

      const to = Store.saveTransfer(transferData);
      showToast(`Transfer Order ${to.transferNo} generated successfully!`, 'success');
      
      // Reset Creator
      this.setupCreatorForm();
      
      // Reload History Table
      this.currentPage = 1;
      this.renderLogsTable();
    }
  },

  // ================= 2. TRANSFER HISTORICAL LOGS =================
  setupLogsTable() {
    const searchInput = document.getElementById('to-history-search');
    const statusFilter = document.getElementById('to-history-filter-status');
    const headers = document.querySelectorAll('#transfers th[data-sort]');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.currentPage = 1;
        this.renderLogsTable();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.renderLogsTable();
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

        headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(this.sortAsc ? 'sort-asc' : 'sort-desc');

        this.renderLogsTable();
      });
    });
  },

  renderLogsTable() {
    const tbody = document.getElementById('to-history-table-body');
    const paginationEl = document.getElementById('to-history-pagination');
    if (!tbody) return;

    let transfers = Store.getTransfers();

    // 1. Search filter
    if (this.searchQuery) {
      transfers = transfers.filter(t => 
        t.transferNo.toLowerCase().includes(this.searchQuery) ||
        t.branch.toLowerCase().includes(this.searchQuery)
      );
    }

    // 2. Status filter
    if (this.filterStatus) {
      transfers = transfers.filter(t => t.status === this.filterStatus);
    }

    // 3. Sorting
    transfers.sort((a, b) => {
      let valA = a[this.sortCol];
      let valB = b[this.sortCol];

      if (this.sortCol === 'date') {
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

    // 4. Pagination
    const totalItems = transfers.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginatedTransfers = transfers.slice(startIndex, startIndex + this.pageSize);

    if (paginatedTransfers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray-400);">No transfer orders found.</td></tr>';
      paginationEl.innerHTML = '';
      return;
    }

    let html = '';
    paginatedTransfers.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const itemsCount = t.items.reduce((acc, item) => acc + item.quantityRequested, 0);
      
      let statusClass = 'pending';
      if (t.status === 'Approved') statusClass = 'approved';
      if (t.status === 'Dispatched') statusClass = 'dispatched';
      if (t.status === 'Completed') statusClass = 'completed';

      html += `<tr>
        <td style="font-weight: 600; font-family: 'Outfit', sans-serif;">${t.transferNo}</td>
        <td>${t.branch}</td>
        <td>${dateStr}</td>
        <td>${itemsCount} units (${t.items.length} item${t.items.length !== 1 ? 's' : ''})</td>
        <td><span class="status-badge ${statusClass}">${t.status}</span></td>
        <td>
          <button class="btn-icon" data-to-view="${t.transferNo}" title="View Details / Action">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </td>
      </tr>`;
    });

    tbody.innerHTML = html;

    // Hook clicks
    tbody.querySelectorAll('[data-to-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toNo = btn.getAttribute('data-to-view');
        this.openTransferDetailsModal(toNo);
      });
    });

    this.renderPaginationControls(paginationEl, totalItems, totalPages);
  },

  renderPaginationControls(container, totalItems, totalPages) {
    const startRange = totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endRange = Math.min(this.currentPage * this.pageSize, totalItems);

    container.innerHTML = `
      <div class="pagination-text">Showing <b>${startRange}</b> to <b>${endRange}</b> of <b>${totalItems}</b> orders</div>
      <div class="pagination-buttons">
        <button class="btn btn-secondary" id="to-pg-prev" ${this.currentPage === 1 ? 'disabled' : ''}>Prev</button>
        <button class="btn btn-secondary" id="to-pg-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    document.getElementById('to-pg-prev').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderLogsTable();
      }
    });

    document.getElementById('to-pg-next').addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderLogsTable();
      }
    });
  },

  // ================= 3. BRANCH RECEIVER INTAKE =================
  populateBranchReceiverDropdown() {
    const dropdown = document.getElementById('branch-rec-filter-branch');
    if (!dropdown) return;

    const branches = Store.getBranches();
    const currentRole = Store.getCurrentRole();

    dropdown.innerHTML = '<option value="">All Branches</option>';
    branches.forEach(br => {
      const opt = document.createElement('option');
      opt.value = br.name;
      opt.textContent = br.name;
      dropdown.appendChild(opt);
    });

    // Auto-scope for Branch Manager to their specific branch (e.g. Bandra default seed)
    if (currentRole === 'Branch Manager') {
      dropdown.value = 'Bandra';
      dropdown.disabled = true; // locks branch selector
    } else {
      dropdown.disabled = false;
    }

    dropdown.onchange = () => this.renderBranchReceiverTable();
  },

  renderBranchReceiverTable() {
    const tbody = document.getElementById('branch-receiver-table-body');
    if (!tbody) return;

    const filterBranch = document.getElementById('branch-rec-filter-branch').value;
    const currentRole = Store.getCurrentRole();
    let transfers = Store.getTransfers();

    // Filter incoming shipments: Dispatched statuses only (or display pending intakes)
    transfers = transfers.filter(t => t.status === 'Dispatched' || t.status === 'Completed');

    if (filterBranch) {
      transfers = transfers.filter(t => t.branch === filterBranch);
    }

    if (transfers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray-400); padding: 20px;">No incoming shipments or dispatched deliveries found.</td></tr>';
      return;
    }

    let html = '';
    transfers.forEach(t => {
      const dateStr = new Date(t.updatedAt || t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const itemsCount = t.items.reduce((acc, item) => acc + item.quantityRequested, 0);
      
      let statusClass = 'dispatched';
      if (t.status === 'Completed') statusClass = 'completed';

      // Branch manager action button says "Receive Intake" instead of view icon
      const buttonLabel = t.status === 'Dispatched' && currentRole === 'Branch Manager' ? 'Process Intake' : 'View Details';
      const buttonClass = t.status === 'Dispatched' && currentRole === 'Branch Manager' ? 'btn-accent' : 'btn-secondary';

      html += `<tr>
        <td style="font-weight: 600; font-family: 'Outfit', sans-serif;">${t.transferNo}</td>
        <td><b>${t.branch}</b></td>
        <td>${dateStr}</td>
        <td>${itemsCount} units requested</td>
        <td><span class="status-badge ${statusClass}">${t.status}</span></td>
        <td>
          <button class="btn ${buttonClass}" data-to-received-view="${t.transferNo}">
            ${buttonLabel}
          </button>
        </td>
      </tr>`;
    });

    tbody.innerHTML = html;

    // Bind triggers
    tbody.querySelectorAll('[data-to-received-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toNo = btn.getAttribute('data-to-received-view');
        this.openTransferDetailsModal(toNo);
      });
    });
  },

  // ================= 4. MODALS & PROCESS WORKFLOW =================
  openTransferDetailsModal(transferNo) {
    const transfers = Store.getTransfers();
    const to = transfers.find(t => t.transferNo === transferNo);
    if (!to) return;

    const modalTitle = document.getElementById('modal-to-details-title');
    const modalBody = document.getElementById('modal-to-details-body');
    const modalFooter = document.getElementById('modal-to-details-footer');
    const currentRole = Store.getCurrentRole();

    modalTitle.innerText = `Transfer Order Details: ${to.transferNo}`;

    // Compute progress lines
    const stages = ['Pending', 'Approved', 'Dispatched', 'Completed'];
    const currentIdx = stages.indexOf(to.status);
    
    let progressHtml = '<div style="display:flex; justify-content:space-between; margin-bottom: 24px; position:relative; padding:0 10px;">';
    // Draw joining lines behind
    progressHtml += `<div style="position:absolute; top:12px; left:20px; right:20px; height:4px; background-color:var(--gray-200); z-index:0;"></div>`;
    // Active fill line width
    const fillPercent = currentIdx > 0 ? (currentIdx / 3) * 100 : 0;
    progressHtml += `<div style="position:absolute; top:12px; left:20px; width:calc(${fillPercent}% - 40px); height:4px; background-color:var(--accent); z-index:0; transition:width 0.3s;"></div>`;

    stages.forEach((st, idx) => {
      const isActive = idx <= currentIdx;
      const dotColor = isActive ? 'var(--accent)' : 'var(--gray-300)';
      const textColor = isActive ? 'var(--primary)' : 'var(--gray-400)';
      const fontWeight = idx === currentIdx ? 'bold' : 'normal';

      progressHtml += `<div style="display:flex; flex-direction:column; align-items:center; z-index:1; position:relative; width:60px;">
        <div style="width:26px; height:26px; border-radius:50%; background-color:${isActive ? 'var(--card)' : 'var(--gray-100)'}; border: 4px solid ${dotColor}; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
          <span style="font-size:0.6rem; font-weight:bold; color:${dotColor};">${idx + 1}</span>
        </div>
        <span style="font-size:0.75rem; color:${textColor}; font-weight:${fontWeight}; margin-top:6px; white-space:nowrap;">${st}</span>
      </div>`;
    });
    progressHtml += '</div>';

    // Build items list markup
    // If status is Dispatched and user is Branch Manager, allow entering received quantities
    const isBranchReceiving = to.status === 'Dispatched' && currentRole === 'Branch Manager';
    
    let itemsTable = `
      <table style="width:100%; margin-top:16px;">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item Details</th>
            <th>Requested Qty</th>
            ${isBranchReceiving ? '<th>Received Qty</th>' : ''}
            ${to.status === 'Completed' ? '<th>Received Qty</th><th>Shortage</th>' : ''}
          </tr>
        </thead>
        <tbody>
    `;

    to.items.forEach((item, index) => {
      const receivedCol = isBranchReceiving ? `
        <td>
          <input type="number" class="form-control item-received-qty" data-prod-id="${item.productId}" min="0" max="${item.quantityRequested}" value="${item.quantityRequested}" style="width: 80px; padding:6px 10px;">
        </td>
      ` : '';

      const completedCols = to.status === 'Completed' ? `
        <td><b>${item.quantityReceived}</b></td>
        <td>
          ${item.shortage > 0 ? `<span class="status-badge out-of-stock" style="padding:2px 6px;">-${item.shortage} shortage</span>` : `<span class="status-badge in-stock" style="padding:2px 6px;">OK</span>`}
        </td>
      ` : '';

      itemsTable += `
        <tr>
          <td style="font-weight:600; font-family:'Outfit',sans-serif;">${item.sku}</td>
          <td>${item.name}</td>
          <td><b>${item.quantityRequested} units</b></td>
          ${receivedCol}
          ${completedCols}
        </tr>
      `;
    });

    itemsTable += `</tbody></table>`;

    // Compose structural body
    const notesBox = to.notes ? `
      <div style="background-color: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--border-radius-sm); padding:12px; margin-top:16px;">
        <span style="font-size: 0.75rem; font-weight: 700; color:var(--gray-500); text-transform:uppercase;">Creator notes:</span>
        <p style="font-size: 0.85rem; color:var(--gray-700); margin-top:4px;">${to.notes}</p>
      </div>
    ` : '';

    modalBody.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <!-- Status timeline -->
        ${progressHtml}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.85rem; border-bottom:1px solid var(--gray-100); padding-bottom:12px; margin-top:8px;">
          <div>
            <span style="color:var(--gray-400);">TO Reference:</span>
            <b>${to.transferNo}</b>
          </div>
          <div>
            <span style="color:var(--gray-400);">Date Initiated:</span>
            <b>${new Date(to.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</b>
          </div>
          <div>
            <span style="color:var(--gray-400);">Destination Outlet:</span>
            <b style="color:var(--accent);">${to.branch}</b>
          </div>
          <div>
            <span style="color:var(--gray-400);">Current Stage:</span>
            <span class="status-badge ${to.status === 'Completed' ? 'in-stock' : 'low-stock'}" style="display:inline-flex; font-size:0.75rem; padding: 2px 8px;">${to.status}</span>
          </div>
        </div>

        ${itemsTable}
        ${notesBox}
      </div>
    `;

    // Configure Modal footer buttons based on status & currentRole
    modalFooter.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary modal-cancel';
    cancelBtn.innerText = 'Close';
    cancelBtn.onclick = () => closeModal('modal-to-details');

    modalFooter.appendChild(cancelBtn);

    if (currentRole === 'Warehouse Manager') {
      if (to.status === 'Pending') {
        const approveBtn = document.createElement('button');
        approveBtn.className = 'btn btn-accent';
        approveBtn.innerText = 'Approve Transfer';
        approveBtn.onclick = () => {
          Store.updateTransferStatus(to.transferNo, 'Approved');
          showToast(`Approved transfer order: ${to.transferNo}`, 'success');
          closeModal('modal-to-details');
          this.renderLogsTable();
        };
        modalFooter.appendChild(approveBtn);
      } else if (to.status === 'Approved') {
        const dispatchBtn = document.createElement('button');
        dispatchBtn.className = 'btn btn-success';
        dispatchBtn.innerText = 'Dispatch Shipment';
        dispatchBtn.onclick = () => {
          Store.updateTransferStatus(to.transferNo, 'Dispatched');
          showToast(`Shipment dispatched! Stock deducted from Warehouse.`, 'success');
          closeModal('modal-to-details');
          this.renderLogsTable();
        };
        modalFooter.appendChild(dispatchBtn);
      }
    } else if (currentRole === 'Branch Manager') {
      if (to.status === 'Dispatched') {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-success';
        confirmBtn.innerText = 'Confirm Intake Receipt';
        confirmBtn.onclick = () => {
          const detailItems = [];
          let hasValidationError = false;
          
          modalBody.querySelectorAll('.item-received-qty').forEach(inp => {
            const prodId = inp.getAttribute('data-prod-id');
            const val = parseInt(inp.value);
            const max = parseInt(inp.getAttribute('max'));
            
            if (isNaN(val) || val < 0 || val > max) {
              inp.style.borderColor = 'var(--danger)';
              hasValidationError = true;
            } else {
              inp.style.borderColor = 'var(--gray-200)';
              detailItems.push({
                productId: prodId,
                quantityReceived: val
              });
            }
          });

          if (hasValidationError) {
            showToast('Please verify item intake numbers. Cannot exceed requested quantities.', 'error');
            return;
          }

          Store.updateTransferStatus(to.transferNo, 'Completed', { items: detailItems });
          showToast(`Branch Intake completed for ${to.transferNo}!`, 'success');
          closeModal('modal-to-details');
          
          // Refresh views
          this.renderBranchReceiverTable();
        };
        modalFooter.appendChild(confirmBtn);
      }
    }

    openModal('modal-to-details');
  }
};
