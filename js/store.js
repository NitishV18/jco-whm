// Store Manager for MyWarehouseManager®

const STORAGE_KEYS = {
  PRODUCTS: 'mwm_products',
  PACKAGES: 'mwm_packages',
  TRANSFERS: 'mwm_transfers',
  SUPPLIERS: 'mwm_suppliers',
  BRANCHES: 'mwm_branches',
  ACTIVITIES: 'mwm_activities',
  HISTORY: 'mwm_inventory_history',
  CURRENT_USER_ROLE: 'mwm_current_role'
};

// Seed Data
const SEED_SUPPLIERS = [
  { id: 'sup-1', name: "L'Oreal", contactPerson: 'Jean-Paul', phone: '+91 98765 43210', email: 'jp@loreal-salon.com', gstNumber: '27AAAAA1111A1Z1', address: 'Mumbai Hub, Worli, Mumbai' },
  { id: 'sup-2', name: 'Schwarzkopf', contactPerson: 'Greta Mueller', phone: '+91 98222 11111', email: 'greta@schwarzkopf.com', gstNumber: '27BBBBB2222B2Z2', address: 'Ghatkopar Depot, Mumbai' },
  { id: 'sup-3', name: 'Wella', contactPerson: 'Ramesh Shah', phone: '+91 98333 44444', email: 'ramesh@wella-india.com', gstNumber: '27CCCCC3333C3Z3', address: 'Andheri East, Mumbai' },
  { id: 'sup-4', name: 'Matrix', contactPerson: 'Neha Gupta', phone: '+91 98444 55555', email: 'neha@matrixbeauty.com', gstNumber: '27DDDDD4444D4Z4', address: 'Thane West, Mumbai' }
];

const SEED_BRANCHES = [
  { id: 'br-1', name: 'Bandra', location: 'Linking Road, Bandra West', managerName: 'Sarah D\'Souza', contactNumber: '+91 99999 88888' },
  { id: 'br-2', name: 'Andheri', location: 'Lokhandwala, Andheri West', managerName: 'Amit Verma', contactNumber: '+91 98888 77777' },
  { id: 'br-3', name: 'Powai', location: 'Hiranandani Gardens, Powai', managerName: 'Priya Nair', contactNumber: '+91 97777 66666' },
  { id: 'br-4', name: 'Thane', location: 'Meadows, Thane West', managerName: 'Rahul Joshi', contactNumber: '+91 96666 55555' }
];

const SEED_PRODUCTS = [
  { id: 'prod-1', sku: 'SKU-LOR-SHAM-01', name: 'Serie Expert Shampoo', category: 'Shampoo', stock: 45, cost: 15.00, reorderLevel: 15, supplier: "L'Oreal", archived: false },
  { id: 'prod-2', sku: 'SKU-WEL-COLR-02', name: 'Color Touch Hair Color', category: 'Hair Color', stock: 12, cost: 22.50, reorderLevel: 20, supplier: 'Wella', archived: false },
  { id: 'prod-3', sku: 'SKU-SCH-STYL-03', name: 'Taft Styling Gel', category: 'Styling', stock: 75, cost: 9.00, reorderLevel: 10, supplier: 'Schwarzkopf', archived: false },
  { id: 'prod-4', sku: 'SKU-MAT-COND-04', name: 'Biolage Hydrasource Conditioner', category: 'Conditioner', stock: 0, cost: 18.00, reorderLevel: 12, supplier: 'Matrix', archived: false },
  { id: 'prod-5', sku: 'SKU-WEL-TRET-05', name: 'Elements Renewing Mask', category: 'Treatment', stock: 30, cost: 35.00, reorderLevel: 8, supplier: 'Wella', archived: false }
];

const SEED_PACKAGES = [
  { grn: 'GRN-2026-001', supplier: "L'Oreal", invoiceNo: 'INV-8872', date: '2026-06-05T10:00:00Z', productName: 'Serie Expert Shampoo', category: 'Shampoo', batchNo: 'B-LOR-991', quantity: 50, cost: 15.00, expiryDate: '2028-12-31', notes: 'Initial seed stock', receivedBy: 'Warehouse Manager' },
  { grn: 'GRN-2026-002', supplier: 'Schwarzkopf', invoiceNo: 'INV-3419', date: '2026-06-06T14:30:00Z', productName: 'Taft Styling Gel', category: 'Styling', batchNo: 'B-SCH-112', quantity: 80, cost: 9.00, expiryDate: '2029-06-30', notes: 'Bulk styling stock', receivedBy: 'Warehouse Manager' }
];

