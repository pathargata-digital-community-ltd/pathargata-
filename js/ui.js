/** UI.js - পাথরঘাটা ডিজিটাল **/

window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    if(!container) return alert(msg);
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-2xl mb-3 text-white transition-all duration-300 flex items-center gap-3 animate-fade-in`;
    toast.style.background = type === 'error' ? "#ef4444" : "#22c55e";
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.toggleAuth = (v) => {
    ['login-form', 'register-form', 'forgot-form'].forEach(id => document.getElementById(id)?.classList.add('hidden-custom'));
    document.getElementById(v + '-form')?.classList.remove('hidden-custom');
};

window.toggleSidebar = (open) => {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (open) {
        sb.classList.remove('-translate-x-full');
        ov.classList.remove('hidden-custom');
    } else {
        sb.classList.add('-translate-x-full');
        ov.classList.add('hidden-custom');
    }
};

window.switchPage = (id, addHistory = true) => {
    const pages = ['home', 'services', 'messages', 'people', 'profile', 'notifications', 'settings', 'monetization', 'market'];
    pages.forEach(p => {
        document.getElementById('page-' + p)?.classList.add('hidden');
        document.getElementById('btn-' + p)?.classList.remove('nav-active', 'text-green-600');
    });

    const targetPage = document.getElementById('page-' + id);
    if(targetPage) targetPage.classList.remove('hidden');
    
    const targetBtn = document.getElementById('btn-' + id);
    if(targetBtn) targetBtn.classList.add('nav-active', 'text-green-600');

    if (addHistory) history.pushState({ page: id }, "", `#${id}`);
};

window.togglePassword = (id, icon) => {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
};
