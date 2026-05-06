// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase, ref, push, set, onValue, onChildAdded, onChildChanged, get, update, remove, query, 
    limitToLast, runTransaction, startAt, endAt, orderByChild, orderByKey, equalTo, limitToFirst
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, 
    signOut, sendPasswordResetEmail, deleteUser, updateProfile, EmailAuthProvider, 
    reauthenticateWithCredential, updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- ১. অ্যাপ কনফিগারেশন (হুবহু মূল ফাইল থেকে) ---
const APP_CONFIG = {
    firebase: {
        apiKey: "AIzaSyBfI-THOXOvhyL7LumZVKixtTVwF94CjsI",
        authDomain: "pathargata-digital-comnity-ltd.firebasestorage.app",
        databaseURL: "https://pathargata-digital-comnity-ltd-default-rtdb.firebaseio.com",
        projectId: "pathargata-digital-comnity-ltd",
        storageBucket: "pathargata-digital-comnity-ltd.firebasestorage.app",
        messagingSenderId: "991014085926",
        appId: "1:991014085926:android:b249e489d8424433ed4de7"
    },
    locations: {
        "Patharghata Union Sadar": ["পাথরঘাটা", "গহরপুর", "নিজলাঠিমারা", "হাতেমপুর", "বড়ইতলা", "বড় টেংরা", "কোড়ালিয়া", "রুহিতা", "পদ্মা", "হাড়িটানা", "বাদুরতলা", "চরলাঠিমারা"],
        "Char Duani Union": ["চরদুয়ানী", "দক্ষিণ চরদুয়ানী", "মঠের খাল", "হোগলাপাশা", "গাববাড়িয়া"],
        "Kakchira Union": ["কাকচিরা", "জালিয়াঘাটা", "রূপধন", "বাইলাচারা"],
        "Kalmegha Union": ["কালমেঘা", "ঘুটাবাছা", "কুপদোন", "পশ্চিম কালমেঘা"],
        "Kathaltoli Union": ["কাঁঠালতলী", "তালতলী", "সাপলেজা", "করুণা"],
        "Nachnapara Union": ["নাচনাপাড়া", "জ্ঞানপাড়া", "বাঁশতলা", "মানিকখালী"],
        "Raihanpur Union": ["রায়হানপুর", "শতকর", "লেমুয়া", "হরিণঘাটা"]
    },
    services: {
        "directory": { title: "ডিরেক্টরি", icon: "fa-address-book", color: "text-blue-600", bg: "bg-blue-50" },
        "blood": { title: "রক্তদান", icon: "fa-droplet", color: "text-red-600", bg: "bg-red-50" },
        "emergency": { title: "জরুরী এলার্ট", icon: "fa-triangle-exclamation", color: "text-red-600", bg: "bg-red-50" },
        "history_tourism": { title: "পর্যটন", icon: "fa-landmark", color: "text-purple-600", bg: "bg-purple-50" },
        "transport": { title: "পরিবহন", icon: "fa-bus", color: "text-teal-600", bg: "bg-teal-50" },
        "education": { title: "শিক্ষা", icon: "fa-graduation-cap", color: "text-yellow-600", bg: "bg-yellow-50" },
        "complaints": { title: "অভিযোগ", icon: "fa-box-archive", color: "text-red-600", bg: "bg-red-50" },
        "market": { title: "হাট", icon: "fa-store", color: "text-orange-600", bg: "bg-orange-50" },
        "birth_reg": { title: "জন্ম নিবন্ধন", icon: "fa-address-card", color: "text-blue-600", bg: "bg-blue-50" },
        "tin_cert": { title: "টিন সার্টিফিকেট", icon: "fa-file-invoice-dollar", color: "text-indigo-600", bg: "bg-indigo-50" },
        "agriculture": { title: "কৃষি সেবা", icon: "fa-leaf", color: "text-green-600", bg: "bg-green-50" },
        "result": { title: "বোর্ড রেজাল্ট", icon: "fa-award", color: "text-pink-600", bg: "bg-pink-50" }
    }
};

// --- ২. ফায়ারবেস ইনিশিয়ালাইজেশন ---
const app = initializeApp(APP_CONFIG.firebase);
const db = getDatabase(app);
const auth = getAuth(app);

// --- ৩. গ্লোবাল উইন্ডো অবজেক্টে সেট করা (যাতে সব ফাইল এক্সেস পায়) ---
window.db = db;
window.auth = auth;
window.APP_CONFIG = APP_CONFIG;

// Firebase Functions
window.fb = {
    ref, push, set, onValue, onChildAdded, onChildChanged, get, update, remove, 
    query, limitToLast, runTransaction, startAt, endAt, orderByChild, orderByKey, 
    equalTo, limitToFirst
};

// Auth Functions
window.fbAuth = {
    createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, 
    signOut, sendPasswordResetEmail, deleteUser, updateProfile, EmailAuthProvider, 
    reauthenticateWithCredential, updatePassword
};

// --- ৪. গ্লোবাল স্টেট ভেরিয়েবলস (হুবহু মূল ফাইল থেকে) ---
window.currentUser = null;
window.userDetails = {};
window.allUsers = [];
window.myFriends = [];
window.currentChatUser = null;
window.allDonors = [];
window.currentFullPostId = null;
window.globalMarketItems = [];
window.globalDirectory = {};
window.allAds = [];

// মনিটাইজেশন ও পয়েন্ট সিস্টেম ডিফল্ট (১০১৯-১০২৬ লাইন)
window.dynamicPoints = {
    refer: 50, post: 5, like: 1, comment: 2, limit_post: 5, limit_like: 20, 
    limit_comment: 20, min_withdraw: 1000
};

// এনক্রিপশন কি (১১১৯ লাইন)
window.SECRET_KEY = "PatharghataDigitalSecretKey";

console.log("Config: Firebase and Global Variables Initialized.");
