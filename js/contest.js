/** 
 * Contest.js - পাথরঘাটা ডিজিটাল
 * এখানে প্রতিযোগিতার তথ্য, ছবি আপলোড, ভোটিং সিস্টেম এবং লিডারবোর্ড লজিক রয়েছে।
 */

// --- ১. প্রতিযোগিতার ডাইনামিক তথ্য লোড (স্পন্সর, পুরস্কার, নিয়ম) ---
window.loadContestInfo = () => {
    window.fb.onValue(window.fb.ref(window.db, 'admin_settings/contest_info'), (snap) => {
        const info = snap.val();
        if (info) {
            // স্পন্সর ও শেষ সময় আপডেট
            if(document.getElementById('dyn-contest-sponsor')) 
                document.getElementById('dyn-contest-sponsor').innerText = info.sponsor || 'পাথরঘাটা ডিজিটাল';
            if(document.getElementById('dyn-contest-date')) 
                document.getElementById('dyn-contest-date').innerText = info.endDate || 'অনির্দিষ্ট';
            
            // পুরস্কার সেকশন
            const prizeContainer = document.getElementById('dyn-contest-prizes-container');
            if(prizeContainer) {
                if (info.prizes && info.prizes.trim() !== "") {
                    document.getElementById('dyn-contest-prizes').innerText = info.prizes;
                    prizeContainer.classList.remove('hidden-custom');
                } else {
                    prizeContainer.classList.add('hidden-custom');
                }
            }
            
            // নিয়মাবলি (Rules)
            const rulesList = document.getElementById('dyn-contest-rules-list');
            if(rulesList) {
                if(info.rules && Array.isArray(info.rules)) {
                    rulesList.innerHTML = info.rules.map(rule => 
                        `<li class="flex items-start gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-1"></i> <span>${window.escapeHTML(rule)}</span></li>`
                    ).join('');
                }
            }
        }
    });
};

