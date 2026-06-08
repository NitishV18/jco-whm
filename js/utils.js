// UI and DOM Utility Helpers for MyWarehouseManager®

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '✓';
  if (type === 'error') icon = '✖';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    const closeButtons = modal.querySelectorAll('.modal-close-btn, .modal-cancel');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(modalId);
      }, { once: true });
    });
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    const form = modal.querySelector('form');
    if (form) {
      form.reset();
      form.querySelectorAll('.form-group').forEach(grp => {
        grp.classList.remove('has-error');
      });
    }
  }
}
