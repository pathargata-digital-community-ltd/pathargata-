/** 
 * Auth.js - পাথরঘাটা ডিজিটাল
 * এখানে লগইন, রেজিস্ট্রেশন, পাসওয়ার্ড পরিবর্তন এবং একাউন্ট ম্যানেজমেন্টের সব লজিক রয়েছে।
 */

// --- ১. রেজিস্ট্রেশন ছবি প্রিভিউ ---
window.previewRegImage = (input) => {
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => {
            document.getElementById('reg-img-preview').src = e.target.result;
            document.getElementById('reg-img-preview').classList.remove('hidden');
            document.getElementById('reg-img-placeholder').classList.add('hidden');
        };
        r.readAsDataURL(input.files[0]);
    }
};

// --- ২. রেজিস্ট্রেশন লজিক ---
window.handleRegister = async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const union = document.getElementById('reg-union').value;
    const village = document.getElementById('reg-village').value;
    const file = document.getElementById('reg-profile-pic').files[0];
    const isPolicyChecked = document.getElementById('reg-privacy-agree').checked;

    if (!isPolicyChecked) return window.showToast("দয়া করে গোপনীয়তা ও নীতিমালার সাথে একমত হোন", "error");

    const nameRegex = /^[a-zA-Z\u0980-\u09FF\s]+$/;
    if (!name || !email || !phone || !pass || !union || !village) return window.showToast("সব তথ্য দিন!", 'error');
    if (!nameRegex.test(name)) return window.showToast("নামে ইমোজি বা সিম্বল ব্যবহার করা যাবে না", 'error');
    if (name.length > 20) return window.showToast("নাম ২০ অক্ষরের বেশি হতে পারবে না", 'error');
    if (!/^01[3-9]\d{8}$/.test(phone)) return window.showToast("সঠিক মোবাইল নম্বর দিন", 'error');

    const btn = document.getElementById('btn-reg-action');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> অপেক্ষা করুন...';
    btn.disabled = true;

    try {
        const locData = await window.ADVANCED_FEATURES.checkUserLocation();
        let profilePicUrl = "";
        if (file) {
            try {
                const res = await window.uploadMediaToCloudinary(file);
                profilePicUrl = res.url;
            } catch (err) { console.warn("Image upload failed"); }
        }

        // Anti-Fraud Data
        let visitorId = "unknown_device";
        try {
            const fp = await window.FingerprintJS.load();
            const fpResult = await fp.get();
            visitorId = fpResult.visitorId;
        } catch (err) {}

        const cred = await window.fbAuth.createUserWithEmailAndPassword(window.auth, email, pass);
        await window.fbAuth.updateProfile(cred.user, { displayName: name, photoURL: profilePicUrl });

        await window.fb.set(window.fb.ref(window.db, 'users/' + cred.user.uid), {
            name, email, phone, union, village, role: 'user', uid: cred.user.uid,
            joinDate: new Date().toLocaleDateString(), isVerified: false,
            profile_pic: profilePicUrl, status: locData.status, lat: locData.lat, lng: locData.lng,
            deviceId: visitorId
        });

        // Referral Logic
        const manualRefCode = document.getElementById('reg-ref-code').value.trim();
        let inviterUid = manualRefCode || localStorage.getItem('inviter_uid');
        if (inviterUid) {
            await window.fb.runTransaction(window.fb.ref(window.db, `users/${inviterUid}/total_points`), (pts) => (pts || 0) + window.dynamicPoints.refer);
            await window.fb.runTransaction(window.fb.ref(window.db, `users/${inviterUid}/referral_count`), (count) => (count || 0) + 1);
            localStorage.removeItem('inviter_uid');
        }

        window.showToast("রেজিস্ট্রেশন সফল হয়েছে!", "success");
    } catch (e) { window.showToast(e.message, 'error'); } 
    finally { btn.innerText = "রেজিস্ট্রেশন সম্পন্ন করুন"; btn.disabled = false; }
};

