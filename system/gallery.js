// system/gallery.js
import { applyBackground } from './background.js';

const bgGalleryModal = document.getElementById('bgGalleryModal');
const bgGalleryGrid = document.getElementById('bgGalleryGrid');
const bgSearchInput = document.getElementById('bgSearchInput');
const bgGalleryTabs = document.querySelectorAll('.gallery-tab');
const bgGalleryClose = document.getElementById('bgGalleryClose');

let currentSource = 'unsplash';
let currentQuery = '';
let isLoading = false;

// === API ANAHTARLARI (İSTEĞE BAĞLI) ===
const UNSPLASH_ACCESS_KEY = 'HGaCkfhGPrDCzVk9e7tNJeXfAgV7uqAOs1uDTCKI9pA'; // https://unsplash.com/developers
const PEXELS_API_KEY = 'oNLxZGxGuTCK0gwWnavoQgpaf55gfKfL3vsnKYePphsrz835dyqkOwI7';         // https://www.pexels.com/api/

// === MODAL AÇ/KAPAT ===
window.openBgGallery = () => {
    bgGalleryModal.style.display = 'flex';
    loadGalleryItems();
};

bgGalleryClose.onclick = () => {
    bgGalleryModal.style.display = 'none';
};

// === TAB DEĞİŞTİRME ===
bgGalleryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        bgGalleryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSource = tab.dataset.source;
        loadGalleryItems();
    });
});

// === ARAMA (DEBOUNCE) ===
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

bgSearchInput.addEventListener('input', debounce(() => {
    currentQuery = bgSearchInput.value.trim();
    loadGalleryItems();
}, 500));

// === GALERİYİ YÜKLE ===
async function loadGalleryItems() {
    if (isLoading) return;
    isLoading = true;
    bgGalleryGrid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        let items = [];
        switch (currentSource) {
            case 'unsplash': items = await fetchUnsplash(); break;
            case 'pexels': items = await fetchPexels(); break;
            case 'youtube': items = await fetchYouTubeSuggestions(); break;
            case 'local': items = await getLocalWallpapers(); break;
            case 'history': items = await getHistoryWallpapers(); break; // YENİ
        }
        renderGalleryItems(items);
    } catch (err) {
        bgGalleryGrid.innerHTML = `<p style="color:#ff6b6b; text-align:center;">Hata: ${err.message}</p>`;
    } finally {
        isLoading = false;
    }
}

// === GEÇMİŞ ARKA PLANLAR ===
async function getHistoryWallpapers() {
    const history = JSON.parse(localStorage.getItem('wallpapers') || '[]');
    
    // En yeniden eskiye sırala
    return history.reverse().map(item => ({
        type: item.type || 'image',
        url: item.url,
        thumb: item.type === 'youtube' 
            ? `https://img.youtube.com/vi/${item.url.split('embed/')[1]}/hqdefault.jpg`
            : item.url,
        title: item.name || 'Adsız',
        source: 'Geçmiş',
        timestamp: item.timestamp || 0
    }));
}

// === UNSPLASH ===
async function fetchUnsplash() {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY.includes('YOUR_')) {
        throw new Error('Unsplash API anahtarı eksik');
    }
    const query = currentQuery || 'wallpaper';
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Unsplash API hatası');
    const data = await res.json();
    return data.results.map(photo => ({
        type: 'image',
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        title: photo.alt_description || 'Adsız',
        author: photo.user.name,
        source: 'Unsplash'
    }));
}

// === PEXELS ===
async function fetchPexels() {
    if (!PEXELS_API_KEY || PEXELS_API_KEY.includes('YOUR_')) {
        throw new Error('Pexels API anahtarı eksik');
    }
    const query = currentQuery || 'nature';
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`;
    const res = await fetch(url, {
        headers: { Authorization: PEXELS_API_KEY }
    });
    if (!res.ok) throw new Error('Pexels API hatası');
    const data = await res.json();
    return data.photos.map(photo => ({
        type: 'image',
        url: photo.src.large,
        thumb: photo.src.tiny,
        title: photo.alt || 'Adsız',
        author: photo.photographer,
        source: 'Pexels'
    }));
}

// === YOUTUBE (STATİK ÖNERİLER) ===
async function fetchYouTubeSuggestions() {
    const suggestions = [
        { id: 'dQw4w9WgXcQ', title: 'Rain on Window', author: 'Relaxing White Noise' },
        { id: '5qap5aO4i9A', title: 'Ocean Waves', author: 'Nature Relaxation' },
        { id: '3A1X5fYb2gM', title: 'Forest Ambience', author: 'The Guild of Ambience' },
        { id: '1z3X2Zx2X3A', title: 'City Night', author: 'Ambient Worlds' }
    ];
    return suggestions.map(video => ({
        type: 'youtube',
        url: `https://www.youtube.com/embed/${video.id}`,
        thumb: `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
        title: video.title,
        author: video.author,
        source: 'YouTube'
    }));
}

// === YEREL DUVAR KAĞITLARI ===
async function getLocalWallpapers() {
    const recent = JSON.parse(localStorage.getItem('wallpapers') || '[]');
    return recent.slice(0, 20).map(item => ({
        type: item.type || 'image',
        url: item.url,
        thumb: item.url,
        title: item.name || 'Yerel',
        source: 'Yerel'
    }));
}

// === RENDER ===
function renderGalleryItems(items) {
    if (items.length === 0) {
        bgGalleryGrid.innerHTML = '<p style="color:#aaa; text-align:center; grid-column:1/-1;">Sonuç bulunamadı.</p>';
        return;
    }

    bgGalleryGrid.innerHTML = items.map(item => `
        <div class="gallery-item" onclick="window.selectBackground('${item.url}', '${item.type}')">
            ${item.type === 'image' 
                ? `<img src="${item.thumb}" alt="${item.title}">`
                : item.type === 'youtube'
                ? `<img src="${item.thumb}" alt="${item.title}">
                   <div class="gallery-source">YouTube</div>`
                : `<video src="${item.url}" muted loop></video>`
            }
            <div class="overlay">
                <div><strong>${item.title}</strong></div>
                <div style="font-size:0.8em; opacity:0.8;">${item.author || item.source}</div>
            </div>
            <div class="gallery-source">${item.source}</div>
        </div>
    `).join('');

    // Video önizleme
    bgGalleryGrid.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
}

// === ARKA PLAN SEÇ ===
window.selectBackground = (url, type = 'image') => {
    localStorage.setItem('bgUrl', url);
    localStorage.setItem('bgType', type);
    applyBackground(url);
    bgGalleryModal.style.display = 'none';

    const status = document.getElementById('applyStatus');
    if (status) {
        status.textContent = 'Arka plan galeriden uygulandı!';
        status.className = 'status-message success';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 2000);
    }
};

// === ARKAPLAN GALERİSİ BUTONU ===
document.addEventListener('DOMContentLoaded', () => {
    const galleryBtn = document.getElementById('backgroundGalleryBtn');
    if (galleryBtn) {
        galleryBtn.addEventListener('click', openBgGallery);
    }
});
