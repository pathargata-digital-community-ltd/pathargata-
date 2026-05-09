import { auth, db } from './config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// অ্যাপ লোড হওয়ার পর প্রাথমিক কাজ
document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initialized...");
    // স্প্ল্যাশ স্ক্রিন ১.৫ সেকেন্ড পর লুকানো
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden-custom');
    }, 1500);
});

// অথেন্টিকেশন স্টেট লিসেনার
onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');

    if (user) {
        // ইউজার লগইন থাকলে
        window.currentUser = user;
        authScreen.classList.add('hidden-custom');
        mainApp.classList.remove('hidden-custom');

        // ইউজারের বিস্তারিত ডাটা লোড করা
        loadUserDetails(user.uid);
        
        // প্রাথমিক ডাটাগুলো লোড করা
        if (window.loadFeed) window.loadFeed('all');
        if (window.loadNotes) window.loadNotes();
        if (window.loadNotifications) window.loadNotifications(true);
        
    } else {
        // ইউজার লগআউট থাকলে
        window.currentUser = null;
        authScreen.classList.remove('hidden-custom');
        mainApp.classList.add('hidden-custom');
        window.switchPage('home', false); // লগইন পেজে ফিরিয়ে নেওয়া
    }
});

// ইউজার ডাটা লোড করার ফাংশন
function loadUserDetails(uid) {
    onValue(ref(db, 'users/' + uid), (snap) => {
        const data = snap.val();
        if (data) {
            window.userDetails = data;
            // প্রোফাইল UI আপডেট করার ফাংশন (ui.js এ থাকলে কল হবে)
            if (window.updateUIWithUserData) window.updateUIWithUserData();
            if (window.checkMonetizationStatus) window.checkMonetizationStatus();
        }
    });
}

// গ্লোবাল এরর হ্যান্ডলিং
window.onerror = function(msg, url, line) {
    console.error("Error: " + msg + "\nurl: " + url + "\nline: " + line);
    return false;
};
