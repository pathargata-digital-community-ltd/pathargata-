/** 
 * Messages.js - পাথরঘাটা ডিজিটাল
 * এখানে চ্যাট লিস্ট, মেসেজ আদান-প্রদান এবং এনক্রিপশন লজিক রয়েছে।
 */

// --- ১. এনক্রিপশন ও ডিক্রিপশন হেল্পার (CryptoJS ব্যবহার করে) ---
window.encryptMsg = (text) => {
    return CryptoJS.AES.encrypt(text, window.SECRET_KEY).toString();
};

window.decryptMsg = (cipherText) => {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, window.SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || cipherText; // ডিক্রিপ্ট না হলে মূল টেক্সট দেখাবে
    } catch (e) {
        return cipherText;
    }
};

// চ্যাট আইডি জেনারেটর (ইউনিক আইডি তৈরির জন্য)
window.getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

// --- ২. মেসেজ পাঠানো ---
window.sendMsg = (imageUrl = null) => {
    if (!window.currentChatUser) return;
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text && !imageUrl) return;

    const btn = document.getElementById('btn-chat-send');
    const chatId = window.getChatId(window.currentUser.uid, window.currentChatUser.uid);
    const ts = Date.now();

    // টেক্সট এনক্রিপ্ট করা
    const encryptedText = text ? window.encryptMsg(text) : "";

    const msgData = {
        sender: window.currentUser.uid,
        timestamp: ts
    };
    if (text) msgData.text = encryptedText;
    if (imageUrl) msgData.image = imageUrl;

    // ১. মূল চ্যাট বক্সে মেসেজ সেভ
    window.fb.push(window.fb.ref(window.db, `chats/${chatId}`), msgData);

    // ২. চ্যাট লিস্ট স্নপেট আপডেট (এনক্রিপ্টেড অবস্থায়)
    const lastMsg = imageUrl ? (text ? "📷 " + encryptedText : "📷 ছবি পাঠিয়েছেন") : encryptedText;
    
    const myUpdate = { name: window.currentChatUser.name, lastMessage: "You: " + lastMsg, timestamp: ts };
    const peerUpdate = { name: window.userDetails.name, lastMessage: lastMsg, timestamp: ts };

    window.fb.update(window.fb.ref(window.db, `user_chats/${window.currentUser.uid}/${window.currentChatUser.uid}`), myUpdate);
    window.fb.update(window.fb.ref(window.db, `user_chats/${window.currentChatUser.uid}/${window.currentUser.uid}`), peerUpdate);

    input.value = "";
    btn.disabled = false;
};

// --- ৩. মেসেজ লোড করা (কনভারসেশন ভিউ) ---
window.loadMessages = (otherUid) => {
    const chatId = window.getChatId(window.currentUser.uid, otherUid);
    const div = document.getElementById('messages-container');
    div.innerHTML = '<p class="text-center text-xs text-gray-400 mt-4">লোড হচ্ছে...</p>';

    window.fb.onValue(window.fb.query(window.fb.ref(window.db, `chats/${chatId}`), window.fb.limitToLast(50)), (snap) => {
        const msgs = snap.val() || {};
        if (Object.keys(msgs).length > 0) {
            div.innerHTML = Object.values(msgs).map(m => {
                const isMe = m.sender === window.currentUser.uid;
                let content = '';
                if (m.image) content += `<img src="${m.image}" class="rounded-lg mb-1 max-w-full h-auto cursor-pointer" onclick="window.open('${m.image}')">`;
                
                if (m.text) {
                    const decrypted = window.decryptMsg(m.text);
                    content += `<span>${window.escapeHTML(decrypted)}</span>`;
                }

                return `<div class="flex ${isMe ? 'justify-end' : 'justify-start'} mb-2">
                    <div class="px-4 py-2 max-w-[75%] text-sm ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'}">
                        ${content}
                    </div>
                </div>`;
            }).join('');
            
            // অটো স্ক্রল নিচে
            setTimeout(() => { div.scrollTop = div.scrollHeight; }, 100);
        } else {
            div.innerHTML = '<p class="text-center text-xs text-gray-400 mt-4">কথপোকথন শুরু করুন</p>';
        }
    });
};

// --- ৪. চ্যাট লিস্ট লোড করা ---
window.loadChatList = (uid) => {
    const container = document.getElementById('chat-list-container');
    window.fb.onValue(window.fb.ref(window.db, `user_chats/${uid}`), async (snap) => {
        const list = snap.val() || {};
        if (Object.keys(list).length > 0) {
            let html = '';
            const sortedList = Object.entries(list).sort((a, b) => b[1].timestamp - a[1].timestamp);

            for (const [peerUid, info] of sortedList) {
                let rawLastMsg = info.lastMessage || "";
                let displayMsg = rawLastMsg;

                // লাস্ট মেসেজ ডিক্রিপ্ট করা
                if (!rawLastMsg.includes("📷")) {
                    let prefix = rawLastMsg.startsWith("You: ") ? "You: " : "";
                    let cleanMsg = rawLastMsg.replace("You: ", "");
                    displayMsg = prefix + window.decryptMsg(cleanMsg);
                }

                html += `
                <div onclick="startChat('${peerUid}', '${window.escapeHTML(info.name)}')" class="p-4 border-b bg-white hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-xl shrink-0">${info.name.charAt(0)}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-0.5">
                            <h4 class="font-bold text-gray-800 text-base truncate">${window.escapeHTML(info.name)}</h4>
                            <span class="text-[10px] text-gray-400">${window.timeAgo(info.timestamp)}</span>
                        </div>
                        <p class="text-sm text-gray-500 truncate">${window.escapeHTML(displayMsg)}</p>
                    </div>
                </div>`;
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-center text-gray-400 mt-10 text-sm">কোনো কনভারসেশন নেই</p>';
        }
    });
};

// --- ৫. চ্যাট ইমেজ সিলেক্ট ও আপলোড ---
window.handleChatImageSelect = () => {
    const file = document.getElementById('chat-img-input').files[0];
    if (file) {
        const btn = document.getElementById('btn-chat-send');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        window.uploadMediaToCloudinary(file).then(res => {
            window.sendMsg(res.url);
            document.getElementById('chat-img-input').value = "";
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        }).catch(e => {
            window.showToast("ছবি আপলোড হয়নি", 'error');
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        });
    }
};

// --- ৬. চ্যাট ভিউ কন্ট্রোল ---
window.startChat = (uid, name) => {
    window.currentChatUser = { uid, name };
    window.switchPage('messages');
    document.getElementById('chat-list-view').classList.add('hidden', 'hidden-custom');
    document.getElementById('chat-conversation-view').classList.remove('hidden', 'hidden-custom');
    document.getElementById('chat-header-name').innerText = window.escapeHTML(name);
    document.getElementById('chat-header-img').innerText = window.escapeHTML(name).charAt(0);
    window.loadMessages(uid);
};

window.closeChat = () => {
    document.getElementById('chat-list-view').classList.remove('hidden', 'hidden-custom');
    document.getElementById('chat-conversation-view').classList.add('hidden', 'hidden-custom');
    window.currentChatUser = null;
};
