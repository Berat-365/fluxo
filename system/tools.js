// Panel aç/kapat (weather gizle/göster) - Null kontrolleri güçlendirildi
window.toggleToolsPanel = function() {
    const panel = document.getElementById('toolsPanel');
    const weatherWidget = document.getElementById('weatherWidget');
    
    if (!panel) {
        console.warn('toolsPanel bulunamadı!');
        return;
    }
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        setTimeout(() => {
            if (panel) panel.style.display = 'none'; // Ekstra null koruma
        }, 200); // Animasyon bitince gizle
        if (weatherWidget) {
            weatherWidget.style.display = 'block';
        }
    } else {
        if (panel) panel.style.display = 'block';
        setTimeout(() => {
            if (panel) panel.classList.add('open'); // Ekstra null koruma
        }, 10); // Sonra animasyon
        if (weatherWidget) {
            weatherWidget.style.display = 'none';
        }
    }
};

// Saat ve tarih güncelle
window.updateClock = function() {
    const now = new Date();
    const userLocale = navigator.language || 'en-US'; // tarayıcı dili
    
    // Kullanıcının seçtiği saat formatını al
    const hourFormatSelect = document.getElementById('hourSelections');
    const hour12 = hourFormatSelect ? hourFormatSelect.value === '12' : false;
    
    const time = now.toLocaleTimeString(userLocale, { hour12: hour12 });
    const date = now.toLocaleDateString(userLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const clockEl = document.getElementById('clockDisplay');
    const dateEl = document.getElementById('dateDisplay');
    
    if (clockEl) clockEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
};

// Başlat
updateClock(); // hemen göster
setInterval(updateClock, 1000); // her saniye güncelle

// Saat formatı değiştiğinde anında güncelle
const hourFormatSelect = document.getElementById('hourSelections');
if (hourFormatSelect) {
    hourFormatSelect.addEventListener('change', updateClock);
}


// Başlat
updateClock(); // hemen göster
setInterval(updateClock, 1000); // her saniye güncelle

// Döviz Kuru Çevirici
window.convertCurrency = async function() {
    const from = document.getElementById('currencyFrom')?.value || 'USD';
    const to = document.getElementById('currencyTo')?.value || 'EUR';
    const amountInput = document.getElementById('currencyAmount');
    const amount = parseFloat(amountInput?.value) || 1;
    const resultEl = document.getElementById('currencyResult');
    if (!resultEl) return;
    
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const rate = data.rates[to];
        if (rate) {
            const converted = amount * rate;
            resultEl.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
        } else {
            resultEl.textContent = 'Geçersiz para birimi';
        }
    } catch (error) {
        resultEl.textContent = 'Hata: Dönüşüm yapılamadı';
        console.error('Currency conversion error:', error);
    }
};

// Haber Getir (10 haber - Ülke Seçenekli)
window.fetchNews = async function() {
    const newsEl = document.getElementById('newsList');
    const countrySelect = document.getElementById('newsCountry');
    if (!newsEl || !countrySelect) return;
    try {
        const rssUrl = countrySelect.value;
        // Alternatif CORS proxy (codetabs)
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');
        let html = '';
        for (let i = 0; i < Math.min(10, items.length); i++) {
            const item = items[i];
            if (item) {
                const title = item.querySelector('title')?.textContent || 'Başlık yok';
                const link = item.querySelector('link')?.textContent || '#';
                html += `<li><a href="${link}" target="_blank">${title}</a></li>`;
            }
        }
        newsEl.innerHTML = html || '<li>Haber bulunamadı</li>';
    } catch (error) {
        newsEl.innerHTML = '<li>Hata: Haberler alınamadı</li>';
        console.error('News fetch error:', error);
    }
};

// Not ekle
window.addNote = function() {
    const input = document.getElementById('noteInput');
    if (!input) return;
    const note = input.value.trim();
    if (note) {
        let notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
        input.value = '';
        window.loadNotes();
    }
};

// Notları yükle
window.loadNotes = function() {
    const list = document.getElementById('notesList');
    if (!list) return;
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    list.innerHTML = notes.map((note, index) => `
        <li>
            <span>${note}</span>
            <button class="small-accent danger" onclick="window.removeNote(${index})" data-lang-key="delete">Sil</button>
        </li>
    `).join('');
};

// Not sil
window.removeNote = function(index, e) { // Added e parameter
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    window.loadNotes();
    // Paneli kapatmayı engelle
    const panel = document.getElementById('toolsPanel');
    if (panel && panel.classList.contains('open')) {
        panel.style.display = 'block'; // Panel açık kalsın
    }
    // Prevent closing the panel when deleting a note
    if (e) {
        e.stopPropagation(); // Prevent event bubbling
    }
};