const SEED_TRANSFERS = [
  {
    transferNo: 'TO-2026-001',
    branch: 'Bandra',
    date: '2026-06-06T11:00:00Z',
    items: [
      { productId: 'prod-1', sku: 'SKU-LOR-SHAM-01', name: 'Serie Expert Shampoo', quantityRequested: 5, quantityReceived: 5, shortage: 0 }
    ],
    status: 'Completed',
    notes: 'Urgent dispatch for salon opening.',
    updatedAt: '2026-06-06T12:00:00Z'
  },
  {
    transferNo: 'TO-2026-002',
    branch: 'Andheri',
    date: '2026-06-07T09:15:00Z',
    items: [
      { productId: 'prod-3', sku: 'SKU-SCH-STYL-03', name: 'Taft Styling Gel', quantityRequested: 5, quantityReceived: 0, shortage: 0 }
    ],
    status: 'Dispatched',
    notes: 'Weekly refill request.',
    updatedAt: '2026-06-07T09:30:00Z'
  },
  {
    transferNo: 'TO-2026-003',
    branch: 'Powai',
    date: '2026-06-08T08:00:00Z',
    items: [
      { productId: 'prod-5', sku: 'SKU-WEL-TRET-05', name: 'Elements Renewing Mask', quantityRequested: 10, quantityReceived: 0, shortage: 0 }
    ],
    status: 'Pending',
    notes: 'Branch replenishment request.',
    updatedAt: '2026-06-08T08:00:00Z'
  }
];

const SEED_ACTIVITIES = [
  { id: 'act-1', date: '2026-06-05T10:00:00Z', action: "Received package from L'Oreal (GRN-2026-001)", user: 'Warehouse Manager', type: 'package' },
  { id: 'act-2', date: '2026-06-06T11:00:00Z', action: 'Created transfer TO-2026-001 to Bandra', user: 'Warehouse Manager', type: 'transfer' },
  { id: 'act-3', date: '2026-06-06T12:00:00Z', action: 'Completed transfer TO-2026-001 (Received by Bandra)', user: 'Sarah D\'Souza (Branch)', type: 'transfer' },
  { id: 'act-4', date: '2026-06-06T14:30:00Z', action: 'Received package from Schwarzkopf (GRN-2026-002)', user: 'Warehouse Manager', type: 'package' },
  { id: 'act-5', date: '2026-06-07T09:15:00Z', action: 'Created transfer TO-2026-002 to Andheri', user: 'Warehouse Manager', type: 'transfer' },
  { id: 'act-6', date: '2026-06-07T09:30:00Z', action: 'Dispatched transfer TO-2026-002 to Andheri', user: 'Warehouse Manager', type: 'transfer' }
];

const SEED_HISTORY = [
  { id: 'mov-1', productId: 'prod-1', date: '2026-06-05T10:00:00Z', type: 'GRN', reference: 'GRN-2026-001', quantityChange: 50, notes: 'Initial batch delivery' },
  { id: 'mov-2', productId: 'prod-1', date: '2026-06-06T11:00:00Z', type: 'TRANSFER', reference: 'TO-2026-001', quantityChange: -5, notes: 'Dispatched to Bandra' },
  { id: 'mov-3', productId: 'prod-3', date: '2026-06-06T14:30:00Z', type: 'GRN', reference: 'GRN-2026-002', quantityChange: 80, notes: 'Bulk styled gel replenishment' },
  { id: 'mov-4', productId: 'prod-3', date: '2026-06-07T09:30:00Z', type: 'TRANSFER', reference: 'TO-2026-002', quantityChange: -5, notes: 'Dispatched to Andheri' }
];

