/** 
 * Market.js - পাথরঘাটা ডিজিটাল
 * এখানে উপজেলা মার্কেটের পণ্য লোড করা এবং নতুন পণ্য বিক্রির বিজ্ঞাপন দেওয়ার লজিক রয়েছে।
 */

// --- ১. মার্কেটের পণ্য রিয়েলটাইম লোড করা ---
window.loadMarketItems = () => {
    const container = document.getElementById('market-list');
    if (!container) return;

    // লোডিং স্পিনার
    container.innerHTML = '<div class="col-span-2 flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>';

    window.fb.onValue(window.fb.ref(window.db, 'market_items'), (snap) => {
        const data = snap.val() || {};
        window.globalMarketItems = Object.entries(data).map(([key, val]) => ({
            id: key,
            ...val
        })).reverse(); // নতুন পণ্য আগে দেখাবে

        if (window.globalMarketItems.length > 0) {
            container.innerHTML = window.globalMarketItems.map(item => {
                const imgTag = item.image ? 
                    `<img src="${item.image}" class="h-full w-full object-cover">` : 
                    `<i class="fa-solid fa-image text-3xl text-gray-200"></i>`;

                return `
                <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transform transition active:scale-95">
                    <div>
                        <div class="h-28 bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden border border-gray-100">
                            ${imgTag}
                        </div>
                        <h3 class="font-bold text-sm text-gray-800 line-clamp-1">${window.escapeHTML(item.title)}</h3>
                        <p class="text-orange-600 font-bold text-sm mt-0.5">৳ ${window.escapeHTML(item.price)}</p>
                        <p class="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-tight">${window.escapeHTML(item.desc)}</p>
                    </div>
                    <div class="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                        <span class="text-[10px] text-gray-400 font-medium truncate w-20">
                            <i class="fa-solid fa-user text-[8px]"></i> ${window.escapeHTML(item.seller).split(' ')[0]}
                        </span>
                        <a href="tel:${item.phone || ''}" class="bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm hover:bg-green-600 transition">
                            <i class="fa-solid fa-phone"></i> কল করুন
                        </a>
                    </div>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="col-span-2 text-center py-20">
                    <i class="fa-solid fa-store-slash text-5xl text-gray-200 mb-3"></i>
                    <p class="text-gray-400 text-sm">মার্কেটে এখন কোনো পণ্য নেই</p>
                </div>`;
        }
    });
};

// --- ২. নতুন পণ্যের বিজ্ঞাপন জমা দেওয়া ---
window.submitProduct = async () => {
    const title = document.getElementById('sell-title').value.trim();
    const price = document.getElementById('sell-price').value.trim();
    const desc = document.getElementById('sell-desc').value.trim();
    const fileInput = document.getElementById('sell-image-file');
    const file = fileInput.files[0];

    // ভ্যালিডেশন
    if (!title || !price || !desc) {
        return window.showToast("পণ্যর নাম, দাম এবং বিবরণ অবশ্যই দিন", 'error');
    }

    const btn = document.getElementById('btn-sell-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> আপলোড হচ্ছে...';

    try {
        let imgUrl = "";
        // যদি ছবি থাকে তবে ক্লাউডিনারিতে আপলোড করবে
        if (file) {
            const res = await window.uploadMediaToCloudinary(file);
            imgUrl = res.url;
        }

        const newProduct = {
            uid: window.currentUser.uid,
            seller: window.userDetails.name,
            phone: window.userDetails.phone || "",
            title: title,
            price: price,
            desc: desc,
            image: imgUrl,
            timestamp: Date.now(),
            union: window.userDetails.union || 'Unknown'
        };

        // ফায়ারবেসে ডাটা সেভ করা
        await window.fb.push(window.fb.ref(window.db, 'market_items'), newProduct);

        window.showToast("বিজ্ঞাপনটি সফলভাবে দেওয়া হয়েছে!", "success");
        
        // ফর্ম রিসেট ও মডাল বন্ধ
        document.getElementById('sell-title').value = "";
        document.getElementById('sell-price').value = "";
        document.getElementById('sell-desc').value = "";
        fileInput.value = "";
        window.toggleSellModal(false);

    } catch (e) {
        console.error("Market Submission Error:", e);
        window.showToast("পণ্য আপলোড করতে সমস্যা হয়েছে", 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};
