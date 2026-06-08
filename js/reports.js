// Reports Compiler and Exporter Controller for MyWarehouseManager®

const Reports = {
  currentReport: 'inventory',
  filterBranch: '',

  setup() {
    this.setupParameters();
    this.setupActions();
  },

  init() {
    this.compileReport();
  },

  setupParameters() {
    const reportSelector = document.getElementById('report-select-type');
    const branchSelector = document.getElementById('report-branch-filter');
    const branchGroup = document.getElementById('report-branch-filter-group');

    if (reportSelector) {
      reportSelector.value = this.currentReport;
      reportSelector.addEventListener('change', (e) => {
        this.currentReport = e.target.value;
        
        // Show Branch filter only for transfers or consumption reports
        if (this.currentReport === 'transfers' || this.currentReport === 'consumption') {
          branchGroup.style.display = 'block';
          this.populateBranchesDropdown(branchSelector);
        } else {
          branchGroup.style.display = 'none';
        }
        
        this.compileReport();
      });
    }

    if (branchSelector) {
      branchSelector.addEventListener('change', (e) => {
        this.filterBranch = e.target.value;
        this.compileReport();
      });
    }
  },

  populateBranchesDropdown(dropdown) {
    const branches = Store.getBranches();
    dropdown.innerHTML = '<option value="">All Branches</option>';
    branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = b.name;
      dropdown.appendChild(opt);
    });
    dropdown.value = this.filterBranch;
  },

  setupActions() {
    const csvBtn = document.getElementById('report-export-csv-btn');
    const printBtn = document.getElementById('report-print-btn');

    if (csvBtn) {
      csvBtn.onclick = () => this.exportCSV();
    }

    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  },

  compileReport() {
    const summaryContainer = document.getElementById('report-summary-container');
    const tableHead = document.getElementById('report-table-head');
    const tableBody = document.getElementById('report-table-body');

    if (!summaryContainer || !tableHead || !tableBody) return;

    summaryContainer.innerHTML = '';
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const products = Store.getProducts();
    const transfers = Store.getTransfers();
    const packages = Store.getPackages();

    switch (this.currentReport) {
      case 'inventory':
        this.compileInventoryReport(products, summaryContainer, tableHead, tableBody);
        break;
      case 'transfers':
        this.compileTransfersReport(transfers, summaryContainer, tableHead, tableBody);
        break;
      case 'suppliers':
        this.compileSuppliersReport(packages, summaryContainer, tableHead, tableBody);
        break;
      case 'consumption':
        this.compileConsumptionReport(transfers, summaryContainer, tableHead, tableBody);
        break;
      case 'lowstock':
        this.compileLowStockReport(products, summaryContainer, tableHead, tableBody);
        break;
    }
  },

  // 1. Inventory Valuation Summary
  compileInventoryReport(products, summary, head, body) {
    const totalItems = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValuation = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);

    summary.innerHTML = `
      <div class="report-summary-box">
        <span class="report-summary-label">Active SKUs</span>
        <span class="report-summary-value">${totalItems} items</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Total Stock Units</span>
        <span class="report-summary-value">${totalUnits.toLocaleString()}</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Overall Valuation</span>
        <span class="report-summary-value" style="color:var(--accent);">₹${totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;

    head.innerHTML = `
      <tr>
        <th>SKU</th>
        <th>Product Name</th>
        <th>Category</th>
        <th>Stock Units</th>
        <th>Cost Price</th>
        <th>Total Value</th>
        <th>Supplier</th>
      </tr>
    `;

    let rowsHtml = '';
    products.forEach(p => {
      const v = p.stock * p.cost;
      rowsHtml += `<tr>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${p.sku}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td><b>${p.stock}</b></td>
        <td>₹${p.cost.toFixed(2)}</td>
        <td style="font-weight:600;">₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>${p.supplier}</td>
      </tr>`;
    });
    body.innerHTML = rowsHtml || '<tr><td colspan="7" style="text-align:center;">No stock records found.</td></tr>';
  },

  // 2. Branch Transfer Shipments Audit
  compileTransfersReport(transfers, summary, head, body) {
    let filtered = transfers;
    if (this.filterBranch) {
      filtered = transfers.filter(t => t.branch === this.filterBranch);
    }

    const totalTransfers = filtered.length;
    const pending = filtered.filter(t => t.status === 'Pending').length;
    const dispatched = filtered.filter(t => t.status === 'Dispatched').length;
    const completed = filtered.filter(t => t.status === 'Completed').length;

    summary.innerHTML = `
      <div class="report-summary-box">
        <span class="report-summary-label">Total Transfers</span>
        <span class="report-summary-value">${totalTransfers} orders</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Pending</span>
        <span class="report-summary-value" style="color:var(--warning);">${pending}</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Dispatched</span>
        <span class="report-summary-value" style="color:var(--accent);">${dispatched}</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Completed Intake</span>
        <span class="report-summary-value" style="color:var(--success);">${completed}</span>
      </div>
    `;

    head.innerHTML = `
      <tr>
        <th>TO Number</th>
        <th>Destination Branch</th>
        <th>Initiated Date</th>
        <th>Product Rows</th>
        <th>Requested Qty</th>
        <th>Status</th>
      </tr>
    `;

    let rowsHtml = '';
    filtered.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('en-IN', { dateStyle: 'medium' });
      const qtyRequested = t.items.reduce((acc, item) => acc + item.quantityRequested, 0);
      
      let statusClass = 'pending';
      if (t.status === 'Approved') statusClass = 'approved';
      if (t.status === 'Dispatched') statusClass = 'dispatched';
      if (t.status === 'Completed') statusClass = 'completed';

      rowsHtml += `<tr>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${t.transferNo}</td>
        <td><b>${t.branch}</b></td>
        <td>${dateStr}</td>
        <td>${t.items.length} lines</td>
        <td><b>${qtyRequested} units</b></td>
        <td><span class="status-badge ${statusClass}">${t.status}</span></td>
      </tr>`;
    });
    body.innerHTML = rowsHtml || '<tr><td colspan="6" style="text-align:center;">No transfer records matching criteria.</td></tr>';
  },

  // 3. Supplier Intake Ledger (Packages received from suppliers)
  compileSuppliersReport(packages, summary, head, body) {
    const totalPkgs = packages.length;
    const totalQty = packages.reduce((acc, p) => acc + p.quantity, 0);
    const totalCost = packages.reduce((acc, p) => acc + (p.quantity * p.cost), 0);

    summary.innerHTML = `
      <div class="report-summary-box">
        <span class="report-summary-label">Receipts Received</span>
        <span class="report-summary-value">${totalPkgs} packages</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Total Units Intake</span>
        <span class="report-summary-value">${totalQty.toLocaleString()}</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Expenditure Capital</span>
        <span class="report-summary-value" style="color:var(--accent);">₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;

    head.innerHTML = `
      <tr>
        <th>GRN No</th>
        <th>Intake Date</th>
        <th>Supplier</th>
        <th>Product Name</th>
        <th>Category</th>
        <th>Batch No</th>
        <th>Qty Received</th>
        <th>Cost/Unit</th>
        <th>Total Cost</th>
      </tr>
    `;

    let rowsHtml = '';
    packages.forEach(p => {
      const dateStr = new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' });
      const c = p.quantity * p.cost;
      rowsHtml += `<tr>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${p.grn}</td>
        <td>${dateStr}</td>
        <td><b>${p.supplier}</b></td>
        <td>${p.productName}</td>
        <td>${p.category}</td>
        <td>${p.batchNo}</td>
        <td><b>${p.quantity}</b></td>
        <td>₹${p.cost.toFixed(2)}</td>
        <td style="font-weight:600;">₹${c.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>`;
    });
    body.innerHTML = rowsHtml || '<tr><td colspan="9" style="text-align:center;">No supplier packages receipts found.</td></tr>';
  },

  // 4. Branch Consumption (Received items at branches)
  compileConsumptionReport(transfers, summary, head, body) {
    // We analyze COMPLETED transfers where products actually arrived at branches
    let completedTrans = transfers.filter(t => t.status === 'Completed');
    if (this.filterBranch) {
      completedTrans = completedTrans.filter(t => t.branch === this.filterBranch);
    }

    // Collate totals
    const branchConsumption = [];
    let overallConsumedUnits = 0;
    let overallShortages = 0;

    completedTrans.forEach(t => {
      t.items.forEach(item => {
        overallConsumedUnits += item.quantityReceived;
        overallShortages += item.shortage;

        // Group by Branch + SKU
        const match = branchConsumption.find(bc => bc.branch === t.branch && bc.sku === item.sku);
        if (match) {
          match.qtyReceived += item.quantityReceived;
          match.shortage += item.shortage;
        } else {
          branchConsumption.push({
            branch: t.branch,
            name: item.name,
            sku: item.sku,
            qtyReceived: item.quantityReceived,
            shortage: item.shortage
          });
        }
      });
    });

    summary.innerHTML = `
      <div class="report-summary-box">
        <span class="report-summary-label">Total Shipments Delivered</span>
        <span class="report-summary-value">${completedTrans.length} deliveries</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Consumed Units</span>
        <span class="report-summary-value">${overallConsumedUnits.toLocaleString()}</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Shortage Loss</span>
        <span class="report-summary-value" style="color:var(--danger);">${overallShortages} units</span>
      </div>
    `;

    head.innerHTML = `
      <tr>
        <th>Outlet Branch</th>
        <th>Product Name</th>
        <th>SKU Code</th>
        <th>Quantity Consumed</th>
        <th>Shortage Discrepancy</th>
      </tr>
    `;

    let rowsHtml = '';
    branchConsumption.forEach(bc => {
      rowsHtml += `<tr>
        <td><b>${bc.branch}</b></td>
        <td>${bc.name}</td>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${bc.sku}</td>
        <td><b>${bc.qtyReceived} units</b></td>
        <td>
          ${bc.shortage > 0 ? `<span class="status-badge out-of-stock" style="padding:2px 6px;">-${bc.shortage} units</span>` : `<span class="status-badge in-stock" style="padding:2px 6px;">None</span>`}
        </td>
      </tr>`;
    });
    body.innerHTML = rowsHtml || '<tr><td colspan="5" style="text-align:center;">No completed consumption intake logs.</td></tr>';
  },

  // 5. Low Stock Reports
  compileLowStockReport(products, summary, head, body) {
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
    const outOfStockItems = products.filter(p => p.stock === 0);

    summary.innerHTML = `
      <div class="report-summary-box">
        <span class="report-summary-label">Total Alert Lines</span>
        <span class="report-summary-value" style="color:var(--warning);">${lowStockItems.length + outOfStockItems.length} lines</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Low Stock</span>
        <span class="report-summary-value">${lowStockItems.length} items</span>
      </div>
      <div class="report-summary-box">
        <span class="report-summary-label">Out of Stock</span>
        <span class="report-summary-value" style="color:var(--danger);">${outOfStockItems.length} items</span>
      </div>
    `;

    head.innerHTML = `
      <tr>
        <th>SKU</th>
        <th>Product Name</th>
        <th>Category</th>
        <th>Current Stock</th>
        <th>Reorder level</th>
        <th>Status</th>
        <th>Supplier</th>
      </tr>
    `;

    let rowsHtml = '';
    // Out of Stock first (critical)
    const combined = [...outOfStockItems, ...lowStockItems];

    combined.forEach(p => {
      const statusText = p.stock === 0 ? 'Out of Stock' : 'Low Stock';
      const statusClass = p.stock === 0 ? 'out-of-stock' : 'low-stock';

      rowsHtml += `<tr>
        <td style="font-weight:600; font-family:'Outfit',sans-serif;">${p.sku}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td><b style="color:${p.stock === 0 ? 'var(--danger)' : 'var(--warning)'};">${p.stock}</b></td>
        <td style="font-family:'Outfit',sans-serif;">${p.reorderLevel}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${p.supplier}</td>
      </tr>`;
    });
    body.innerHTML = rowsHtml || '<tr><td colspan="7" style="text-align:center; color:var(--success); font-weight:600; padding:20px;">All warehouse product stocks are fully loaded and in safe levels.</td></tr>';
  },

  // 6. CSV Exporter
  exportCSV() {
    const table = document.getElementById('report-table');
    if (!table) return;

    let csvContent = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(tr => {
      const cells = tr.querySelectorAll('th, td');
      const rowContent = Array.from(cells).map(cell => {
        // Strip tags, clean double quotes
        let text = cell.innerText.replace(/"/g, '""').trim();
        // Wrap cell value in double quotes if it contains commas
        if (text.includes(',') || text.includes('\n')) {
          text = `"${text}"`;
        }
        return text;
      });
      csvContent.push(rowContent.join(','));
    });

    const csvBlob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(csvBlob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.currentReport}-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Report CSV download triggered!', 'success');
  }
};
