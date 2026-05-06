/** 
 * Emergency.js - পাথরঘাটা ডিজিটাল
 * এখানে জরুরী এলার্ট, নোটিফিকেশন লিস্ট, ব্যাজ আপডেট এবং লাইভ নোটিশ লজিক রয়েছে।
 */

// --- ১. নোটিফিকেশন ব্যাজ লজিক (হেডারের লাল ডট) ---
window.listenForNotificationBadge = (uid) => {
    const badge = document.getElementById('header-badge-notice');
    if (!badge) return;

    // আনরিড নোটিফিকেশন কুয়েরি
    const notifRef = window.fb.query(
        window.fb.ref(window.db, `notifications/${uid}`), 
        window.fb.orderByChild('read'), 
        window.fb.equalTo(false)
    );

    window.fb.onValue(notifRef, (snap) => {
        const count = snap.exists() ? Object.keys(snap.val()).length : 0;
        badge.innerText = count;
        badge.classList.toggle('active', count > 0);
    });
};

// --- ২. নোটিফিকেশন পেজ লোডার (Pagination সহ) ---
window.lastNotifKey = null;
window.hasMoreNotifs = true;

window.loadNotifications = (isInitial = false) => {
    const list = document.getElementById('notifications-list');
    const btn = document.getElementById('btn-load-more-notif');
    if (!list || !window.currentUser) return;

    if (isInitial) {
        list.innerHTML = '<div class="flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>';
        window.lastNotifKey = null;
        window.hasMoreNotifs = true;
    }

    const pageSize = 10;
    let notifQuery;
    const dbRef = window.fb.ref(window.db, `notifications/${window.currentUser.uid}`);

    if (isInitial) {
        notifQuery = window.fb.query(dbRef, window.fb.orderByKey(), window.fb.limitToLast(pageSize));
    } else {
        notifQuery = window.fb.query(dbRef, window.fb.orderByKey(), window.fb.endAt(window.lastNotifKey), window.fb.limitToLast(pageSize + 1));
    }

    window.fb.get(notifQuery).then(snap => {
        const data = snap.val();
        if (isInitial) list.innerHTML = '';
        
        if (!data) {
            if (isInitial) list.innerHTML = '<p class="text-center text-gray-400 mt-10">কোনো নোটিফিকেশন নেই</p>';
            window.hasMoreNotifs = false;
            if (btn) btn.classList.add('hidden');
            return;
        }

        let items = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        items.sort((a, b) => b.timestamp - a.timestamp); // নতুন আগে

        if (!isInitial) items = items.filter(i => i.id !== window.lastNotifKey);
        if (items.length > 0) window.lastNotifKey = items[items.length - 1].id;
        if (items.length < pageSize) window.hasMoreNotifs = false;

        items.forEach(n => {
            const bgClass = n.read ? 'bg-white' : 'bg-blue-50';
            let html = '';
            
            // ব্লাড রিকোয়েস্ট নোটিফিকেশন স্পেশাল টেমপ্লেট
            if (n.type === 'blood_req') {
                html = `
                <div class="${bgClass} p-3 rounded-xl shadow-sm border-l-4 border-red-600 flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                            <i class="fa-solid fa-droplet"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-red-800 text-sm">জরুরি রক্ত প্রয়োজন! (${window.escapeHTML(n.group)})</h4>
                            <p class="text-xs text-gray-600">স্থান: ${window.escapeHTML(n.location || 'উল্লিখিত নেই')}</p>
                            <p class="text-[10px] text-gray-400">${window.timeAgo(n.timestamp)}</p>
                        </div>
                    </div>
                    <a href="tel:${n.contact}" class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white"><i class="fa-solid fa-phone"></i></a>
                </div>`;
            } else {
                // সাধারণ নোটিফিকেশন (লাইক, কমেন্ট, পোস্ট)
                let icon = 'fa-bell', color = 'text-blue-600', text = 'একটি নতুন আপডেট আছে';
                if (n.type === 'like') { icon = 'fa-thumbs-up'; color = 'text-green-600'; text = 'আপনার পোস্টে লাইক দিয়েছেন'; }
                if (n.type === 'comment') { icon = 'fa-comment'; color = 'text-purple-600'; text = 'আপনার পোস্টে কমেন্ট করেছেন'; }
                if (n.type === 'new_post') { icon = 'fa-rss'; color = 'text-orange-600'; text = 'একটি নতুন পোস্ট শেয়ার করেছেন'; }

                html = `
                <div class="${bgClass} p-3 rounded-xl shadow-sm border-l-4 border-blue-400 flex items-center gap-3 mb-3 cursor-pointer" onclick="handleNotificationClick('${n.id}', '${n.postId}', '${n.type}')">
                    <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center ${color} font-bold">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm">${window.escapeHTML(n.fromName)}</h4>
                        <p class="text-xs text-gray-500">${text}</p>
                        <p class="text-[10px] text-gray-400">${window.timeAgo(n.timestamp)}</p>
                    </div>
                </div>`;
            }
            list.insertAdjacentHTML('beforeend', html);
        });

        if (btn) btn.classList.toggle('hidden', !window.hasMoreNotifs);
    });
};

