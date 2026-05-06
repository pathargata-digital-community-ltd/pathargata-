/** 
 * Feed.js - পাথরঘাটা ডিজিটাল
 * এখানে পোস্ট তৈরি, নিউজ ফিড লোড, পোল, লাইক, কমেন্ট এবং ২৪ ঘণ্টার নোটস লজিক রয়েছে।
 */

// --- গ্লোবাল ফিড ভেরিয়েবলস ---
window.lastLoadedPostKey = null;
window.isFeedLoading = false;
window.hasMorePosts = true;
window.currentFeedFilter = 'all';

// --- ১. অ্যালগরিদম স্কোরিং (পোস্ট র‍্যাঙ্কিং) ---
window.calculatePostScore = (post) => {
    const now = Date.now();
    const hoursAge = (now - post.timestamp) / (1000 * 60 * 60);
    const likeCount = post.likes ? Object.keys(post.likes).length : 0;
    const commentCount = post.comments ? Object.keys(post.comments).length : 0;
    let points = (likeCount * 10) + (commentCount * 20);

    if (['admin', 'journalist'].includes(post.authorRole)) points += 50;
    if (post.adminScore) points += parseInt(post.adminScore);

    return (points + 1) / Math.pow((hoursAge + 2), 1.8);
};

// --- ২. নিউজ ফিড লোডার ---
window.loadFeed = (type, isInitial = false) => {
    if (window.isFeedLoading) return;
    window.isFeedLoading = true;
    window.currentFeedFilter = type;

    const feedDiv = document.getElementById('news-feed');
    const loaderArea = document.getElementById('feed-loader-area');

    if (isInitial) {
        window.lastLoadedPostKey = null;
        window.hasMorePosts = true;
        feedDiv.innerHTML = '<div class="p-4 space-y-4"><div class="h-40 w-full skeleton"></div><div class="h-40 w-full skeleton"></div></div>';
    }

    const pageSize = 15;
    let postsQuery;
    const dbRef = window.fb.ref(window.db, 'posts');

    if (type === 'union' && window.userDetails.union) {
        postsQuery = window.fb.query(dbRef, window.fb.orderByChild('union'), window.fb.equalTo(window.userDetails.union), window.fb.limitToLast(pageSize));
    } else if (type === 'village' && window.userDetails.village) {
        postsQuery = window.fb.query(dbRef, window.fb.orderByChild('village'), window.fb.equalTo(window.userDetails.village), window.fb.limitToLast(pageSize));
    } else {
        if (isInitial) postsQuery = window.fb.query(dbRef, window.fb.orderByKey(), window.fb.limitToLast(pageSize));
        else postsQuery = window.fb.query(dbRef, window.fb.orderByKey(), window.fb.endAt(window.lastLoadedPostKey), window.fb.limitToLast(pageSize + 1));
    }

    window.fb.get(postsQuery).then((snapshot) => {
        const data = snapshot.val();
        if (isInitial) feedDiv.innerHTML = '';

        if (!data) {
            if (isInitial) feedDiv.innerHTML = '<p class="text-center text-gray-400 py-10">কোনো পোস্ট নেই</p>';
            window.hasMorePosts = false;
        } else {
            let postsArr = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
            postsArr.sort((a, b) => (a.id < b.id ? 1 : -1)); // সময় অনুযায়ী সাজানো

            if (!isInitial) postsArr = postsArr.filter(p => p.id !== window.lastLoadedPostKey);
            if (postsArr.length > 0) window.lastLoadedPostKey = postsArr[postsArr.length - 1].id;
            if (postsArr.length < pageSize) window.hasMorePosts = false;

            // অ্যালগরিদম প্রয়োগ
            postsArr.forEach(p => p.algorithmicScore = window.calculatePostScore(p));
            postsArr.sort((a, b) => b.algorithmicScore - a.algorithmicScore);

            let html = '';
            postsArr.forEach((post, index) => {
                html += window.createPostHTML(post, post.id);
                // বিজ্ঞাপন ইনজেকশন (প্রতি ৫টি পোস্ট পর পর)
                if ((index + 1) % 5 === 0 && window.allAds && window.allAds.length > 0) {
                    const ad = window.allAds[Math.floor(Math.random() * window.allAds.length)];
                    html += window.createAdHTML(ad);
                }
            });
            feedDiv.insertAdjacentHTML('beforeend', html);
        }
        window.isFeedLoading = false;
        if (loaderArea) loaderArea.classList.toggle('hidden', !window.hasMorePosts);
    });
};

