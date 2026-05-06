/** 
 * Services.js - পাথরঘাটা ডিজিটাল
 * এখানে ডিরেক্টরি, রক্তদান, অভিযোগ বক্স এবং ডাইনামিক সার্ভিস ক্যাটাগরি লজিক রয়েছে।
 */

// --- ১. সার্ভিস ক্যাটাগরি গ্রিড লোড করা ---
window.loadServiceCategories = () => {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    window.fb.get(window.fb.ref(window.db, 'services/categories')).then((snap) => {
        const categories = {
            ...window.APP_CONFIG.services,
            ...(snap.val() || {})
        };
        grid.innerHTML = Object.entries(categories).map(([key, cat]) => {
            let onclick;
            if (['directory', 'blood', 'complaints', 'market', 'emergency', 'transport'].includes(key)) {
                if (key === 'transport') {
                    onclick = `window.switchPage('${key}'); window.loadTransportBanners();`;
                } else {
                    onclick = `window.switchPage('${key}')`;
                }
            } else if (key === 'birth_reg') {
                onclick = `window.open('https://bdris.gov.bd/', '_blank')`;
            } else if (key === 'tin_cert') {
                onclick = `window.open('https://secure.incometax.gov.bd/TINHome', '_blank')`;
            } else if (key === 'result') {
                onclick = `window.open('https://eboardresults.com/v2/home', '_blank')`;
            } else if (key === 'agriculture') {
                onclick = `window.openDirectoryCategory('agriculture', '${cat.title}')`;
            } else {
                onclick = `window.openDynamicCategory('${key}', '${cat.title}')`;
            }

            return `<div onclick="${onclick}" class="cursor-pointer group transform active:scale-95 transition bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md aspect-[4/3]">
                <div class="w-14 h-14 ${cat.bg} ${cat.color} rounded-full flex items-center justify-center mb-2">
                    <i class="fa-solid ${cat.icon} text-2xl"></i>
                </div>
                <p class="text-base font-bold text-gray-700 text-center">${cat.title}</p>
            </div>`;
        }).join('');
    });
};