// QR oluştur - DÜZELTİLDİ: Canvas callback'ten alınıyor, div'e append ediliyor
window.generateQR = function() {
    const input = document.getElementById('qrInput');
    const display = document.getElementById('qrDisplay');
    const downloadBtn = document.getElementById('downloadQrBtn'); // Buton kontrolü eklendi
    if (!input || !display) return;
    const text = input.value;
    display.innerHTML = ''; // Temizle
    if (downloadBtn) downloadBtn.style.display = 'none'; // Butonu gizle (önceki QR'ı temizle)
    if (text) {
        // Loading göster
        display.innerHTML = '<p style="color: orange;">...</p>';
        
        // QRCode kontrolü + retry
        const tryGenerate = () => {
            if (typeof QRCode === 'undefined') {
                // 200ms sonra tekrarla (basit retry, max 5 deneme için sayaç ekleyebilirsin)
                setTimeout(tryGenerate, 200);
                return;
            }
            // DÜZELTME: Canvas parametresini atla, callback'ten al ve append et
            QRCode.toCanvas(text, { width: 200 }, (error, canvas) => {
                if (error) {
                    display.innerHTML = '<p style="color: red;">!</p>';
                    console.error(error);
                } else {
                    display.innerHTML = ''; // Loading'i sil
                    display.appendChild(canvas); // Canvas'ı div'e ekle
                    console.log('QR Created!');
                    if (downloadBtn) downloadBtn.style.display = 'block'; // Başarılıysa butonu göster
                }
            });
        };
        tryGenerate();
    } else {
        display.innerHTML = '<p>...!</p>';
    }
};

// QR indirme - Null kontrolü eklendi
window.downloadQR = function() {
    const canvas = document.querySelector('#qrDisplay canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = canvas.toDataURL();
        link.click();
        console.log('QR indirildi!');
    } else {
        console.warn('İndirilecek QR canvas bulunamadı!');
    }
};

// Panel dışına tıkla kapat - Null kontrolleri eklendi
document.addEventListener('click', (e) => {
    const panel = document.getElementById('toolsPanel');
    if (!panel) return;
    const widget = document.getElementById('toolsWidget');
    if (panel.classList.contains('open') && widget && !widget.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.remove('open');
        setTimeout(() => {
            if (panel) panel.style.display = 'none'; // Ekstra null koruma
        }, 200);
        const weatherWidget = document.getElementById('weatherWidget');
        if (weatherWidget) {
            weatherWidget.style.display = 'block';
        }
    }
});

// Draggable Widget Reordering (Garantili Yer Değiştirme)
function initDraggable() {
    const widgetGrid = document.querySelector('.widget-grid');
    if (!widgetGrid) return;
    let draggedItem = null;

    widgetGrid.addEventListener('dragstart', (e) => {
        if (e.target.closest('.widget-item')) {
            draggedItem = e.target.closest('.widget-item');
            draggedItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', ''); // Vanilla drag için
        }
    });

    widgetGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const afterElement = getDragAfterElement(widgetGrid, e.clientY);
        if (afterElement == null) {
            widgetGrid.appendChild(draggedItem);
        } else {
            widgetGrid.insertBefore(draggedItem, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    widgetGrid.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem) {
            setTimeout(() => { // Gecikme ile smooth drop
                document.querySelectorAll('.widget-item').forEach(item => {
                    item.classList.remove('dragging', 'drag-over');
                });
                saveWidgetOrder();
            }, 0);
        }
    });

    widgetGrid.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            saveWidgetOrder();
        }
        draggedItem = null;
    });

    // Widget sırasını kaydet
    function saveWidgetOrder() {
        const order = Array.from(widgetGrid.children).map(item => item.id);
        localStorage.setItem('widgetOrder', JSON.stringify(order));
    }

    // Sırayı yükle
    function loadWidgetOrder() {
        const savedOrder = JSON.parse(localStorage.getItem('widgetOrder') || '[]');
        if (savedOrder.length > 0) {
            savedOrder.forEach(id => {
                const item = document.getElementById(id);
                if (item) widgetGrid.appendChild(item);
            });
        }
    }

    loadWidgetOrder(); // İlk yükle
}

// Başlatma fonksiyonu - DOM hazır olunca çalıştır
document.addEventListener('DOMContentLoaded', function() {
    initTools();
});

function initTools() {
    window.updateClock(); 
    setInterval(window.updateClock, 1000);
    window.loadNotes(); // Notları yükle
    window.fetchNews();
    setInterval(window.fetchNews, 300000); // 5 dakikada bir güncelle
    initDraggable();
}