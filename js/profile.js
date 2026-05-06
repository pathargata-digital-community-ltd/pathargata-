/** 
 * Profile.js - পাথরঘাটা ডিজিটাল
 * এখানে প্রোফাইল এডিট, অন্যের প্রোফাইল ভিউ, কভার ফটো এবং ফ্রেন্ডশিপ লজিক রয়েছে।
 */

// --- ১. নিজের প্রোফাইল ইউআই আপডেট (config.js থেকে ডাটা নিয়ে) ---
window.updateUIWithUserData = () => {
    if (!window.userDetails) return;

    const finalName = window.userDetails.name || window.auth.currentUser?.displayName || "অজ্ঞাত";
    const badge = window.checkUserBadge(window.userDetails);
    const displayName = finalName + (window.userDetails.nickname ? ` (${window.userDetails.nickname})` : "");

    let avatarHtml = window.userDetails.profile_pic ? 
        `<img src="${window.userDetails.profile_pic}" class="w-full h-full object-cover">` : 
        `<i class="fa-solid fa-user"></i>`;

    // বিভিন্ন জায়গায় প্রোফাইল ছবি ও নাম সেট করা
    ['sidebar-avatar-container', 'profile-avatar-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = avatarHtml;
    });

    if (document.getElementById('profile-name')) document.getElementById('profile-name').innerHTML = displayName + badge;
    if (document.getElementById('sidebar-name')) document.getElementById('sidebar-name').innerHTML = displayName + badge;
    
    // বিস্তারিত তথ্য
    if (document.getElementById('profile-village-text')) document.getElementById('profile-village-text').innerText = window.userDetails.village || "গ্রাম নেই";
    if (document.getElementById('profile-union-badge')) document.getElementById('profile-union-badge').innerText = window.userDetails.union || "ইউনিয়ন নেই";
    if (document.getElementById('profile-bio')) document.getElementById('profile-bio').innerText = window.userDetails.bio || "নিজের সম্পর্কে কিছু লিখুন...";
    if (document.getElementById('profile-profession')) document.getElementById('profile-profession').innerText = window.userDetails.profession || "উল্লেখ নেই";
    if (document.getElementById('profile-location')) document.getElementById('profile-location').innerText = window.userDetails.location || "উল্লেখ নেই";
    
    // কভার ফটো
    if (window.userDetails.cover_pic && document.getElementById('profile-cover-img')) {
        const coverImg = document.getElementById('profile-cover-img');
        coverImg.src = window.userDetails.cover_pic;
        coverImg.classList.remove('hidden');
    }
};

// --- ২. প্রোফাইল এডিট ও সেভ লজিক ---
window.saveProfileChanges = async () => {
    const name = document.getElementById('edit-name').value.trim();
    const file = document.getElementById('edit-profile-img').files[0];
    if (!name) return window.showToast("নাম আবশ্যক", 'error');

    const btn = document.getElementById('btn-save-profile');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সংরক্ষণ হচ্ছে...';
    btn.disabled = true;

    try {
        let profilePicUrl = window.userDetails.profile_pic || null;
        if (file) {
            const res = await window.uploadMediaToCloudinary(file);
            profilePicUrl = res.url;
        }

        await window.fb.update(window.fb.ref(window.db, 'users/' + window.currentUser.uid), {
            name,
            nickname: document.getElementById('edit-nickname').value.trim(),
            profession: document.getElementById('edit-profession').value.trim(),
            location: document.getElementById('edit-location').value.trim(),
            bio: document.getElementById('edit-bio').value.trim(),
            profile_pic: profilePicUrl
        });

        window.showToast("প্রোফাইল আপডেট হয়েছে!");
        window.toggleEditProfile(false);
    } catch (e) {
        window.showToast("ত্রুটি: " + e.message, 'error');
    } finally {
        btn.innerText = "সংরক্ষণ করুন"; btn.disabled = false;
    }
};

// কভার ফটো আপলোড
window.handleCoverPhotoUpload = async (input) => {
    if (input.files && input.files[0]) {
        window.showToast("কভার ফটো আপলোড হচ্ছে...");
        try {
            const res = await window.uploadMediaToCloudinary(input.files[0]);
            await window.fb.update(window.fb.ref(window.db, 'users/' + window.currentUser.uid), { cover_pic: res.url });
            window.showToast("কভার ফটো আপডেট হয়েছে!");
            document.getElementById('profile-cover-img').src = res.url;
        } catch (e) { window.showToast("আপলোড ব্যর্থ", "error"); }
    }
};

