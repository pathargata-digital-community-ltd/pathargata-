/** 
 * People.js - পাথরঘাটা ডিজিটাল
 * এখানে ইউজার সাজেশন, সার্চ, ফ্রেন্ড রিকোয়েস্ট এবং পুল-টু-রিফ্রেশ লজিক রয়েছে।
 */

// --- গ্লোবাল সাজেশন ভেরিয়েবলস ---
window.suggestionPool = [];
window.displayedUsersCount = 0;
window.lastFetchedKeyForPool = null;
window.isFetchingPool = false;

// --- ১. ইউজার সাজেশন লোডার (Optimized) ---
window.loadUserSuggestions = async (isRefresh = false) => {
    const div = document.getElementById('users-list');
    if (!div) return;

    if (isRefresh) {
        div.innerHTML = '<div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div></div>';
        window.suggestionPool = [];
        window.displayedUsersCount = 0;
        window.lastFetchedKeyForPool = null;
    }

    if (!document.getElementById('search-people').value) {
        await window.fetchUsersFromFirebase();
    }
};

window.fetchUsersFromFirebase = async () => {
    if (window.isFetchingPool) return;
    window.isFetchingPool = true;

    try {
        const FETCH_LIMIT = 40;
        let usersQuery;
        const usersRef = window.fb.ref(window.db, 'users');

        if (window.lastFetchedKeyForPool) {
            usersQuery = window.fb.query(usersRef, window.fb.orderByKey(), window.fb.endAt(window.lastFetchedKeyForPool), window.fb.limitToLast(FETCH_LIMIT + 1));
        } else {
            usersQuery = window.fb.query(usersRef, window.fb.orderByKey(), window.fb.limitToLast(FETCH_LIMIT));
        }

        const snap = await window.fb.get(usersQuery);
        let rawUsers = [];

        if (snap.exists()) {
            snap.forEach(child => {
                if (child.key !== window.lastFetchedKeyForPool) {
                    rawUsers.push({ id: child.key, ...child.val() });
                }
            });
        }

        if (rawUsers.length === 0) {
            window.isFetchingPool = false;
            return;
        }

        window.lastFetchedKeyForPool = rawUsers[0].id;
        rawUsers = rawUsers.sort(() => Math.random() - 0.5); // র‍্যান্ডমাইজেশন

        for (let u of rawUsers) {
            // ফিল্টার: নিজে না হওয়া এবং ইতিমধ্যে ফ্রেন্ড না হওয়া
            if (u.uid === window.currentUser.uid || window.myFriends.includes(u.uid)) continue;
            window.suggestionPool.push(u);
        }

        window.isFetchingPool = false;
        window.maintain20UsersOnScreen();

    } catch (e) {
        console.error("Suggestion Error", e);
        window.isFetchingPool = false;
    }
};

window.maintain20UsersOnScreen = () => {
    const div = document.getElementById('users-list');
    if (window.displayedUsersCount === 0) div.innerHTML = '';

    while (window.displayedUsersCount < 20 && window.suggestionPool.length > 0) {
        let nextUser = window.suggestionPool.shift();
        div.insertAdjacentHTML('beforeend', window.createSuggestionCardHTML(nextUser));
        window.displayedUsersCount++;
        
        setTimeout(() => {
            const card = document.getElementById(`sugg-card-${nextUser.uid}`);
            if (card) card.style.opacity = '1';
        }, 50);
    }
};

window.createSuggestionCardHTML = (u) => {
    const badge = window.checkUserBadge(u);
    let avatar = u.profile_pic ? `<img src="${u.profile_pic}" class="w-12 h-12 rounded-full object-cover">` : `<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">${u.name.charAt(0)}</div>`;
    
    return `
    <div id="sugg-card-${u.uid}" class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 transition-opacity duration-300 opacity-0">
        <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onclick="openUserProfile('${u.uid}')">
            ${avatar}
            <div class="min-w-0">
                <h4 class="font-bold text-gray-900 text-base truncate">${window.escapeHTML(u.name)}${badge}</h4>
                <p class="text-xs text-gray-500 truncate">${window.escapeHTML(u.profession) || 'সদস্য'}</p>
            </div>
        </div>
        <button onclick="sendSuggestionRequest('${u.uid}')" id="btn-sugg-req-${u.uid}" class="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs">Add</button>
    </div>`;
};