const Store = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.resetData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, 'Warehouse Manager');
    }
  },

  resetData() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(SEED_PACKAGES));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(SEED_TRANSFERS));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(SEED_SUPPLIERS));
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(SEED_BRANCHES));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(SEED_HISTORY));
  },

  // Helpers to read/write JSON
  _get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Role Management
  getCurrentRole() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ROLE) || 'Warehouse Manager';
  },

  setCurrentRole(role) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, role);
  },

  // Products CRUD
  getProducts() {
    return this._get(STORAGE_KEYS.PRODUCTS).filter(p => !p.archived);
  },

  getAllProductsIncludingArchived() {
    return this._get(STORAGE_KEYS.PRODUCTS);
  },

  getProduct(id) {
    return this.getProducts().find(p => p.id === id);
  },

  getProductBySku(sku) {
    return this.getProducts().find(p => p.sku.toLowerCase() === sku.toLowerCase());
  },

  getProductByName(name) {
    return this.getProducts().find(p => p.name.toLowerCase() === name.toLowerCase());
  },

  saveProduct(product) {
    const products = this._get(STORAGE_KEYS.PRODUCTS);
    if (product.id) {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...product };
      }
    } else {
      product.id = 'prod-' + Date.now();
      product.stock = product.stock || 0;
      product.archived = false;
      products.push(product);
    }
    this._set(STORAGE_KEYS.PRODUCTS, products);
    return product;
  },

  archiveProduct(id) {
    const products = this._get(STORAGE_KEYS.PRODUCTS);
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].archived = true;
      this._set(STORAGE_KEYS.PRODUCTS, products);
      this.addActivityLog(`Archived product: ${products[idx].name}`, this.getCurrentRole(), 'inventory');
      return true;
    }
    return false;
  },

  adjustStock(id, quantityChange, reason, notes) {
    const products = this._get(STORAGE_KEYS.PRODUCTS);
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const originalStock = products[idx].stock;
      products[idx].stock = Math.max(0, originalStock + quantityChange);
      this._set(STORAGE_KEYS.PRODUCTS, products);

      // Record in inventory movements history
      const history = this._get(STORAGE_KEYS.HISTORY);
      const movement = {
        id: 'mov-' + Date.now(),
        productId: id,
        date: new Date().toISOString(),
        type: 'ADJUSTMENT',
        reference: reason,
        quantityChange: quantityChange,
        notes: notes || `Stock adjusted due to ${reason}`
      };
      history.push(movement);
      this._set(STORAGE_KEYS.HISTORY, history);

      this.addActivityLog(`Adjusted stock of ${products[idx].name} by ${quantityChange > 0 ? '+' : ''}${quantityChange} (${reason})`, this.getCurrentRole(), 'inventory');
      return products[idx];
    }
    return null;
  },

  // Packages (GRN) CRUD
  getPackages() {
    return this._get(STORAGE_KEYS.PACKAGES);
  },

  generateGrnNo() {
    const pkgs = this.getPackages();
    const year = new Date().getFullYear();
    const count = pkgs.filter(p => p.grn.startsWith(`GRN-${year}`)).length + 1;
    return `GRN-${year}-${String(count).padStart(3, '0')}`;
  },

  savePackage(pkgData) {
    const packages = this._get(STORAGE_KEYS.PACKAGES);
    const products = this._get(STORAGE_KEYS.PRODUCTS);

    const grn = this.generateGrnNo();
    const dateStr = new Date().toISOString();
    const receivedBy = this.getCurrentRole();

    const newPkg = {
      grn,
      supplier: pkgData.supplier,
      invoiceNo: pkgData.invoiceNo,
      date: dateStr,
      productName: pkgData.productName,
      category: pkgData.category,
      batchNo: pkgData.batchNo,
      quantity: Number(pkgData.quantity),
      cost: Number(pkgData.cost),
      expiryDate: pkgData.expiryDate || '',
      notes: pkgData.notes || '',
      receivedBy
    };

    packages.push(newPkg);
    this._set(STORAGE_KEYS.PACKAGES, packages);

    // Look for matching active product
    let product = products.find(p => p.name.toLowerCase() === pkgData.productName.toLowerCase() && !p.archived);
    if (!product) {
      // Auto-create new product card
      const cleanSupplier = pkgData.supplier;
      const cleanName = pkgData.productName;
      const cleanCat = pkgData.category;
      
      // Auto-generate SKU
      const supCode = cleanSupplier.substring(0, 3).toUpperCase();
      const catCode = cleanCat.substring(0, 4).toUpperCase();
      const prodCode = cleanName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      const sku = `SKU-${supCode}-${prodCode}-${String(products.length + 1).padStart(2, '0')}`;

      product = {
        id: 'prod-' + Date.now(),
        sku,
        name: cleanName,
        category: cleanCat,
        stock: Number(pkgData.quantity),
        cost: Number(pkgData.cost),
        reorderLevel: 10,
        supplier: cleanSupplier,
        archived: false
      };
      products.push(product);
      this._set(STORAGE_KEYS.PRODUCTS, products);
    } else {
      // Update existing stock & update cost to newest cost price
      product.stock += Number(pkgData.quantity);
      product.cost = Number(pkgData.cost);
      this._set(STORAGE_KEYS.PRODUCTS, products);
    }

    // Add to history
    const history = this._get(STORAGE_KEYS.HISTORY);
    history.push({
      id: 'mov-' + Date.now(),
      productId: product.id,
      date: dateStr,
      type: 'GRN',
      reference: grn,
      quantityChange: Number(pkgData.quantity),
      notes: `Received package from ${pkgData.supplier}. Invoice: ${pkgData.invoiceNo}`
    });
    this._set(STORAGE_KEYS.HISTORY, history);

    // Activity Log
    this.addActivityLog(`Received package from ${pkgData.supplier} (${grn})`, receivedBy, 'package');

    return newPkg;
  },

  // Transfers CRUD
  getTransfers() {
    return this._get(STORAGE_KEYS.TRANSFERS);
  },

  generateTransferNo() {
    const transfers = this.getTransfers();
    const year = new Date().getFullYear();
    const count = transfers.filter(t => t.transferNo.startsWith(`TO-${year}`)).length + 1;
    return `TO-${year}-${String(count).padStart(3, '0')}`;
  },

  saveTransfer(transferData) {
    const transfers = this._get(STORAGE_KEYS.TRANSFERS);
    const transferNo = this.generateTransferNo();
    const dateStr = new Date().toISOString();

    const newTransfer = {
      transferNo,
      branch: transferData.branch,
      date: dateStr,
      items: transferData.items.map(item => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        quantityRequested: Number(item.quantityRequested),
        quantityReceived: 0,
        shortage: 0
      })),
      status: 'Pending',
      notes: transferData.notes || '',
      updatedAt: dateStr
    };

    transfers.push(newTransfer);
    this._set(STORAGE_KEYS.TRANSFERS, transfers);

    this.addActivityLog(`Created transfer order ${transferNo} to ${transferData.branch}`, this.getCurrentRole(), 'transfer');
    return newTransfer;
  },

  updateTransferStatus(transferNo, status, additionalDetails = {}) {
    const transfers = this._get(STORAGE_KEYS.TRANSFERS);
    const idx = transfers.findIndex(t => t.transferNo === transferNo);
    if (idx === -1) return null;

    const transfer = transfers[idx];
    const prevStatus = transfer.status;
    transfer.status = status;
    transfer.updatedAt = new Date().toISOString();

    // Check Transitions for Inventory Impacts
    const products = this._get(STORAGE_KEYS.PRODUCTS);
    const history = this._get(STORAGE_KEYS.HISTORY);

    if (status === 'Dispatched' && prevStatus !== 'Dispatched' && prevStatus !== 'Received' && prevStatus !== 'Completed') {
      // Deduct warehouse inventory
      transfer.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantityRequested);
          
          // History log
          history.push({
            id: 'mov-' + Date.now(),
            productId: item.productId,
            date: transfer.updatedAt,
            type: 'TRANSFER',
            reference: transferNo,
            quantityChange: -item.quantityRequested,
            notes: `Dispatched to ${transfer.branch}`
          });
        }
      });
      this._set(STORAGE_KEYS.PRODUCTS, products);
      this._set(STORAGE_KEYS.HISTORY, history);
      this.addActivityLog(`Dispatched transfer order ${transferNo} to ${transfer.branch}`, this.getCurrentRole(), 'transfer');

    } else if (status === 'Completed' && prevStatus !== 'Completed') {
      // Set received quantities and shortage
      if (additionalDetails.items) {
        transfer.items = transfer.items.map(item => {
          const matchedDetail = additionalDetails.items.find(detail => detail.productId === item.productId);
          if (matchedDetail) {
            const qtyReceived = Number(matchedDetail.quantityReceived);
            const shortage = Math.max(0, item.quantityRequested - qtyReceived);
            return {
              ...item,
              quantityReceived: qtyReceived,
              shortage: shortage
            };
          }
          return item;
        });
      } else {
        // Assume perfect match if no checklist is passed
        transfer.items = transfer.items.map(item => ({
          ...item,
          quantityReceived: item.quantityRequested,
          shortage: 0
        }));
      }

      this.addActivityLog(`Completed transfer order ${transferNo} (Received by ${transfer.branch})`, this.getCurrentRole(), 'transfer');
    } else {
      this.addActivityLog(`Updated transfer ${transferNo} status to ${status}`, this.getCurrentRole(), 'transfer');
    }

    transfers[idx] = transfer;
    this._set(STORAGE_KEYS.TRANSFERS, transfers);
    return transfer;
  },

  // Suppliers CRUD
  getSuppliers() {
    return this._get(STORAGE_KEYS.SUPPLIERS);
  },

  saveSupplier(supplier) {
    const suppliers = this._get(STORAGE_KEYS.SUPPLIERS);
    if (supplier.id) {
      const idx = suppliers.findIndex(s => s.id === supplier.id);
      if (idx !== -1) {
        suppliers[idx] = { ...suppliers[idx], ...supplier };
      }
    } else {
      supplier.id = 'sup-' + Date.now();
      suppliers.push(supplier);
    }
    this._set(STORAGE_KEYS.SUPPLIERS, suppliers);
    return supplier;
  },

  deleteSupplier(id) {
    const suppliers = this._get(STORAGE_KEYS.SUPPLIERS);
    const idx = suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      const name = suppliers[idx].name;
      suppliers.splice(idx, 1);
      this._set(STORAGE_KEYS.SUPPLIERS, suppliers);
      this.addActivityLog(`Deleted supplier: ${name}`, this.getCurrentRole(), 'settings');
      return true;
    }
    return false;
  },

  // Branches CRUD
  getBranches() {
    return this._get(STORAGE_KEYS.BRANCHES);
  },

  saveBranch(branch) {
    const branches = this._get(STORAGE_KEYS.BRANCHES);
    if (branch.id) {
      const idx = branches.findIndex(b => b.id === branch.id);
      if (idx !== -1) {
        branches[idx] = { ...branches[idx], ...branch };
      }
    } else {
      branch.id = 'br-' + Date.now();
      branches.push(branch);
    }
    this._set(STORAGE_KEYS.BRANCHES, branches);
    return branch;
  },

  deleteBranch(id) {
    const branches = this._get(STORAGE_KEYS.BRANCHES);
    const idx = branches.findIndex(b => b.id === id);
    if (idx !== -1) {
      const name = branches[idx].name;
      branches.splice(idx, 1);
      this._set(STORAGE_KEYS.BRANCHES, branches);
      this.addActivityLog(`Deleted branch: ${name}`, this.getCurrentRole(), 'settings');
      return true;
    }
    return false;
  },

  // Activity Logs CRUD
  getActivityLog() {
    return this._get(STORAGE_KEYS.ACTIVITIES).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addActivityLog(action, user, type = 'other') {
    const logs = this._get(STORAGE_KEYS.ACTIVITIES);
    const newLog = {
      id: 'act-' + Date.now() + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString(),
      action,
      user: user || this.getCurrentRole(),
      type
    };
    logs.unshift(newLog);
    this._set(STORAGE_KEYS.ACTIVITIES, logs);
    return newLog;
  },

  // Inventory Stock Ledger History
  getInventoryHistory(productId) {
    return this._get(STORAGE_KEYS.HISTORY)
      .filter(h => h.productId === productId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};