// --- ৩. অন্যের প্রোফাইল ভিজিট লজিক ---
window.openUserProfile = (uid) => {
    if (uid === window.currentUser.uid) return window.switchPage('profile');
    
    window.switchPage('view-profile');
    // ইউআই রিসেট
    document.getElementById('view-profile-posts-feed').innerHTML = '<div class="flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>';

    window.fb.get(window.fb.ref(window.db, 'users/' + uid)).then(snap => {
        const user = snap.val();
        if (!user) return window.switchPage('home');

        document.getElementById('view-profile-name').innerHTML = window.escapeHTML(user.name) + window.checkUserBadge(user);
        document.getElementById('view-profile-avatar-container').innerHTML = user.profile_pic ? 
            `<img src="${user.profile_pic}" class="w-full h-full object-cover">` : 
            `<span class="text-5xl">${user.name.charAt(0)}</span>`;
        
        document.getElementById('view-profile-bio').innerText = user.bio || "কোনো তথ্য নেই";
        document.getElementById('view-profile-profession').innerText = user.profession || "উল্লেখ নেই";
        
        // ফ্রেন্ডশিপ স্ট্যাটাস চেক
        window.checkFriendshipStatus(uid, user.name);
        // ওই ইউজারের পোস্ট লোড
        window.loadProfilePosts(uid, 'view-profile-posts-feed');
        // বন্ধুদের প্রিভিউ
        window.loadFriendsPreview(uid, 'other');
    });
};

// --- ৪. ফ্রেন্ডশিপ এবং আনফ্রেন্ড লজিক ---
window.checkFriendshipStatus = (targetUid, targetName) => {
    const actionDiv = document.getElementById('view-profile-actions');
    
    window.fb.get(window.fb.ref(window.db, `users/${window.currentUser.uid}/friends/${targetUid}`)).then(snap => {
        if (snap.exists()) {
            actionDiv.innerHTML = `<button onclick="startChat('${targetUid}', '${targetName}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">মেসেজ</button>
                                   <button onclick="unfriend('${targetUid}')" class="w-12 bg-red-100 text-red-600 py-2 rounded-lg flex items-center justify-center"><i class="fa-solid fa-user-xmark"></i></button>`;
        } else {
            actionDiv.innerHTML = `<button onclick="sendFriendRequest('${targetUid}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">অ্যাড ফ্রেন্ড</button>`;
        }
    });
};

window.unfriend = (uid) => {
    if (confirm("আনফ্রেন্ড করবেন?")) {
        const updates = {};
        updates[`users/${window.currentUser.uid}/friends/${uid}`] = null;
        updates[`users/${uid}/friends/${window.currentUser.uid}`] = null;
        window.fb.update(window.fb.ref(window.db), updates).then(() => {
            window.showToast("আনফ্রেন্ড করা হয়েছে");
            window.openUserProfile(uid); // পেজ রিফ্রেশ
        });
    }
};

// --- ৫. প্রোফাইল পোস্ট ও ফ্রেন্ডস প্রিভিউ ---
window.loadProfilePosts = (targetUid, containerId) => {
    const container = document.getElementById(containerId);
    const q = window.fb.query(window.fb.ref(window.db, 'posts'), window.fb.orderByChild('uid'), window.fb.equalTo(targetUid));

    window.fb.get(q).then(snap => {
        const data = snap.val() || {};
        const posts = Object.entries(data).map(([id, post]) => ({ id, ...post })).sort((a, b) => b.timestamp - a.timestamp);
        
        container.innerHTML = posts.length > 0 ? 
            posts.map(p => window.createPostHTML(p, p.id)).join('') : 
            '<p class="text-center text-gray-400 py-10">কোনো পোস্ট নেই</p>';
    });
};

window.loadFriendsPreview = (uid, mode) => {
    const container = document.getElementById(mode === 'me' ? 'profile-friends-preview-me' : 'profile-friends-preview-other');
    if (!container) return;

    window.fb.get(window.fb.ref(window.db, `users/${uid}/friends`)).then(snap => {
        const friends = Object.keys(snap.val() || {});
        if (friends.length === 0) {
            container.innerHTML = '<p class="col-span-3 text-center text-xs text-gray-400">কোনো বন্ধু নেই</p>';
            return;
        }
        // প্রথম ৬ জন বন্ধুকে দেখানো
        container.innerHTML = friends.slice(0, 6).map(fUid => `
            <div onclick="openUserProfile('${fUid}')" class="flex flex-col items-center cursor-pointer">
                <div class="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400 border border-gray-200">
                    <i class="fa-solid fa-user"></i>
                </div>
            </div>`).join('');
    });
};