// --- ২. প্রতিযোগিতার ফিড লোড করা (সব অংশগ্রহণকারীর ছবি) ---
window.loadContestFeed = () => {
    window.loadContestInfo(); // তথ্য আগে লোড হবে
    const grid = document.getElementById('contest-photos-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-2 flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>';

    window.fb.get(window.fb.ref(window.db, 'contest_participants')).then(async (snap) => {
        const data = snap.val();
        if (!data) {
            grid.innerHTML = '<p class="col-span-2 text-center text-gray-400 py-10">এখনো কেউ অংশগ্রহণ করেনি</p>';
            document.getElementById('contest-total-participants').innerText = "0 জন";
            return;
        }

        // চেক করা ইউজার ইতিমধ্যে ভোট দিয়েছে কিনা
        const myVotesSnap = await window.fb.get(window.fb.ref(window.db, `contest_votes_by_user/${window.currentUser.uid}`));
        const myVotedUid = myVotesSnap.exists() ? myVotesSnap.val().votedFor : null;

        const participants = Object.values(data).sort((a, b) => b.votes - a.votes); // বেশি ভোট উপরে থাকবে
        document.getElementById('contest-total-participants').innerText = `${participants.length} জন`;

        grid.innerHTML = participants.map((p, index) => {
            const isVotedByMe = (myVotedUid === p.uid);
            const rankBadge = (index === 0 && p.votes > 0) ? `<div class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md z-10"><i class="fa-solid fa-crown text-sm"></i></div>` : '';
            
            let actionBtnHtml = '';
            if (isVotedByMe) {
                actionBtnHtml = `<button class="w-full mt-2 bg-green-100 text-green-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border border-green-200" disabled><i class="fa-solid fa-check-circle"></i> ভোটেড</button>`;
            } else if (myVotedUid) {
                actionBtnHtml = `<button class="w-full mt-2 bg-gray-100 text-gray-400 py-2 rounded-lg font-bold text-xs cursor-not-allowed" disabled>ভোট দিয়েছেন</button>`;
            } else if (p.uid === window.currentUser.uid) {
                actionBtnHtml = `<button onclick="deleteContestPhoto('${p.uid}')" class="w-full mt-2 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-xs border border-red-200 hover:bg-red-100 transition"><i class="fa-solid fa-trash"></i> ডিলিট করুন</button>`;
            } else {
                actionBtnHtml = `<button onclick="voteForContestant('${p.uid}')" id="vote-btn-${p.uid}" class="w-full mt-2 bg-purple-600 text-white py-2 rounded-lg font-bold text-xs shadow hover:bg-purple-700 transform active:scale-95 transition flex items-center justify-center gap-1"><i class="fa-solid fa-heart"></i> ভোট দিন</button>`;
            }

            return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative flex flex-col">
                ${rankBadge}
                <div class="h-40 w-full relative bg-gray-100" onclick="window.openImageViewer('${p.image}')">
                    <img src="${p.image}" class="w-full h-full object-cover cursor-pointer">
                    <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
                        <i class="fa-solid fa-heart text-pink-400"></i> <span id="vote-count-${p.uid}">${p.votes || 0}</span>
                    </div>
                </div>
                <div class="p-2 flex-1 flex flex-col justify-between">
                    <div class="flex items-center gap-2 mb-1">
                        <img src="${p.authorPic || 'https://via.placeholder.com/40'}" class="w-6 h-6 rounded-full object-cover border border-gray-200">
                        <span class="text-xs font-bold text-gray-800 truncate">${window.escapeHTML(p.authorName)}</span>
                    </div>
                    <p class="text-[10px] text-gray-500 line-clamp-2 mb-1">${window.escapeHTML(p.caption)}</p>
                    ${actionBtnHtml}
                </div>
            </div>`;
        }).join('');
    });
};

// --- ৩. ভোট প্রদান লজিক (Super Fast Update) ---
window.voteForContestant = async (participantUid) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ছবিটিতে ভোট দিতে চান?\n(একবার ভোট দিলে তা আর পরিবর্তন করা যাবে না)")) return;

    const btn = document.getElementById(`vote-btn-${participantUid}`);
    const countSpan = document.getElementById(`vote-count-${participantUid}`);

    // ইনভ্যালিড ক্লিক রোধ ও দ্রুত ইউআই আপডেট
    if (countSpan) countSpan.innerText = (parseInt(countSpan.innerText) || 0) + 1;
    if (btn) {
        btn.className = "w-full mt-2 bg-green-100 text-green-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border border-green-200";
        btn.innerHTML = 'ভোটেড';
        btn.disabled = true;
    }
    
    // অন্য সব ভোট বাটন ডিসেবল করা
    document.querySelectorAll('[id^="vote-btn-"]').forEach(b => b.disabled = true);

    try {
        const myVoteRef = window.fb.ref(window.db, `contest_votes_by_user/${window.currentUser.uid}`);
        const myVoteSnap = await window.fb.get(myVoteRef);

        if (myVoteSnap.exists()) {
            window.showToast("আপনি ইতিমধ্যে একজনকে ভোট দিয়েছেন!", "error");
            window.loadContestFeed();
            return;
        }

        // ভোট সংখ্যা বাড়ানো (Transaction)
        await window.fb.runTransaction(window.fb.ref(window.db, `contest_participants/${participantUid}/votes`), (v) => (v || 0) + 1);

        // রেকর্ড সেভ
        await window.fb.set(myVoteRef, { votedFor: participantUid, timestamp: Date.now() });

        window.showToast("ভোট সফল হয়েছে!", "success");
    } catch (error) {
        console.error("Voting error:", error);
        window.showToast("ভোট দিতে সমস্যা হয়েছে", "error");
        window.loadContestFeed();
    }
};

// --- ৪. প্রতিযোগিতায় ছবি আপলোড ---
window.submitContestPhoto = async () => {
    const file = document.getElementById('contest-img-input').files[0];
    const caption = document.getElementById('contest-caption').value.trim();

    if (!file) return window.showToast("দয়া করে ছবি নির্বাচন করুন", "error");

    const btn = document.getElementById('btn-contest-submit');
    btn.innerHTML = 'আপলোড হচ্ছে...';
    btn.disabled = true;

    try {
        const res = await window.uploadMediaToCloudinary(file);
        const contestData = {
            uid: window.currentUser.uid,
            authorName: window.userDetails.name,
            authorPic: window.userDetails.profile_pic || '',
            image: res.url,
            caption: caption,
            votes: 0,
            timestamp: Date.now()
        };

        await window.fb.set(window.fb.ref(window.db, `contest_participants/${window.currentUser.uid}`), contestData);
        
        window.showToast("ছবি সফলভাবে আপলোড হয়েছে!", "success");
        window.toggleContestModal(false);
        window.loadContestFeed();
    } catch (e) {
        window.showToast("সমস্যা হয়েছে: " + e.message, "error");
    } finally {
        btn.innerHTML = 'সাবমিট করুন';
        btn.disabled = false;
    }
};

// --- ৫. নিজের ছবি মুছে ফেলা ---
window.deleteContestPhoto = async (participantUid) => {
    if(!confirm("ছবিটি মুছে ফেললে প্রাপ্ত ভোটগুলোও মুছে যাবে। ডিলিট করবেন?")) return;
    try {
        await window.fb.remove(window.fb.ref(window.db, `contest_participants/${participantUid}`));
        window.showToast("মুছে ফেলা হয়েছে");
        window.loadContestFeed();
    } catch (e) { window.showToast(e.message, "error"); }
};
