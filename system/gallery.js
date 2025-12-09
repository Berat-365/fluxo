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
            case 'local': items = await getLocalWallpapers(); break;
            case 'history': items = await getHistoryWallpapers(); break; 
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

    // create HTML with data-attributes (no inline onclick)
    bgGalleryGrid.innerHTML = items.map(item => `
        <div class="gallery-item" data-url="${item.url}" data-type="${item.type}" data-title="${(item.title||'').replace(/"/g,'&quot;')}">
            ${item.type === 'image' 
                ? `<img src="${item.thumb}" alt="${(item.title||'').replace(/"/g,'&quot;')}">`
                : item.type === 'youtube'
                ? `<img src="${item.thumb}" alt="${(item.title||'').replace(/"/g,'&quot;')}">
                   <div class="gallery-source">YouTube</div>`
                : `<video src="${item.url}" muted loop playsinline preload="metadata" poster="${item.thumb || ''}"></video>`
            }
            <div class="overlay">
                <div><strong>${item.title}</strong></div>
                <div style="font-size:0.8em; opacity:0.8;">${item.author || item.source}</div>
            </div>
            <div class="gallery-source">${item.source}</div>
        </div>
    `).join('');

    // Video önizleme (try play; bazı tarayıcılarda hata fırlatabilir)
    bgGalleryGrid.querySelectorAll('video').forEach(v => {
        v.muted = true;
        v.play().catch(() => {});
    });

    // Attach click listeners (sağlam ve tarayıcı uyumlu)
    bgGalleryGrid.querySelectorAll('.gallery-item').forEach(el => {
        el.addEventListener('click', () => {
            const url = el.dataset.url;
            const type = el.dataset.type || 'image';
            window.selectBackground(url, type);
        });
    });
}

// === ARKA PLAN SEÇ ===
window.selectBackground = async (url, type = 'image') => {
    const status = document.getElementById('applyStatus');
    try {
        if (type === 'image') {
            // Ön yükleme: Image ile dene, hata olursa fetch+blob fallback
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = async () => {
                    // fallback: fetch blob (bazı yönlendirme/CORS durumlarında işe yarayabilir)
                    try {
                        const res = await fetch(url, { mode: 'cors' });
                        if (!res.ok) throw new Error('Fetch hatası');
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        applyBackground(blobUrl);
                        // Lokal olarak orijinal URL'i kaydet (reload sonrası orijinal URL kullanılacak)
                        localStorage.setItem('bgUrl', url);
                        localStorage.setItem('bgType', type);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                };
                // bazı kaynaklar için crossOrigin denenebilir, fakat ön tanımlı bırakıyoruz
                img.src = url;
            });

            // Eğer preload başarılıysa doğrudan uygulama
            applyBackground(url);
        } else {
            // video / youtube vb.
            applyBackground(url);
        }

        // Başarılı durum
        localStorage.setItem('bgUrl', url);
        localStorage.setItem('bgType', type);
        bgGalleryModal.style.display = 'none';

        if (status) {
            status.textContent = 'Arka plan galeriden uygulandı!';
            status.className = 'status-message success';
            status.style.display = 'block';
            setTimeout(() => status.style.display = 'none', 2000);
        }
    } catch (err) {
        if (status) {
            status.textContent = `Arka plan yüklenemedi: ${err.message || 'Bilinmeyen hata'}`;
            status.className = 'status-message error';
            status.style.display = 'block';
            setTimeout(() => status.style.display = 'none', 3000);
        } else {
            console.error('selectBackground error:', err);
        }
    }
};

// === ARKAPLAN GALERİSİ BUTONU ===
document.addEventListener('DOMContentLoaded', () => {
    const galleryBtn = document.getElementById('backgroundGalleryBtn');
    if (galleryBtn) {
        galleryBtn.addEventListener('click', openBgGallery);
    }
});
