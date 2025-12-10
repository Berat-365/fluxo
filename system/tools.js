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

window.updateSources = function() {
    const group = document.getElementById('newsCountryGroup').value;
    const sourceSelect = document.getElementById('newsSource');
    sourceSelect.innerHTML = '<option data-lang-key="chooseSource" value=""></option>';

    if (group === 'turkey') {
        const sources = [
            {name: 'TRT Haber', url: 'https://www.trthaber.com/sondakika.rss'},
            {name: 'CNN Türk', url: 'https://www.cnnturk.com/feed/rss/turkiye'},
            {name: 'Yeni Şafak', url: 'https://www.yenisafak.com/rss'},
            {name: 'Sabah', url: 'https://www.sabah.com.tr/rss/gundem.xml'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'world') {
        const sources = [
            {name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml'},
            {name: 'CNN World', url: 'https://rss.cnn.com/rss/edition_world.rss'},
            {name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml'},
            {name: 'The Guardian', url: 'https://www.theguardian.com/world/rss'},
            {name: 'Euronews', url: 'https://www.euronews.com/rss?level=world'},
            {name: 'France 24', url: 'https://www.france24.com/en/rss'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'usa') {
        const sources = [
            {name: 'CNN', url: 'https://rss.cnn.com/rss/edition_world.rss'},
            {name: 'NBC News', url: 'https://feeds.nbcnews.com/nbcnews/public/news'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'uk') {
        const sources = [
            {name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml'},
            {name: 'The Guardian', url: 'https://www.theguardian.com/world/rss'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'europe') {
        const sources = [
            {name: 'Euronews', url: 'https://www.euronews.com/rss?level=world'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'germany') {
        const sources = [
            {name: 'Spiegel', url: 'https://www.spiegel.de/international/index.rss'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'france') {
        const sources = [
            {name: 'France 24', url: 'https://www.france24.com/en/rss'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'russia') {
        const sources = [
            {name: 'RT', url: 'https://www.rt.com/rss/news/'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'middleeast') {
        const sources = [
            {name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'china') {
        const sources = [
            {name: 'SCMP', url: 'https://www.scmp.com/rss/91/feed/'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'japan') {
        const sources = [
            {name: 'Japan Times', url: 'https://www.japantimes.co.jp/feed/'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'india') {
        const sources = [
            {name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms'},
            {name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss'},         
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'canada') {
        const sources = [
            {name: 'Global News World', url: 'https://globalnews.ca/world/feed/'},
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    } else if (group === 'australia') {
        const sources = [
            {name: 'ABC News', url: 'https://www.abc.net.au/news/feed/51120/rss.xml'}
        ];
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.url;
            opt.textContent = s.name;
            sourceSelect.appendChild(opt);
        });
    }
};

// fetchNews (zaten varsa bunu değiştir)
window.fetchNews = async function(force = false) {
    const newsEl = document.getElementById('newsList');
    const sourceSelect = document.getElementById('newsSource');
    if (!newsEl || !sourceSelect) return;

    const rssUrl = sourceSelect.value;
    if (!rssUrl) {
        newsEl.innerHTML = '<li data-lang-key="chooseSource">Kaynak seçin</li>';
        return;
    }

    // Cache
    const cacheKey = `news_${rssUrl}`;
    const cached = localStorage.getItem(cacheKey);
    if (!force && cached) {
        newsEl.innerHTML = cached;
        return;
    }

    newsEl.innerHTML = '<li data-lang-key="loadingNews">Haberler yükleniyor...</li>';

    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
    ];

    let html = '';
    for (const proxy of proxies) {
        try {
            const res = await fetch(proxy, { cache: 'no-store' });
            if (!res.ok) continue;

            const text = await res.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const items = xml.querySelectorAll('item');

            for (let i = 0; i < Math.min(10, items.length); i++) {
                const item = items[i];
                const title = item.querySelector('title')?.textContent?.trim() || 'Başlık yok';
                const link = item.querySelector('link')?.textContent || '#';
                const pubDate = item.querySelector('pubDate')?.textContent || '';

                html += `<li><a href="${link}" target="_blank">${title}</a> ${pubDate ? `<small>${new Date(pubDate).toLocaleString('tr-TR')}</small>` : ''}</li>`;
            }
            if (html) break;
        } catch (e) {
            continue;
        }
    }

    const result = html || '<li data-lang-key="noNews">Haber bulunamadı</li>';
    newsEl.innerHTML = result;
    localStorage.setItem(cacheKey, result);
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
            <button class="small-accent danger" onclick="window.removeNote(${index}, event)" data-lang-key="delete">Sil</button>
        </li>
    `).join('');
};

// Not sil
window.removeNote = function(index, e) { 
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    window.loadNotes();

    const panel = document.getElementById('toolsPanel');
    if (panel && panel.classList.contains('open')) {
        panel.style.display = 'block'; 
    }
  
    if (e) e.stopPropagation();
};

// QR oluştur 
window.generateQR = function() {
    const input = document.getElementById('qrInput');
    const display = document.getElementById('qrDisplay');
    const downloadBtn = document.getElementById('downloadQrBtn'); 
    if (!input || !display) return;
    const text = input.value;
    display.innerHTML = ''; // Temizle
    if (downloadBtn) downloadBtn.style.display = 'none'; 
    if (text) {
        display.innerHTML = '<p style="color: orange;">...</p>';
        
        const tryGenerate = () => {
            if (typeof QRCode === 'undefined') {
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

// QR indirme 
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

// Draggable Widget Reordering
function initDraggable() {
    const widgetGrid = document.querySelector('.widget-grid');
    if (!widgetGrid) return;
    let draggedItem = null;

    widgetGrid.addEventListener('dragstart', (e) => {
        if (e.target.closest('.widget-item')) {
            draggedItem = e.target.closest('.widget-item');
            draggedItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', ''); 
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
            setTimeout(() => { 
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