/** 
 * UI.js - পাথরঘাটা ডিজিটাল 
 * সব ডিজাইন এবং নেভিগেশন কন্ট্রোল এখানে থাকবে।
 **/

// ১. টোস্ট নোটিফিকেশন সিস্টেম
window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    container.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast flex items-center justify-center gap-2';
    const icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
    toast.innerHTML = `${icon} <span>${msg}</span>`;
    toast.style.borderLeft = type === 'error' ? "4px solid #ef4444" : "4px solid #22c55e";
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
};

// ২. ইউজার ব্যাজ চেক (ভেরিফাইড/সাংবাদিক) - এটি আপনার এরর ফিক্স করবে
window.checkUserBadge = (user) => {
    if (!user) return "";
    const role = user.role ? user.role.toLowerCase() : '';
    if (role === 'journalist') return `<i class="fa-solid fa-feather-pointed journalist-badge"></i>`;
    if (user.isVerified || ['chairman', 'member', 'admin', 'doctor', 'uno', 'oc'].includes(role)) {
        return `<i class="fa-solid fa-circle-check verified-badge"></i>`;
    }
    return "";
};

// ৩. পেজ নেভিগেশন কন্ট্রোল
window.switchPage = (id, addHistory = true) => {
    // পোস্ট মেনু ড্রপডাউন বন্ধ করা
    document.querySelectorAll('.post-menu-dropdown').forEach(el => el.classList.add('hidden'));

    const pages = ['home', 'services', 'market', 'blood', 'emergency', 'directory', 'directory-list', 'profile', 'people', 'messages', 'notifications', 'view-profile', 'friends-list', 'complaints', 'settings', 'dynamic-content', 'monetization', 'verification', 'invite', 'transport', 'rent-a-car', 'bus'];
    
    pages.forEach(p => {
        document.getElementById('page-' + p)?.classList.add('hidden');
        document.getElementById('btn-' + p)?.classList.replace('nav-active', 'text-gray-500');
        document.getElementById('btn-' + p)?.classList.remove('text-green-600');
    });

    const targetPage = document.getElementById('page-' + id);
    if (targetPage) targetPage.classList.remove('hidden');

    const btn = document.getElementById('btn-' + id);
    if (btn) {
        btn.classList.add('nav-active', 'text-green-600');
        btn.classList.remove('text-gray-500');
    }

    window.scrollTo(0, 0);

    // FAB (Floating Action Button) কন্ট্রোল
    const fabContainer = document.getElementById('fab-container');
    if (fabContainer) {
        id === 'home' ? fabContainer.classList.remove('hidden-custom') : fabContainer.classList.add('hidden-custom');
    }

    if (addHistory) history.pushState({ page: id }, "", `#${id}`);
};

// ৪. হোম বাটন ক্লিক (টপ স্ক্রল ও রিফ্রেশ)
window.handleHomeClick = () => {
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn.classList.contains('nav-active')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        switchPage('home');
    }
};

// ৫. মডাল এবং সাইডবার কন্ট্রোল
window.toggleSidebar = (open) => {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (open) {
        sb.classList.add('open');
        ov.classList.remove('hidden-custom');
        setTimeout(() => ov.classList.add('open'), 10);
    } else {
        sb.classList.remove('open');
        ov.classList.remove('open');
        setTimeout(() => ov.classList.add('hidden-custom'), 300);
    }
};

window.openModalWithHistory = (id, hash) => {
    document.getElementById(id).classList.remove('hidden-custom');
    history.pushState({ modal: id }, null, hash);
};

// ৬. স্পেসিফিক মডাল টগল ফাংশনসমূহ
window.toggleAuth = (v) => {
    ['login-form', 'register-form', 'forgot-form'].forEach(id => document.getElementById(id).classList.add('hidden-custom'));
    document.getElementById(v + '-form')?.classList.remove('hidden-custom');
};

window.togglePostModal = (s) => s ? openModalWithHistory('post-modal', "#create-post") : (document.getElementById('post-modal').classList.add('hidden-custom'), history.state?.modal === 'post-modal' && history.back());
window.togglePollModal = (s) => s ? openModalWithHistory('poll-modal', "#create-poll") : (document.getElementById('poll-modal').classList.add('hidden-custom'), history.state?.modal === 'poll-modal' && history.back());
window.toggleDonorModal = (s) => s ? openModalWithHistory('donor-modal', "#donor-reg") : (document.getElementById('donor-modal').classList.add('hidden-custom'), history.state?.modal === 'donor-modal' && history.back());
window.toggleBloodRequestModal = (s) => s ? openModalWithHistory('modal-blood-request', "#blood-req") : (document.getElementById('modal-blood-request').classList.add('hidden-custom'), history.state?.modal === 'modal-blood-request' && history.back());
window.toggleEditProfile = (s) => s ? openModalWithHistory('edit-profile-modal', "#edit-profile") : (document.getElementById('edit-profile-modal').classList.add('hidden-custom'), history.state?.modal === 'edit-profile-modal' && history.back());
window.toggleSellModal = (s) => s ? openModalWithHistory('sell-modal', "#sell-item") : (document.getElementById('sell-modal').classList.add('hidden-custom'), history.state?.modal === 'sell-modal' && history.back());

// ৭. অন্যান্য UI হেল্পার
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

let fabOpen = false;
window.toggleFab = () => {
    fabOpen = !fabOpen;
    document.getElementById('fab-options').classList.toggle('show');
    document.getElementById('main-fab').classList.toggle('rotate');
};

// ৮. ব্যাক বাটন হ্যান্ডলার (Browser Back Button)
window.onpopstate = function(event) {
    // সব মডাল চেক করে বন্ধ করা
    const modals = ['post-modal', 'poll-modal', 'donor-modal', 'modal-blood-request', 'emergency-modal', 'sell-modal', 'edit-profile-modal', 'tag-friends-modal', 'feeling-modal', 'single-post-modal'];
    modals.forEach(m => document.getElementById(m)?.classList.add('hidden-custom'));
    
    if (event.state?.page) {
        switchPage(event.state.page, false);
    } else {
        switchPage('home', false);
    }
};