// --- ২. ডাইনামিক ক্যাটাগরি (ইতিহাস, পর্যটন ইত্যাদি) ---
window.openDynamicCategory = (catId, title) => {
    window.switchPage('dynamic-content');
    document.getElementById('dynamic-content-title').innerText = title;
    const container = document.getElementById('dynamic-items-container');
    container.innerHTML = '<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';
    
    window.fb.get(window.fb.ref(window.db, `services/data/${catId}`)).then((snap) => {
        const items = snap.val() || {};
        container.innerHTML = Object.keys(items).length > 0 ? Object.values(items).map(item => {
            const imgHtml = item.image ? `<div class="h-32 bg-gray-200 rounded-t-xl overflow-hidden"><img src="${item.image}" class="w-full h-full object-cover"></div>` : '';
            const actionBtn = item.phone ? `<a href="tel:${item.phone}" class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow hover:bg-green-600 transition"><i class="fa-solid fa-phone"></i></a>` : '';
            return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
                ${imgHtml}
                <div class="p-4 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">${window.escapeHTML(item.title)}</h3>
                        <p class="text-sm text-gray-500 mt-1">${window.escapeHTML(item.details || '')}</p>
                    </div>
                    ${actionBtn}
                </div>
            </div>`;
        }).join('') : `<div class="text-center py-10"><p class="text-gray-400">তথ্য যুক্ত করা হয়নি</p></div>`;
    });
};

// --- ৩. প্রশাসনিক ডিরেক্টরি লজিক ---
window.openDirectoryCategory = (category, title) => {
    window.switchPage('directory-list');
    document.getElementById('directory-list-title').innerText = title;
    const container = document.getElementById('directory-items-container');
    container.innerHTML = '<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';
    
    window.fb.onValue(window.fb.ref(window.db, `directory/${category}`), (snap) => {
        const data = snap.val() || {};
        container.innerHTML = Object.keys(data).length > 0 ? Object.values(data).map(item =>
            `<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-3">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-50 rounded-full text-blue-600 flex items-center justify-center text-xl"><i class="fa-solid fa-user-tie"></i></div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-lg">${window.escapeHTML(item.name)}</h4>
                        <p class="text-sm text-gray-500">${window.escapeHTML(item.details) || title}</p>
                        <p class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-location-dot"></i> ${window.escapeHTML(item.address) || 'ঠিকানা নেই'}</p>
                    </div>
                </div>
                <a href="tel:${item.phone}" class="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow"><i class="fa-solid fa-phone"></i></a>
            </div>`
        ).join('') : `<div class="text-center py-10"><p class="text-gray-400">তালিকায় কোনো নম্বর নেই</p></div>`;
    });
};

// --- ৪. রক্তদান (Blood Donation) লজিক ---
window.submitDonor = () => {
    const bloodGroup = document.getElementById('donor-blood-group').value;
    if (!bloodGroup) return window.showToast("রক্তের গ্রুপ দিন", 'error');
    
    window.fb.set(window.fb.ref(window.db, 'donors/' + window.currentUser.uid), {
        name: window.userDetails.name,
        bloodGroup,
        phone: document.getElementById('donor-phone').value,
        lastDate: document.getElementById('donor-last-date').value,
        uid: window.currentUser.uid,
        union: window.userDetails.union || '',
        village: window.userDetails.village || ''
    }).then(() => {
        window.showToast("ডোনার তালিকায় যুক্ত হয়েছেন!");
        window.toggleDonorModal(false);
    });
};

window.filterDonors = () => {
    const bgFilter = document.getElementById('blood-filter').value;
    const unionFilter = document.getElementById('blood-union-filter').value;
    const container = document.getElementById('donor-list');

    window.fb.onValue(window.fb.ref(window.db, 'donors'), (snapshot) => {
        const allDonors = Object.values(snapshot.val() || {});
        const filtered = allDonors.filter(d => (bgFilter === 'all' || d.bloodGroup === bgFilter) && (unionFilter === 'all' || d.union === unionFilter));
        
        container.innerHTML = filtered.length > 0 ? filtered.map(donor => 
            `<div class="bg-white p-4 rounded-xl shadow-sm border border-red-50 flex justify-between items-center mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">${donor.bloodGroup}</div>
                    <div>
                        <p class="font-bold text-gray-800">${window.escapeHTML(donor.name)}</p>
                        <p class="text-[10px] text-gray-500">${window.escapeHTML(donor.union)}</p>
                    </div>
                </div>
                <a href="tel:${donor.phone}" class="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center"><i class="fa-solid fa-phone"></i></a>
            </div>`
        ).join('') : '<p class="text-center text-gray-400">ডোনার পাওয়া যায়নি</p>';
    });
};

// --- ৫. অভিযোগ বক্স (Complaint Box) লজিক ---
window.submitComplaint = () => {
    const text = document.getElementById('complaint-text').value.trim();
    if (!text) return window.showToast("অভিযোগের বিস্তারিত লিখুন", 'error');

    window.fb.push(window.fb.ref(window.db, 'complaints'), {
        uid: window.currentUser.uid,
        authorName: document.getElementById('complaint-anon').checked ? "নাম প্রকাশে অনিচ্ছুক" : window.userDetails.name,
        type: document.getElementById('complaint-type').value,
        submitTo: document.getElementById('complaint-to').value,
        text,
        timestamp: Date.now(),
        status: 'Pending',
        union: window.userDetails.union || 'Unknown'
    }).then(() => {
        window.showToast("অভিযোগ জমা হয়েছে!");
        document.getElementById('complaint-text').value = "";
    });
};

window.loadMyComplaints = () => {
    window.fb.onValue(window.fb.query(window.fb.ref(window.db, 'complaints'), window.fb.orderByChild('uid'), window.fb.equalTo(window.currentUser.uid)), (snap) => {
        const data = Object.values(snap.val() || {}).sort((a, b) => b.timestamp - a.timestamp);
        document.getElementById('my-complaints-list').innerHTML = data.length > 0 ? data.map(c => 
            `<div class="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-2">
                <div class="flex justify-between items-start">
                    <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">To: ${c.submitTo}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">${c.status}</span>
                </div>
                <p class="text-sm text-gray-800 mt-2">${window.escapeHTML(c.text)}</p>
            </div>`
        ).join('') : '<p class="text-center text-gray-400">কোনো অভিযোগ নেই</p>';
    });
};
