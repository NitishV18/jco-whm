// Settings and CRUD Directories Controller for MyWarehouseManager®

const Settings = {
  setup() {
    this.setupSupplierModal();
    this.setupBranchModal();
  },

  // ================= 1. SUPPLIERS MANAGEMENT =================
  initSuppliers() {
    this.renderSuppliers();
  },

  renderSuppliers() {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return;

    const suppliers = Store.getSuppliers();

    if (suppliers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--gray-400);">No corporate suppliers registered.</td></tr>';
      return;
    }

    let html = '';
    suppliers.forEach(s => {
      html += `<tr>
        <td style="font-weight:600;">${this.escapeHTML(s.name)}</td>
        <td>${this.escapeHTML(s.contactPerson)}</td>
        <td>${this.escapeHTML(s.phone)}</td>
        <td><a href="mailto:${s.email}" style="color:var(--accent); text-decoration:none;">${this.escapeHTML(s.email)}</a></td>
        <td style="font-family:'Outfit',sans-serif; font-size:0.8rem;">${this.escapeHTML(s.gstNumber)}</td>
        <td style="font-size:0.8rem; color:var(--gray-500); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${this.escapeHTML(s.address)}">${this.escapeHTML(s.address)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" data-sup-edit="${s.id}" title="Edit Supplier">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
            </button>
            <button class="btn-icon delete" data-sup-delete="${s.id}" title="Delete Supplier">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>`;
    });

    tbody.innerHTML = html;

    // Hook click actions
    tbody.querySelectorAll('[data-sup-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-sup-edit');
        this.openSupplierModal(id);
      });
    });

    tbody.querySelectorAll('[data-sup-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-sup-delete');
        this.triggerDeleteSupplier(id);
      });
    });
  },

  setupSupplierModal() {
    const addBtn = document.getElementById('sup-add-btn');
    const form = document.getElementById('modal-supplier-form');

    if (addBtn) {
      addBtn.onclick = () => this.openSupplierModal();
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.submitSupplierForm(form);
      };
    }
  },

  openSupplierModal(supplierId = null) {
    const title = document.getElementById('modal-supplier-title');
    const idInput = document.getElementById('modal-supplier-id');
    const nameInput = document.getElementById('modal-supplier-name');
    const contactInput = document.getElementById('modal-supplier-contact');
    const phoneInput = document.getElementById('modal-supplier-phone');
    const emailInput = document.getElementById('modal-supplier-email');
    const gstInput = document.getElementById('modal-supplier-gst');
    const addressInput = document.getElementById('modal-supplier-address');

    if (supplierId) {
      const s = Store.getSuppliers().find(sup => sup.id === supplierId);
      if (!s) return;

      title.innerText = 'Edit Supplier Specifications';
      idInput.value = s.id;
      nameInput.value = s.name;
      contactInput.value = s.contactPerson;
      phoneInput.value = s.phone;
      emailInput.value = s.email;
      gstInput.value = s.gstNumber;
      addressInput.value = s.address;
    } else {
      title.innerText = 'Register New Supplier';
      idInput.value = '';
      nameInput.value = '';
      contactInput.value = '';
      phoneInput.value = '';
      emailInput.value = '';
      gstInput.value = '';
      addressInput.value = '';
    }

    openModal('modal-supplier');
  },

  submitSupplierForm(form) {
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    
    let isValid = true;
    const fields = ['name', 'contact', 'phone', 'email', 'gst', 'address'];
    const data = {};

    fields.forEach(f => {
      const el = document.getElementById(`modal-supplier-${f}`);
      if (!el.value.trim()) {
        el.closest('.form-group').classList.add('has-error');
        isValid = false;
      } else {
        data[f] = el.value.trim();
      }
    });

    // Simple email format check
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      const emailEl = document.getElementById('modal-supplier-email');
      emailEl.closest('.form-group').classList.add('has-error');
      emailEl.nextElementSibling.innerText = 'Please specify a valid corporate email.';
      isValid = false;
    }

    if (isValid) {
      const supObj = {
        name: data.name,
        contactPerson: data.contact,
        phone: data.phone,
        email: data.email,
        gstNumber: data.gst,
        address: data.address
      };

      const id = document.getElementById('modal-supplier-id').value;
      if (id) {
        supObj.id = id;
        Store.saveSupplier(supObj);
        showToast('Supplier specifications updated successfully!', 'success');
      } else {
        Store.saveSupplier(supObj);
        showToast('Supplier registered successfully!', 'success');
      }

      closeModal('modal-supplier');
      this.renderSuppliers();
    }
  },

  triggerDeleteSupplier(id) {
    const suppliers = Store.getSuppliers();
    const s = suppliers.find(sup => sup.id === id);
    if (!s) return;

    if (confirm(`Are you sure you want to delete supplier "${s.name}"? This will remove them from directory settings.`)) {
      Store.deleteSupplier(id);
      showToast(`Deleted supplier: ${s.name}`, 'warning');
      this.renderSuppliers();
    }
  },

  // ================= 2. BRANCHES MANAGEMENT =================
  initBranches() {
    this.renderBranches();
  },

  renderBranches() {
    const tbody = document.getElementById('branches-table-body');
    if (!tbody) return;

    const branches = Store.getBranches();

    if (branches.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray-400);">No retail branch outlets registered.</td></tr>';
      return;
    }

    let html = '';
    branches.forEach(b => {
      html += `<tr>
        <td style="font-weight:600;">${this.escapeHTML(b.name)}</td>
        <td style="font-size:0.85rem; color:var(--gray-500);">${this.escapeHTML(b.location)}</td>
        <td>${this.escapeHTML(b.managerName)}</td>
        <td style="font-family:'Outfit',sans-serif; font-size:0.85rem;">${this.escapeHTML(b.contactNumber)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" data-branch-edit="${b.id}" title="Edit Branch">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
            </button>
            <button class="btn-icon delete" data-branch-delete="${b.id}" title="Delete Branch">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>`;
    });

    tbody.innerHTML = html;

    // Hook clicks
    tbody.querySelectorAll('[data-branch-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-branch-edit');
        this.openBranchModal(id);
      });
    });

    tbody.querySelectorAll('[data-branch-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-branch-delete');
        this.triggerDeleteBranch(id);
      });
    });
  },

  setupBranchModal() {
    const addBtn = document.getElementById('branch-add-btn');
    const form = document.getElementById('modal-branch-form');

    if (addBtn) {
      addBtn.onclick = () => this.openBranchModal();
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.submitBranchForm(form);
      };
    }
  },

  openBranchModal(branchId = null) {
    const title = document.getElementById('modal-branch-title');
    const idInput = document.getElementById('modal-branch-id');
    const nameInput = document.getElementById('modal-branch-name');
    const locationInput = document.getElementById('modal-branch-location');
    const managerInput = document.getElementById('modal-branch-manager');
    const contactInput = document.getElementById('modal-branch-contact');

    if (branchId) {
      const b = Store.getBranches().find(br => br.id === branchId);
      if (!b) return;

      title.innerText = 'Edit Branch Outlet';
      idInput.value = b.id;
      nameInput.value = b.name;
      locationInput.value = b.location;
      managerInput.value = b.managerName;
      contactInput.value = b.contactNumber;
    } else {
      title.innerText = 'Register New Branch Outlet';
      idInput.value = '';
      nameInput.value = '';
      locationInput.value = '';
      managerInput.value = '';
      contactInput.value = '';
    }

    openModal('modal-branch');
  },

  submitBranchForm(form) {
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

    let isValid = true;
    const fields = ['name', 'location', 'manager', 'contact'];
    const data = {};

    fields.forEach(f => {
      const el = document.getElementById(`modal-branch-${f}`);
      if (!el.value.trim()) {
        el.closest('.form-group').classList.add('has-error');
        isValid = false;
      } else {
        data[f] = el.value.trim();
      }
    });

    if (isValid) {
      const branchObj = {
        name: data.name,
        location: data.location,
        managerName: data.manager,
        contactNumber: data.contact
      };

      const id = document.getElementById('modal-branch-id').value;
      if (id) {
        branchObj.id = id;
        Store.saveBranch(branchObj);
        showToast('Branch details updated successfully!', 'success');
      } else {
        Store.saveBranch(branchObj);
        showToast('New Branch outlet registered!', 'success');
      }

      closeModal('modal-branch');
      this.renderBranches();
    }
  },

  triggerDeleteBranch(id) {
    const branches = Store.getBranches();
    const b = branches.find(br => br.id === id);
    if (!b) return;

    if (confirm(`Are you sure you want to delete branch outlet "${b.name}"? This removes them from registry settings.`)) {
      Store.deleteBranch(id);
      showToast(`Deleted branch outlet: ${b.name}`, 'warning');
      this.renderBranches();
    }
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
