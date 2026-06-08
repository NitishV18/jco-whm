// Core Application Controller for MyWarehouseManager®

// Global application state
const App = {
  currentView: 'dashboard',
  
  init() {
    // Initialize LocalStorage Data Store
    Store.init();

    // Run one-time setup for UI modules
    PackageReceiver.setup?.();
    Inventory.setup?.();
    Transfers.setup?.();
    Settings.setup?.();
    Reports.setup?.();

    // Setup Sidebar collapse
    this.setupSidebarCollapse();

    // Setup Navigation Router
    this.setupRouter();

    // Setup Role Switcher
    this.setupRoleSwitcher();

    // Setup Global Search
    this.setupGlobalSearch();

    // Setup Notification Center
    this.setupNotificationCenter();

    // Initialize Active Modules
    this.refreshCurrentView();

    // Trigger Initial Role Configuration
    this.applyRolePermissions(Store.getCurrentRole());
  },

  // Sidebar collapsing toggle
  setupSidebarCollapse() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  },

  // SPA Hash/Click Routing
  setupRouter() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    // Handle browser back/forward hashes if any
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(hash)) {
        this.navigateTo(hash, false);
      }
    });

    // Set default hash on launch
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
      this.navigateTo(initialHash, false);
    }
  },

  navigateTo(viewName, updateHash = true) {
    if (updateHash) {
      window.location.hash = viewName;
    }

    // Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      }
    });

    // Deactivate all panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    // Activate selected panel
    const targetPanel = document.getElementById(viewName);
    if (targetPanel) {
      targetPanel.classList.add('active');
      this.currentView = viewName;
      this.refreshCurrentView();
    }
  },

  refreshCurrentView() {
    this.updateNotificationCenterBadge();
    
    switch (this.currentView) {
      case 'dashboard':
        Dashboard.init();
        break;
      case 'package-receiver':
        PackageReceiver.init();
        break;
      case 'inventory':
        Inventory.init();
        break;
      case 'transfers':
        Transfers.init();
        break;
      case 'branch-receiver':
        Transfers.initBranchReceiver();
        break;
      case 'suppliers':
        Settings.initSuppliers();
        break;
      case 'branches':
        Settings.initBranches();
        break;
      case 'reports':
        Reports.init();
        break;
    }
  },

  // Toggle user roles
  setupRoleSwitcher() {
    const roleButtons = document.querySelectorAll('.role-pill');
    
    roleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selectedRole = btn.getAttribute('data-role');
        
        Store.setCurrentRole(selectedRole);
        this.applyRolePermissions(selectedRole);
        
        // Show status toast
        showToast(`Switched workspace role to: ${selectedRole}`, 'success');
        
        // Refresh dashboard / current active view
        this.refreshCurrentView();
      });
    });

    // Sync header on initial load
    const currentRole = Store.getCurrentRole();
    roleButtons.forEach(btn => {
      if (btn.getAttribute('data-role') === currentRole) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  applyRolePermissions(role) {
    const avatar = document.getElementById('user-avatar-initials');
    const nameLabel = document.getElementById('user-display-name');
    const roleLabel = document.getElementById('user-display-role');

    // UI elements to show/hide
    const navPkg = document.getElementById('nav-pkg-receiver');
    const navTransfers = document.getElementById('nav-transfers');
    const navSuppliers = document.getElementById('nav-suppliers');
    const navBranches = document.getElementById('nav-branches');
    
    // Inventory action controllers
    const addProductBtn = document.getElementById('inv-add-product-btn');

    if (role === 'Warehouse Manager') {
      avatar.innerText = 'WM';
      avatar.style.backgroundColor = 'var(--primary)';
      nameLabel.innerText = 'Alex Carter';
      roleLabel.innerText = 'Warehouse Manager';

      // Restore full navigation
      navPkg.style.display = 'flex';
      navTransfers.style.display = 'flex';
      navSuppliers.style.display = 'flex';
      navBranches.style.display = 'flex';
      
      if (addProductBtn) addProductBtn.style.display = 'flex';
    } else {
      avatar.innerText = 'BM';
      avatar.style.backgroundColor = 'var(--accent)';
      nameLabel.innerText = 'Sarah D\'Souza';
      roleLabel.innerText = 'Branch Manager';

      // Restrict navigation views
      navPkg.style.display = 'none';
      navSuppliers.style.display = 'none';
      navBranches.style.display = 'none';
      
      if (addProductBtn) addProductBtn.style.display = 'none';

      // If in a hidden view, boot to dashboard
      if (['package-receiver', 'suppliers', 'branches'].includes(this.currentView)) {
        this.navigateTo('dashboard');
      }
    }
  },

  // Instant global search
  setupGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchOverlay = document.getElementById('search-overlay');

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        searchOverlay.innerHTML = '';
        searchOverlay.classList.remove('active');
        return;
      }

      const products = Store.getProducts();
      const packages = Store.getPackages();
      const transfers = Store.getTransfers();

      const matchedProducts = products.filter(p => p.sku.toLowerCase().includes(query) || p.name.toLowerCase().includes(query));
      const matchedPackages = packages.filter(p => p.grn.toLowerCase().includes(query) || p.supplier.toLowerCase().includes(query) || p.productName.toLowerCase().includes(query));
      const matchedTransfers = transfers.filter(t => t.transferNo.toLowerCase().includes(query) || t.branch.toLowerCase().includes(query));

      if (matchedProducts.length === 0 && matchedPackages.length === 0 && matchedTransfers.length === 0) {
        searchOverlay.innerHTML = '<div style="padding: 16px; font-size: 0.8rem; text-align: center; color: var(--gray-400);">No matching entries found.</div>';
        searchOverlay.classList.add('active');
        return;
      }

      let html = '';

      // Products matches
      if (matchedProducts.length > 0) {
        html += `<div class="search-result-group">
          <div class="search-result-group-title">Products</div>`;
        matchedProducts.slice(0, 3).forEach(p => {
          html += `<div class="search-result-item" data-action="view-product" data-id="${p.id}">
            <div class="search-result-main">
              <span class="search-result-name">${p.name}</span>
              <span class="search-result-sub">${p.sku} • Stock: ${p.stock} units</span>
            </div>
            <span class="search-result-badge">${p.category}</span>
          </div>`;
        });
        html += `</div>`;
      }

      // Packages matches
      if (matchedPackages.length > 0) {
        html += `<div class="search-result-group">
          <div class="search-result-group-title">GRN Receipts</div>`;
        matchedPackages.slice(0, 3).forEach(p => {
          html += `<div class="search-result-item" data-action="view-grn" data-id="${p.grn}">
            <div class="search-result-main">
              <span class="search-result-name">${p.grn} (${p.productName})</span>
              <span class="search-result-sub">From: ${p.supplier} • Qty: ${p.quantity}</span>
            </div>
            <span class="search-result-badge">GRN</span>
          </div>`;
        });
        html += `</div>`;
      }

      // Transfers matches
      if (matchedTransfers.length > 0) {
        html += `<div class="search-result-group">
          <div class="search-result-group-title">Transfers</div>`;
        matchedTransfers.slice(0, 3).forEach(t => {
          html += `<div class="search-result-item" data-action="view-to" data-id="${t.transferNo}">
            <div class="search-result-main">
              <span class="search-result-name">${t.transferNo} to ${t.branch}</span>
              <span class="search-result-sub">Status: ${t.status} • Items: ${t.items.length}</span>
            </div>
            <span class="search-result-badge">${t.status}</span>
          </div>`;
        });
        html += `</div>`;
      }

      searchOverlay.innerHTML = html;
      searchOverlay.classList.add('active');

      // Bind clicks
      searchOverlay.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = item.getAttribute('data-action');
          const id = item.getAttribute('data-id');
          searchOverlay.classList.remove('active');
          searchInput.value = '';

          if (action === 'view-product') {
            this.navigateTo('inventory');
            // Delay slightly to allow table rendering before search injection
            setTimeout(() => {
              const filterInput = document.getElementById('inv-table-search');
              if (filterInput) {
                const prod = Store.getProduct(id);
                if (prod) {
                  filterInput.value = prod.sku;
                  filterInput.dispatchEvent(new Event('input'));
                }
              }
            }, 100);
          } else if (action === 'view-grn') {
            this.navigateTo('package-receiver');
            setTimeout(() => {
              const grnBtn = document.querySelector(`[data-grn-view="${id}"]`);
              if (grnBtn) grnBtn.click();
            }, 100);
          } else if (action === 'view-to') {
            this.navigateTo('transfers');
            setTimeout(() => {
              const toBtn = document.querySelector(`[data-to-view="${id}"]`);
              if (toBtn) toBtn.click();
            }, 100);
          }
        });
      });
    });

    // Close overlay on clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchOverlay.contains(e.target)) {
        searchOverlay.classList.remove('active');
      }
    });
  },

  // Notification center logic
  setupNotificationCenter() {
    const bellBtn = document.getElementById('notification-bell-btn');
    const dropdown = document.getElementById('notification-dropdown');
    const clearBtn = document.getElementById('notif-clear-btn');

    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
      this.renderNotifications();
    });

    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Since notifications are computed on the fly based on data alerts, clearing triggers standard notification logs reset
      const products = Store.getProducts();
      // Mute active alerts temporarily in session storage
      const muteAlerts = [];
      products.forEach(p => {
        if (p.stock <= p.reorderLevel) muteAlerts.push(p.id);
      });
      sessionStorage.setItem('mwm_muted_alerts', JSON.stringify(muteAlerts));
      this.updateNotificationCenterBadge();
      this.renderNotifications();
      dropdown.classList.remove('active');
      showToast('Cleared active warnings dashboard', 'success');
    });

    document.addEventListener('click', (e) => {
      if (!bellBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  },

  updateNotificationCenterBadge() {
    const badge = document.getElementById('notif-badge');
    const alerts = this.getAlertItems();
    if (alerts.length > 0) {
      badge.innerText = alerts.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  getAlertItems() {
    const products = Store.getProducts();
    const transfers = Store.getTransfers();
    const currentRole = Store.getCurrentRole();
    const mutedAlerts = JSON.parse(sessionStorage.getItem('mwm_muted_alerts')) || [];

    const alerts = [];

    // Low stock warnings
    products.forEach(p => {
      if (p.stock <= p.reorderLevel && !mutedAlerts.includes(p.id)) {
        alerts.push({
          id: `alert-stock-${p.id}`,
          type: p.stock === 0 ? 'danger' : 'warning',
          text: `⚠️ ${p.name} stock level is ${p.stock === 0 ? 'OUT OF STOCK' : 'LOW'} (${p.stock} remaining).`,
          time: 'Warehouse stock limit',
          targetView: 'inventory',
          searchQuery: p.sku
        });
      }
    });

    // Transfers awaiting action
    transfers.forEach(t => {
      if (currentRole === 'Warehouse Manager' && t.status === 'Pending') {
        alerts.push({
          id: `alert-trans-pending-${t.transferNo}`,
          type: 'warning',
          text: `🚚 Transfer ${t.transferNo} to ${t.branch} is awaiting manager approval.`,
          time: 'Needs approval',
          targetView: 'transfers',
          searchQuery: t.transferNo
        });
      } else if (currentRole === 'Branch Manager' && t.status === 'Dispatched') {
        alerts.push({
          id: `alert-trans-disp-${t.transferNo}`,
          type: 'success',
          text: `📦 Incoming transfer ${t.transferNo} is dispatched and ready for intake.`,
          time: 'Awaiting intake',
          targetView: 'branch-receiver',
          searchQuery: t.transferNo
        });
      }
    });

    return alerts;
  },

  renderNotifications() {
    const container = document.getElementById('notif-list-container');
    const alerts = this.getAlertItems();

    if (alerts.length === 0) {
      container.innerHTML = '<div class="notif-empty">No active notifications or alerts.</div>';
      return;
    }

    let html = '';
    alerts.forEach(item => {
      html += `<div class="notif-item ${item.type}" data-view="${item.targetView}" data-search="${item.searchQuery}">
        <div class="notif-icon">
          ${item.type === 'danger' ? '✖' : item.type === 'warning' ? '⚠' : '✓'}
        </div>
        <div class="notif-content">
          <div class="notif-text">${item.text}</div>
          <div class="notif-time">${item.time}</div>
        </div>
      </div>`;
    });

    container.innerHTML = html;

    // Bind clicks to notif item
    container.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', () => {
        const view = el.getAttribute('data-view');
        const query = el.getAttribute('data-search');
        document.getElementById('notification-dropdown').classList.remove('active');
        this.navigateTo(view);

        if (view === 'inventory') {
          setTimeout(() => {
            const inp = document.getElementById('inv-table-search');
            if (inp) {
              inp.value = query;
              inp.dispatchEvent(new Event('input'));
            }
          }, 100);
        } else if (view === 'transfers') {
          setTimeout(() => {
            const toBtn = document.querySelector(`[data-to-view="${query}"]`);
            if (toBtn) toBtn.click();
          }, 100);
        } else if (view === 'branch-receiver') {
          setTimeout(() => {
            const toBtn = document.querySelector(`[data-to-received-view="${query}"]`);
            if (toBtn) toBtn.click();
          }, 100);
        }
      });
    });
  },

};

// Start application when DOM loads
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
