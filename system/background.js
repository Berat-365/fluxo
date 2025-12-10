// system/background.js

const backgroundVideo = document.getElementById('backgroundVideo');
const backgroundYouTube = document.getElementById('backgroundYouTube');
const recentBgList = document.getElementById('recentBgList');

// === 1. ARKA PLAN UYGULA ===
export function applyBackground(bgUrl = '') {
    if (!bgUrl) {
        if (backgroundVideo) {
            backgroundVideo.style.display = 'none';
            backgroundVideo.src = '';
        }
        if (backgroundYouTube) {
            backgroundYouTube.style.display = 'none';
            backgroundYouTube.src = '';
        }
        document.body.style.backgroundImage = '';
        return;
    }

    if (bgUrl.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(bgUrl)) {
        if (backgroundVideo) {
            backgroundVideo.src = bgUrl;
            backgroundVideo.style.display = 'block';
        }
        if (backgroundYouTube) backgroundYouTube.style.display = 'none';
        document.body.style.backgroundImage = '';
    }
    else if (bgUrl.includes('youtube.com') || bgUrl.includes('youtu.be')) {
        const videoId = bgUrl.match(/(?:watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/)?.[1];
        if (backgroundYouTube && videoId) {
 backgroundYouTube.src =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1` +
    `&mute=1` +
    `&loop=1` +
    `&playlist=${videoId}` +
    `&controls=0` +
    `&modestbranding=1` +
    `&playsinline=1` +
    `&enablejsapi=1`;

            backgroundYouTube.style.display = 'block';
        }
        if (backgroundVideo) backgroundVideo.style.display = 'none';
        document.body.style.backgroundImage = '';
    }
    else {
        if (backgroundVideo) backgroundVideo.style.display = 'none';
        if (backgroundYouTube) backgroundYouTube.style.display = 'none';
        document.body.style.backgroundImage = `url('${bgUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    }
}

// === 2. SADECE ARKA PLANI KALDIR (Geçmişe dokunma!) ===
export function removeBackground() {
    localStorage.removeItem('bgUrl');
    localStorage.removeItem('bgType');
    applyBackground(''); // Temizle
}

// === 3. SADECE GEÇMİŞTEN SİL (Arka planı etkilemez!) ===
export function removeFromHistory(index) {
    let wallpapers = JSON.parse(localStorage.getItem('wallpapers') || '[]');
    if (index < 0 || index >= wallpapers.length) return;

    wallpapers.splice(index, 1);
    localStorage.setItem('wallpapers', JSON.stringify(wallpapers));
    renderRecentBgList(); // Yeniden çiz
}

// === 4. GEÇMİŞE EKLE ===
export function addToHistory(url, type = 'url', name = '') {
    if (!url) return;
    const finalName = name || url.split('/').pop().split('?')[0].substring(0, 30);
    let wallpapers = JSON.parse(localStorage.getItem('wallpapers') || '[]');
    wallpapers = wallpapers.filter(w => w.url !== url);
    wallpapers.unshift({ url, type, name: finalName, timestamp: Date.now() });
    localStorage.setItem('wallpapers', JSON.stringify(wallpapers.slice(0, 50)));
    renderRecentBgList();
}

// === 5. GEÇMİŞİ GÖSTER ===
export function renderRecentBgList() {
    if (!recentBgList) return;
    const wallpapers = JSON.parse(localStorage.getItem('wallpapers') || '[]');
    recentBgList.innerHTML = '';

    if (wallpapers.length === 0) {
        recentBgList.classList.add('hidden');
        return;
    }

    wallpapers.forEach((w, index) => {
        const div = document.createElement('div');
        div.className = 'recent-bg-item';
        div.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 4px; padding: 4px; border-radius: 6px; transition: background 0.2s;';
        div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.1)';
        div.onmouseout = () => div.style.background = '';

        let thumb = 'ico/default-thumbnail.png';
        if (w.type === 'file' && w.url.startsWith('data:image')) thumb = w.url;
        else if (w.type === 'file' && w.url.startsWith('data:video')) thumb = w.url;
        else if (w.url.includes('youtube.com') || w.url.includes('youtu.be')) {
            const vid = w.url.match(/(?:watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/)?.[1];
            thumb = vid ? `https://img.youtube.com/vi/${vid}/default.jpg` : thumb;
        } else if (/\.(jpe?g|png|gif|webp)$/i.test(w.url)) {
            thumb = w.url;
        }

        div.innerHTML = `
            <img src="${thumb}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;" 
                 onerror="this.src='ico/default-thumbnail.png'" alt="${w.name}">
            <span style="flex: 1; word-break: break-all; font-size: 0.9rem;">${w.name}</span>
            <span class="remove-bg-btn" style="color: #ff4444; font-weight: bold; cursor: pointer; font-size: 1.2rem;">×</span>
        `;

        // Tıkla → uygula
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-bg-btn')) return;
            localStorage.setItem('bgUrl', w.url);
            localStorage.setItem('bgType', w.type);
            applyBackground(w.url);
        });

        // Sadece geçmişten sil
        const removeBtn = div.querySelector('.remove-bg-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromHistory(index); // Sadece listeden siler
        });

        recentBgList.appendChild(div);
    });

    recentBgList.classList.remove('hidden');
}

// === 6. DOSYA YÜKLEME ===
document.getElementById('bgFileInput')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        const dataUrl = evt.target.result;
        localStorage.setItem('bgUrl', dataUrl);
        localStorage.setItem('bgType', 'file');
        addToHistory(dataUrl, 'file', file.name);
        applyBackground(dataUrl);
        document.getElementById('bgUrlInput').value = '';
    };
    reader.readAsDataURL(file);
});

// === 7. URL GİRİŞİ ===
document.getElementById('bgUrlInput')?.addEventListener('change', function () {
    const url = this.value.trim();
    if (!url) return;

    localStorage.setItem('bgUrl', url);
    localStorage.setItem('bgType', 'url');
    addToHistory(url, 'url');
    applyBackground(url);
    this.value = '';
});

// === 8. SAYFA YÜKLENİNCE ===
document.addEventListener('DOMContentLoaded', () => {
    const savedUrl = localStorage.getItem('bgUrl');
    if (savedUrl) applyBackground(savedUrl);
    renderRecentBgList();
});