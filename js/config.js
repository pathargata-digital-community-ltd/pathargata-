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
    }
};

const app = initializeApp(APP_CONFIG.firebase);
window.db = getDatabase(app);
window.auth = getAuth(app);
window.APP_CONFIG = APP_CONFIG;

window.fb = { ref, push, set, onValue, onChildAdded, onChildChanged, get, update, remove, query, limitToLast, runTransaction, startAt, endAt, orderByChild, orderByKey, equalTo, limitToFirst };
window.fbAuth = { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, deleteUser, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword };

// গ্লোবাল ফাংশন: ইউনিয়ন অনুযায়ী গ্রাম লোড
window.loadVillagesForUnion = (unionName, targetSelectId) => {
    const villageSelect = document.getElementById(targetSelectId);
    if (!villageSelect) return;
    villageSelect.innerHTML = '<option value="">গ্রাম নির্বাচন করুন</option>';
    if (APP_CONFIG.locations[unionName]) {
        APP_CONFIG.locations[unionName].forEach(v => {
            let opt = document.createElement('option'); opt.value = v; opt.textContent = v;
            villageSelect.appendChild(opt);
        });
        villageSelect.disabled = false;
    } else {
        villageSelect.disabled = true;
    }
};

window.currentUser = null;
window.userDetails = {};
window.dynamicPoints = { refer: 50, post: 5, like: 1, comment: 2, min_withdraw: 1000 };

console.log("Config Initialized.");