// --- ৩. পোস্ট তৈরি ও পয়েন্ট প্রদান ---
window.submitPost = async () => {
    const text = document.getElementById('post-text').value.trim();
    const files = window.selectedImages || [];
    const bgColor = document.getElementById('selected-post-color').value;

    if (!text && files.length === 0) return window.showToast("কিছু লিখুন!", 'error');

    const btn = document.getElementById('btn-post-submit');
    btn.disabled = true;
    btn.innerHTML = 'আপলোড হচ্ছে...';

    try {
        let mediaUrls = [];
        if (files.length > 0) {
            const uploadPromises = files.map(file => window.uploadMediaToCloudinary(file));
            const results = await Promise.all(uploadPromises);
            mediaUrls = results.map(res => res.url);
        }

        const newPost = {
            uid: window.currentUser.uid,
            author: window.userDetails.name,
            authorPic: window.userDetails.profile_pic || null,
            content: text,
            images: mediaUrls,
            timestamp: Date.now(),
            likes: {}, comments: {},
            bgColor: bgColor,
            union: window.userDetails.union || '',
            authorRole: window.userDetails.role || 'user'
        };

        await window.fb.push(window.fb.ref(window.db, 'posts'), newPost);
        await window.awardPoints('post'); // পয়েন্ট দেওয়া
        window.showToast("পোস্ট করা হয়েছে!");
        window.resetPostForm();
        window.togglePostModal(false);
        window.loadFeed('all', true);
    } catch (e) { window.showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'পোস্ট করুন'; }
};

// --- ৪. লাইক ও কমেন্ট লজিক ---
window.toggleLike = (postId) => {
    const likeRef = window.fb.ref(window.db, `posts/${postId}/likes/${window.currentUser.uid}`);
    window.fb.get(likeRef).then((snap) => {
        if (snap.exists()) {
            window.fb.set(likeRef, null);
        } else {
            window.fb.set(likeRef, true);
            window.awardPoints('like'); // লাইকের জন্য পয়েন্ট
        }
    });
};

window.submitInlineComment = (postId) => {
    const input = document.getElementById(`inline-comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    window.fb.push(window.fb.ref(window.db, `posts/${postId}/comments`), {
        author: window.userDetails.name,
        authorUid: window.currentUser.uid,
        text: text,
        time: Date.now()
    }).then(() => {
        input.value = "";
        window.awardPoints('comment'); // কমেন্টের জন্য পয়েন্ট
    });
};

// --- ৫. ২৪ ঘণ্টার নোটস লজিক ---
window.loadNotes = () => {
    const container = document.getElementById('notes-list-container');
    window.fb.onValue(window.fb.ref(window.db, 'notes'), (snap) => {
        const notes = snap.val() || {};
        const now = Date.now();
        const ONE_DAY = 86400000;

        let html = `<div onclick="toggleNoteModal(true)" class="flex flex-col items-center min-w-[70px] cursor-pointer">
            <div class="relative w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400">
                <i class="fa-solid fa-plus text-gray-500"></i>
            </div>
            <span class="text-[10px] mt-1">Add Note</span>
        </div>`;

        Object.values(notes).forEach(note => {
            if (now - note.timestamp < ONE_DAY) {
                html += `<div class="flex flex-col items-center min-w-[70px]">
                    <div class="note-bubble mb-1">${window.escapeHTML(note.text)}</div>
                    <img src="${note.authorPic || 'https://via.placeholder.com/40'}" class="w-12 h-12 rounded-full border-2 border-blue-400">
                </div>`;
            } else {
                window.fb.remove(window.fb.ref(window.db, `notes/${note.uid}`));
            }
        });
        container.innerHTML = html;
    });
};

// --- ৬. পোল ভোটিং ---
window.votePoll = (postId, optionIdx) => {
    const voteRef = window.fb.ref(window.db, `posts/${postId}/voters/${window.currentUser.uid}`);
    window.fb.get(voteRef).then(snap => {
        if (snap.exists()) return window.showToast("ইতিমধ্যে ভোট দিয়েছেন", 'error');
        window.fb.runTransaction(window.fb.ref(window.db, `posts/${postId}/options/${optionIdx}/votes`), (v) => (v || 0) + 1);
        window.fb.set(voteRef, optionIdx);
    });
};

// --- ৭. পোস্টের HTML জেনারেটর (মূল কোড থেকে নেওয়া) ---
window.createPostHTML = (post, id) => {
    // এখানে আপনার অরিজিনাল কোডের ১৭৮০-১৯৫০ লাইনের HTML টেমপ্লেটটি থাকবে।
    // (সংক্ষিপ্ত করার জন্য এখানে বিস্তারিত দেওয়া হলো না, কিন্তু আপনি আপনার ফাইল থেকে হুবহু বসাবেন)
    return `<div id="post-card-${id}" class="bg-white p-4 rounded-xl shadow-sm mb-3">
        <!-- পোস্ট কন্টেন্ট HTML -->
        <p>${window.escapeHTML(post.content)}</p>
    </div>`;
};