// --- ৩. লগইন লজিক ---
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return window.showToast("ইমেইল এবং পাসওয়ার্ড দিন", "error");

    const btn = document.getElementById('btn-login-action');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> যাচাই হচ্ছে...';
    btn.disabled = true;

    window.fbAuth.signInWithEmailAndPassword(window.auth, email, pass)
    .catch((e) => {
        window.showToast("ভুল ইমেইল বা পাসওয়ার্ড", 'error');
        btn.innerText = "লগইন"; btn.disabled = false;
    });
};

// --- ৪. পাসওয়ার্ড ভুলে গেলে ---
window.handleForgotPass = () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) return window.showToast("আপনার ইমেইল দিন", 'error');
    window.fbAuth.sendPasswordResetEmail(window.auth, email).then(() => {
        window.showToast("লিংক পাঠানো হয়েছে!");
        window.toggleAuth('login');
    }).catch((e) => window.showToast("ত্রুটি: " + e.message, 'error'));
};

// --- ৫. লগআউট ---
window.handleLogout = () => {
    if (confirm("লগআউট করবেন?")) window.fbAuth.signOut(window.auth);
};

// --- ৬. ইমেইল ও মোবাইল পরিবর্তন (৬০ দিন লিমিট) ---
window.openAccountDetailsModal = () => {
    window.openModalWithHistory('account-details-modal', "#account-details");
    document.getElementById('current-display-email').innerText = window.userDetails.email || "নেই";
    document.getElementById('current-display-phone').innerText = window.userDetails.phone || "নেই";
    document.getElementById('update-new-email').value = window.userDetails.email || "";
    document.getElementById('update-new-phone').value = window.userDetails.phone || "";

    const lastUpdate = window.userDetails.last_contact_update || 0;
    const now = Date.now();
    const days60 = 60 * 24 * 60 * 60 * 1000;
    if (lastUpdate !== 0 && (now - lastUpdate) < days60) {
        const left = Math.ceil((days60 - (now - lastUpdate)) / (1000 * 60 * 60 * 24));
        document.getElementById('account-update-info').innerHTML = `আরও <b>${left} দিন</b> পর পরিবর্তন করতে পারবেন।`;
        document.getElementById('btn-save-account-details').classList.add('hidden');
    }
};

window.saveAccountDetails = async () => {
    const newEmail = document.getElementById('update-new-email').value.trim();
    const newPhone = document.getElementById('update-new-phone').value.trim();
    if (!newEmail || !newPhone) return window.showToast("সব তথ্য দিন", "error");

    try {
        await window.fb.update(window.fb.ref(window.db, 'users/' + window.currentUser.uid), {
            email: newEmail, phone: newPhone, last_contact_update: Date.now()
        });
        window.showToast("তথ্য আপডেট হয়েছে!");
        document.getElementById('account-details-modal').classList.add('hidden-custom');
    } catch (e) { window.showToast(e.message, 'error'); }
};

// --- ৭. পাসওয়ার্ড পরিবর্তন ---
window.submitPasswordChange = async () => {
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-new-password').value;

    if (newPass !== confirmPass) return window.showToast("পাসওয়ার্ড মিলছে না", "error");

    try {
        const credential = window.fbAuth.EmailAuthProvider.credential(window.currentUser.email, oldPass);
        await window.fbAuth.reauthenticateWithCredential(window.currentUser, credential);
        await window.fbAuth.updatePassword(window.currentUser, newPass);
        window.showToast("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
        document.getElementById('password-change-modal').classList.add('hidden-custom');
    } catch (e) { window.showToast("পুরাতন পাসওয়ার্ড ভুল", "error"); }
};

// --- ৮. একাউন্ট ডিলিট রিকোয়েস্ট ---
window.handleDeleteAccount = async () => {
    if (prompt("একাউন্ট ডিলিট করতে 'DELETE' লিখুন:") === 'DELETE') {
        try {
            await window.fb.set(window.fb.ref(window.db, `account_deletion_requests/${window.currentUser.uid}`), {
                uid: window.currentUser.uid, name: window.userDetails.name, timestamp: Date.now()
            });
            await window.fb.update(window.fb.ref(window.db, `users/${window.currentUser.uid}`), { status: 'deleted' });
            alert("ডিলিট রিকোয়েস্ট পাঠানো হয়েছে।");
            window.fbAuth.signOut(window.auth);
        } catch (e) { alert(e.message); }
    }
};