// --- ২. ফ্রেন্ড রিকোয়েস্ট লজিক ---
window.sendSuggestionRequest = (toUid) => {
    const btn = document.getElementById(`btn-sugg-req-${toUid}`);
    btn.disabled = true;
    btn.innerHTML = '...';

    window.fb.set(window.fb.ref(window.db, `friend_requests/${toUid}/${window.currentUser.uid}`), {
        fromName: window.userDetails.name,
        fromUid: window.currentUser.uid,
        timestamp: Date.now()
    }).then(() => {
        window.showToast("রিকুয়েস্ট পাঠানো হয়েছে!");
        document.getElementById(`sugg-card-${toUid}`).remove();
        window.displayedUsersCount--;
        window.maintain20UsersOnScreen();
    });
};

window.acceptRequest = (fromUid) => {
    const updates = {};
    updates[`users/${window.currentUser.uid}/friends/${fromUid}`] = true;
    updates[`users/${fromUid}/friends/${window.currentUser.uid}`] = true;
    updates[`friend_requests/${window.currentUser.uid}/${fromUid}`] = null;

    window.fb.update(window.fb.ref(window.db), updates).then(() => {
        window.showToast("বন্ধু তালিকায় যুক্ত হয়েছে!");
        window.updatePeopleTab();
    });
};

window.cancelRequest = (fromUid, isDelete) => {
    const path = isDelete ? `friend_requests/${window.currentUser.uid}/${fromUid}` : `friend_requests/${fromUid}/${window.currentUser.uid}`;
    window.fb.remove(window.fb.ref(window.db, path)).then(() => {
        window.showToast("বাতিল করা হয়েছে");
        window.updatePeopleTab();
    });
};

// --- ৩. পিপল ট্যাব আপডেট (রিকোয়েস্ট লিস্ট ও ব্যাজ) ---
window.updatePeopleTab = () => {
    window.fb.get(window.fb.ref(window.db, `friend_requests/${window.currentUser.uid}`)).then(async (snap) => {
        const reqDiv = document.getElementById('friend-requests-list');
        const requests = snap.val() || {};
        const count = Object.keys(requests).length;

        // ব্যাজ আপডেট
        document.getElementById('nav-badge-people').innerText = count;
        document.getElementById('nav-badge-people').classList.toggle('active', count > 0);
        document.getElementById('friend-requests-section').classList.toggle('hidden', count === 0);

        if (count > 0) {
            let html = '';
            for (const r of Object.values(requests)) {
                html += `<div class="bg-white p-3 rounded-xl border border-yellow-100 flex justify-between items-center mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">${r.fromName.charAt(0)}</div>
                        <h4 class="font-bold text-sm">${window.escapeHTML(r.fromName)}</h4>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="acceptRequest('${r.fromUid}')" class="bg-green-600 text-white px-3 py-1 rounded text-xs">Confirm</button>
                        <button onclick="cancelRequest('${r.fromUid}', true)" class="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs">Delete</button>
                    </div>
                </div>`;
            }
            reqDiv.innerHTML = html;
        }
    });
};

// --- ৪. সার্চ লজিক ---
window.debouncedPeopleSearch = (q) => {
    q = q.trim();
    const div = document.getElementById('users-list');
    if (!q) {
        window.displayedUsersCount = 0;
        window.loadUserSuggestions(true);
        return;
    }

    div.innerHTML = '<p class="text-center text-gray-400 mt-4">খুঁজছে...</p>';
    const qRef = window.fb.query(window.fb.ref(window.db, 'users'), window.fb.orderByChild('name'), window.fb.startAt(q), window.fb.endAt(q + "\uf8ff"), window.fb.limitToFirst(20));
    
    window.fb.get(qRef).then((snap) => {
        let html = '';
        snap.forEach(child => {
            if (child.key !== window.currentUser.uid) {
                html += window.createSuggestionCardHTML({ uid: child.key, ...child.val() });
            }
        });
        div.innerHTML = html || '<p class="text-center text-gray-400 mt-4">কাউকে পাওয়া যায়নি</p>';
        // কার্ডগুলোকে দৃশ্যমান করা
        document.querySelectorAll('[id^="sugg-card-"]').forEach(el => el.style.opacity = '1');
    });
};

// --- ৫. পুল-টু-রিফ্রেশ লজিক ---
let touchStartY = 0;
document.getElementById('page-people').addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) touchStartY = e.touches[0].clientY;
}, { passive: true });

document.getElementById('page-people').addEventListener('touchmove', (e) => {
    const pullDistance = e.touches[0].clientY - touchStartY;
    if (pullDistance > 50 && window.scrollY === 0) {
        document.getElementById('pull-to-refresh-indicator').style.height = '60px';
    }
}, { passive: true });

document.getElementById('page-people').addEventListener('touchend', () => {
    if (parseInt(document.getElementById('pull-to-refresh-indicator').style.height) > 50) {
        window.loadUserSuggestions(true);
    }
    document.getElementById('pull-to-refresh-indicator').style.height = '0px';
});