// নোটিফিকেশনে ক্লিক করলে একশন
window.handleNotificationClick = (notifId, postId, type) => {
    // মার্ক এজ রিড
    window.fb.update(window.fb.ref(window.db, `notifications/${window.currentUser.uid}/${notifId}`), { read: true });
    // পোস্ট মডাল ওপেন
    if (postId && postId !== 'undefined') window.openSinglePostModal(postId);
};

// --- ৩. জরুরী এলার্ট (Emergency Alerts) লজিক ---
window.submitEmergencyAlert = () => {
    const type = document.getElementById('emergency-type').value;
    const title = document.getElementById('emergency-title').value.trim();
    const desc = document.getElementById('emergency-desc').value.trim();
    const contact = document.getElementById('emergency-contact').value.trim();

    if (!title || !desc) return window.showToast("শিরোনাম ও বিস্তারিত লিখুন", "error");

    const alertData = {
        uid: window.currentUser.uid,
        authorName: window.userDetails.name,
        type, title, desc, contact,
        timestamp: Date.now()
    };

    window.fb.push(window.fb.ref(window.db, 'emergency_alerts'), alertData).then(() => {
        window.showToast("জরুরী এলার্টটি পোস্ট করা হয়েছে", "success");
        document.getElementById('emergency-modal').classList.add('hidden-custom');
        // ফর্ম ক্লিয়ার
        document.getElementById('emergency-title').value = "";
        document.getElementById('emergency-desc').value = "";
    });
};

window.loadEmergencyAlerts = () => {
    const list = document.getElementById('emergency-list');
    if (!list) return;

    window.fb.onValue(window.fb.query(window.fb.ref(window.db, 'emergency_alerts'), window.fb.limitToLast(20)), (snap) => {
        const data = snap.val();
        if (!data) {
            list.innerHTML = '<p class="text-center text-gray-400 py-10">কোনো এলার্ট নেই</p>';
            return;
        }
        const alerts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        list.innerHTML = alerts.map(alert => {
            let colorClass = "bg-red-100 text-red-800";
            if (alert.type === 'Lost') colorClass = "bg-orange-100 text-orange-800";
            if (alert.type === 'Found') colorClass = "bg-green-100 text-green-800";

            return `
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold px-2 py-0.5 rounded ${colorClass}">${alert.type}</span>
                    <span class="text-[10px] text-gray-400">${window.timeAgo(alert.timestamp)}</span>
                </div>
                <h3 class="font-bold text-gray-800 text-base mb-1">${window.escapeHTML(alert.title)}</h3>
                <p class="text-sm text-gray-600 mb-2">${window.escapeHTML(alert.desc)}</p>
                <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <span class="text-xs text-gray-500 font-bold"><i class="fa-solid fa-user mr-1"></i> ${window.escapeHTML(alert.authorName)}</span>
                    ${alert.contact ? `<a href="tel:${alert.contact}" class="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"><i class="fa-solid fa-phone"></i> কল করুন</a>` : ''}
                </div>
            </div>`;
        }).join('');
    });
};

// --- ৪. লাইভ নোটিশ (Home Scrolling Notice) ---
window.fb.onValue(window.fb.ref(window.db, 'notices'), (snapshot) => {
    const data = snapshot.val();
    const noticeDiv = document.getElementById('live-notices');
    if (data && noticeDiv) {
        const notice = Object.values(data).pop(); // সর্বশেষ নোটিশ
        noticeDiv.innerHTML = `
        <div class="bg-orange-50 p-4 m-3 rounded-xl border-l-4 border-orange-500 flex items-start gap-3 shadow-sm animate-pulse">
            <i class="fa-solid fa-bullhorn text-orange-600 mt-1"></i>
            <div>
                <h3 class="font-bold text-orange-900 text-sm">${window.escapeHTML(notice.title)}</h3>
                <p class="text-xs text-orange-800 line-clamp-2 mt-1">${window.escapeHTML(notice.description)}</p>
            </div>
        </div>`;
    }
});

// --- ৫. জরুরি রক্তের রিকোয়েস্ট ব্রডকাস্ট ---
window.sendEmergencyBloodRequest = () => {
    const group = document.getElementById('req-blood-group').value;
    const contact = document.getElementById('req-contact').value.trim();
    const location = document.getElementById('req-location').value.trim();

    if (!group || !contact) return window.showToast("গ্রুপ এবং মোবাইল নম্বর দিন", 'error');

    window.fb.get(window.fb.ref(window.db, 'donors')).then((snapshot) => {
        const donors = Object.values(snapshot.val() || {}).filter(d => d.bloodGroup === group);
        
        donors.forEach(d => {
            window.fb.push(window.fb.ref(window.db, `notifications/${d.uid}`), {
                type: 'blood_req',
                group, contact, location,
                timestamp: Date.now(),
                read: false
            });
        });

        window.showToast(`${donors.length} জন ডোনারকে এলার্ট পাঠানো হয়েছে!`);
        window.toggleBloodRequestModal(false);
    });
};
