// Dashboard View Controller for MyWarehouseManager®

const Dashboard = {
  init() {
    this.renderMetrics();
    this.renderCategoriesDistribution();
    this.renderActivityFeed();
  },

  renderMetrics() {
    const products = Store.getProducts();
    const transfers = Store.getTransfers();
    const packages = Store.getPackages();

    // 1. Total stock units sum
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    document.getElementById('metric-total-stock').innerText = `${totalStock.toLocaleString()} units`;

    // 2. Total inventory value sum
    const totalValue = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
    document.getElementById('metric-total-val').innerText = `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 3. Low stock alerts count
    const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;
    const lowStockEl = document.getElementById('metric-low-stock');
    lowStockEl.innerText = `${lowStockCount} Item${lowStockCount !== 1 ? 's' : ''}`;
    if (lowStockCount > 0) {
      lowStockEl.closest('.metric-card').style.borderColor = 'var(--warning)';
    } else {
      lowStockEl.closest('.metric-card').style.borderColor = 'var(--border-color)';
    }

    // 4. Pending transfers count
    const pendingTransfers = transfers.filter(t => t.status === 'Pending').length;
    document.getElementById('metric-pending-transfers').innerText = `${pendingTransfers} Order${pendingTransfers !== 1 ? 's' : ''}`;

    // 5. Packages received today count
    const todayStr = new Date().toISOString().split('T')[0];
    const receivedTodayCount = packages.filter(p => p.date.startsWith(todayStr)).length;
    document.getElementById('metric-received-today').innerText = `${receivedTodayCount} pkg${receivedTodayCount !== 1 ? 's' : ''}`;
  },

  renderCategoriesDistribution() {
    const products = Store.getProducts();
    const container = document.getElementById('dashboard-categories-distribution');
    if (!container) return;

    // Collate stock volumes per category
    const categories = ['Shampoo', 'Hair Color', 'Styling', 'Conditioner', 'Treatment'];
    const distribution = {};
    categories.forEach(c => distribution[c] = 0);

    let overallStock = 0;
    products.forEach(p => {
      if (categories.includes(p.category)) {
        distribution[p.category] += p.stock;
        overallStock += p.stock;
      }
    });

    if (overallStock === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--gray-400); font-size: 0.85rem; padding: 24px 0;">No active stock in warehouse to distribute.</div>';
      return;
    }

    let html = '';
    const colorClasses = {
      'Shampoo': 'var(--accent)',
      'Hair Color': 'var(--success)',
      'Styling': 'var(--warning)',
      'Conditioner': 'var(--danger)',
      'Treatment': '#8B5CF6' // violet
    };

    categories.forEach(cat => {
      const stock = distribution[cat];
      const percent = overallStock > 0 ? Math.round((stock / overallStock) * 100) : 0;
      const barColor = colorClasses[cat] || 'var(--gray-400)';

      html += `<div class="progress-item">
        <div class="progress-info">
          <span style="font-weight:600;">${cat}</span>
          <span style="color:var(--gray-500); font-weight:500;">${stock} units (${percent}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${percent}%; background-color: ${barColor};"></div>
        </div>
      </div>`;
    });

    container.innerHTML = html;
  },

  renderActivityFeed() {
    const container = document.getElementById('dashboard-activity-feed');
    if (!container) return;

    const logs = Store.getActivityLog().slice(0, 10); // show top 10 activities

    if (logs.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--gray-400); font-size: 0.85rem; padding: 24px 0;">No activities logged yet.</div>';
      return;
    }

    let html = '';
    logs.forEach(log => {
      const date = new Date(log.date);
      const relativeTime = this.formatTimeAgo(date);

      html += `<div class="activity-item ${log.type || 'other'}">
        <div class="activity-marker"></div>
        <div class="activity-details">
          <div class="activity-title">${this.escapeHTML(log.action)}</div>
          <div class="activity-meta">By ${this.escapeHTML(log.user)} • ${relativeTime}</div>
        </div>
      </div>`;
    });

    container.innerHTML = html;
  },

  formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
