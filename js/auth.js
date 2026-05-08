/** Auth.js - পাথরঘাটা ডিজিটাল **/

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

window.handleRegister = async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const union = document.getElementById('reg-union').value;
    const village = document.getElementById('reg-village').value;
    const isPolicyChecked = document.getElementById('reg-privacy-agree').checked;

    if (!isPolicyChecked) return window.showToast("নীতিমালার সাথে একমত হোন", "error");
    if (!name || !email || !phone || !pass || !union || !village) return window.showToast("সব তথ্য দিন!", 'error');

    const btn = document.getElementById('btn-reg-action');
    btn.disabled = true;
    btn.innerHTML = "অপেক্ষা করুন...";

    try {
        const cred = await window.fbAuth.createUserWithEmailAndPassword(window.auth, email, pass);
        await window.fb.set(window.fb.ref(window.db, 'users/' + cred.user.uid), {
            name, email, phone, union, village, uid: cred.user.uid,
            joinDate: new Date().toLocaleDateString(), role: 'user', total_points: 0
        });
        window.showToast("রেজিস্ট্রেশন সফল!");
    } catch (e) {
        window.showToast(e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = "রেজিস্ট্রেশন সম্পন্ন করুন";
    }
};

window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return window.showToast("তথ্য দিন", "error");

    const btn = document.getElementById('btn-login-action');
    btn.disabled = true;
    window.fbAuth.signInWithEmailAndPassword(window.auth, email, pass)
    .catch(e => {
        window.showToast("ভুল ইমেইল বা পাসওয়ার্ড", 'error');
        btn.disabled = false;
    });
};

window.handleLogout = () => {
    if (confirm("লগআউট করবেন?")) window.fbAuth.signOut(window.auth);
};
