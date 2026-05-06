/** 
 * UI.js - পাথরঘাটা ডিজিটাল
 * এখানে অ্যাপের সাধারণ নেভিগেশন, ট্যাব পরিবর্তন, টোস্ট এবং সাইডবার লজিক রয়েছে।
 */

// --- ১. হেল্পার ফাংশনসমূহ ---

// HTML এস্কেপ করা (নিরাপত্তার জন্য)
window.escapeHTML = (str) => {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

// পাসওয়ার্ড দেখা বা লুকানো
window.togglePassword = (id, icon) => {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// সময় গণনা (Time Ago লজিক)
window.timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "এইমাত্র";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + " মিনিট আগে";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + " ঘণ্টা আগে";
    const days = Math.floor(hours / 24);
    if (days < 30) return days + " দিন আগে";
    const months = Math.floor(days / 30);
    if (months < 12) return months + " মাস আগে";
    return Math.floor(months / 12) + " বছর আগে";
};

// ইউজারের ভেরিফিকেশন ব্যাজ চেক
window.checkUserBadge = (user) => {
    if (!user) return "";
    const role = user.role ? user.role.toLowerCase() : '';
    if (role === 'journalist') return `<i class="fa-solid fa-feather-pointed journalist-badge"></i>`;
    if (user.isVerified || ['chairman', 'member', 'admin', 'doctor', 'uno', 'oc'].includes(role)) return `<i class="fa-solid fa-circle-check verified-badge"></i>`;
    return "";
};

// --- ২. টোস্ট নোটিফিকেশন ---
window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    container.innerHTML = ''; // আগের টোস্ট ক্লিয়ার করা

    const toast = document.createElement('div');
    toast.className = 'toast flex items-center justify-center gap-2';
    
    const icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
    toast.innerHTML = `${icon} <span>${msg}</span>`;

    toast.style.borderLeft = type === 'error' ? "4px solid #ef4444" : "4px solid #22c55e";
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300);
    }, 3000);
};

// --- ৩. নেভিগেশন ও ট্যাব লজিক ---

// অথেন্টিকেশন ফর্ম সুইচিং
window.toggleAuth = (v) => {
    ['login-form', 'register-form', 'forgot-form'].forEach(id => document.getElementById(id).classList.add('hidden-custom'));
    document.getElementById(v + '-form')?.classList.remove('hidden-custom');
};

// হিস্ট্রি সহ মডাল ওপেন
window.openModalWithHistory = (id, hash) => {
    document.getElementById(id).classList.remove('hidden-custom');
    history.pushState({ modal: id }, null, hash);
};

// সাইডবার ওপেন/ক্লোজ
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

// FAB (Floating Action Button) টগল
let fabOpen = false;
window.toggleFab = () => {
    fabOpen = !fabOpen;
    document.getElementById('fab-options').classList.toggle('show');
    document.getElementById('main-fab').classList.toggle('rotate');
};

// মেইন পেজ সুইচিং লজিক
window.switchPage = (id, addHistory = true) => {
    document.querySelectorAll('.post-menu-dropdown').forEach(el => el.classList.add('hidden'));

    // সব পেজ এবং নেভ বাটন রিসেট করা
    const pages = ['home', 'services', 'market', 'blood', 'emergency', 'directory', 'directory-list', 'profile', 'people', 'messages', 'notifications', 'view-profile', 'friends-list', 'complaints', 'settings', 'dynamic-content', 'monetization', 'verification', 'invite', 'transport', 'rent-a-car', 'bus'];
    
    pages.forEach(p => {
        document.getElementById('page-' + p)?.classList.add('hidden');
        const btn = document.getElementById('btn-' + p);
        if (btn) {
            btn.classList.replace('nav-active', 'text-gray-500');
            btn.classList.remove('text-green-600');
        }
    });

    // টার্গেট পেজ দেখানো
    document.getElementById('page-' + id)?.classList.remove('hidden');

    // নেভ বাটন স্টাইল আপডেট
    const activeBtn = document.getElementById('btn-' + id);
    if (activeBtn) {
        activeBtn.classList.add('nav-active', 'text-green-600');
        activeBtn.classList.remove('text-gray-500');
    }

    window.scrollTo(0, 0);

    // স্পেসিফিক পেজ লোডিং লজিক (ইভেন্ট ফায়ার করা যাতে অন্য ফাইল কাজ করতে পারে)
    if (addHistory) history.pushState({ page: id }, "", `#${id}`);

    // FAB ভিজিবিলিটি
    const fabContainer = document.getElementById('fab-container');
    if (fabContainer) {
        if (id === 'home') fabContainer.classList.remove('hidden-custom');
        else fabContainer.classList.add('hidden-custom');
    }
};

// হোম বাটনে ক্লিক লজিক (স্ক্রল টপ ও রিফ্রেশ)
window.handleHomeClick = () => {
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn.classList.contains('nav-active')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.loadFeed) window.loadFeed('all', true);
    } else {
        window.switchPage('home');
    }
};

// ফন্ট সাইজ পরিবর্তন
window.changeFontSize = (size) => {
    const body = document.getElementById('body-main');
    body.classList.remove('text-small', 'text-large');
    if (size !== 'normal') body.classList.add('text-' + size);
    localStorage.setItem('fontSize', size);
};

// --- ৪. পপ-স্টেট ম্যানেজমেন্ট (ব্যাক বাটন হ্যান্ডলিং) ---
window.onpopstate = function(event) {
    // সব মডাল আইডি যেগুলো খোলা থাকতে পারে
    const modalIds = ['post-modal', 'poll-modal', 'donor-modal', 'modal-blood-request', 'emergency-modal', 'sell-modal', 'edit-profile-modal', 'account-details-modal', 'tag-friends-modal', 'feeling-modal', 'single-post-modal', 'note-modal', 'contest-upload-modal', 'contest-rules-modal'];

    let anyModalClosed = false;
    modalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden-custom')) {
            el.classList.add('hidden-custom');
            anyModalClosed = true;
        }
    });

    if (anyModalClosed) return;

    if (document.getElementById('search-modal').classList.contains('open')) {
        window.toggleGlobalSearch(false);
        return;
    }

    if (event.state?.page) {
        window.switchPage(event.state.page, false);
    } else {
        window.switchPage('home', false);
    }
};
