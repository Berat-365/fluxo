import { translations } from './language.js';
import { loadSearchHistory } from './history.js';

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Multisearch işlemi
async function performMultiSearch(type = 'web') {
    const q = document.getElementById("searchInput").value.trim();
    if (!q) {
        console.log("Arama sorgusu boş!");
        return;
    }

    // sanitize: boş/undefined/null değerleri çıkar
    const rawSelected = JSON.parse(localStorage.getItem("multiSearchEngines") || "[]");
    const selectedEngines = Array.isArray(rawSelected) ? rawSelected.filter(e => typeof e === 'string' && e.trim() !== '') : [];
    const linkBehavior = localStorage.getItem("linkBehavior") || "newTab";
    const safeSearch = localStorage.getItem("safeSearch") === "true";
    const disableSearchHistoryLog = localStorage.getItem("disableSearchHistoryLog") === "true";
    const lang = localStorage.getItem("language") || "tr";

    // Hiçbir motor seçilmediyse varsayılan arama motorunu kullan
    if (selectedEngines.length === 0) {
        console.log("Hiçbir motor seçili değil veya geçersiz değerler vardı, varsayılan arama motoru kullanılıyor.");
        const engine = localStorage.getItem("searchEngine") || "google";
        selectedEngines.push(engine);
    }

    // Arama geçmişi kaydı
    if (!disableSearchHistoryLog) {
        let searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
        let searchHistoryEngines = JSON.parse(localStorage.getItem("searchHistoryEngines") || "[]");
        if (!searchHistory.includes(q)) {
            searchHistory.unshift(q);
            searchHistoryEngines.unshift(selectedEngines.length > 1 ? "multi" : selectedEngines[0] || localStorage.getItem("searchEngine") || "google");
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
            localStorage.setItem("searchHistoryEngines", JSON.stringify(searchHistoryEngines));
            console.log("Arama geçmişi kaydedildi:", q);
        }
        loadSearchHistory();
    }

    // Tüm motorlar için sekmeleri aç
    for (let index = 0; index < selectedEngines.length; index++) {
        const engine = selectedEngines[index];
        if (!engine || typeof engine !== 'string') {
            console.warn("Atlanan geçersiz engine:", engine);
            continue;
        }
        let url;

        // --- Arama URL'sini hazırla ---
        if (engine === "yandex") {
            if (type === 'images') url = `https://yandex.com/images/search?text=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://news.yandex.com/search?text=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://market.yandex.com/search?text=${encodeURIComponent(q)}`;
            else url = `https://yandex.com/search/?text=${encodeURIComponent(q)}`;
        } else if (engine === "bing") {
            if (type === 'images') url = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://www.bing.com/shop?q=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}`;
            else url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
        } else if (engine === "duckduckgo") {
            if (type === 'images') url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`;
            else if (type === 'shopping') url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&ia=products`;
            else if (type === 'news') url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iar=news&ia=news`;
            else url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
        } else if (engine === "google") {
            if (type === 'images') url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(q)}`;
            else url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
        } else if (engine === "brave") {
            if (type === 'images') url = `https://search.brave.com/images?q=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://search.brave.com/search?q=${encodeURIComponent(q)}&source=web&show=shop`;
            else if (type === 'news') url = `https://search.brave.com/news?q=${encodeURIComponent(q)}`;
            else url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;

        } else if (engine === "yahoo") {
            if (type === 'images') url = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://shopping.yahoo.com/search?p=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://news.search.yahoo.com/search?p=${encodeURIComponent(q)}`;
            else url = `https://search.yahoo.com/search?p=${encodeURIComponent(q)}`;
        } else if (engine === "searx") {
            if (type === 'images') url = `https://searx.org/search?q=${encodeURIComponent(q)}&categories=images`;
            else if (type === 'shopping') url = `https://searx.org/search?q=${encodeURIComponent(q)}&categories=shopping`;
            else if (type === 'news') url = `https://searx.org/search?q=${encodeURIComponent(q)}&categories=news`;
            else url = `https://searx.org/search?q=${encodeURIComponent(q)}`;
        } else if (engine === "archive") {
            url = `https://archive.org/search.php?query=${encodeURIComponent(q)}`;
        } else if (engine === "wolfram") {
            url = `https://www.wolframalpha.com/input/?i=${encodeURIComponent(q)}`;
        } else if (engine === "wikipedia") {
            url = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`;
        } else if (engine === "mojeek") {
            if (type === 'images') url = `https://www.mojeek.com/images?q=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://www.mojeek.com/news?q=${encodeURIComponent(q)}`;
            else url = `https://www.mojeek.com/search?q=${encodeURIComponent(q)}`;
        } else if (engine === "startpage") {
            if (type === 'images') url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}&cat=images`;
            else if (type === 'news') url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}&cat=news`;
            else url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}`;
        } else if (engine === "ecosia") {
            if (type === 'images') url = `https://www.ecosia.org/images?q=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://www.ecosia.org/news?q=${encodeURIComponent(q)}`;
            else url = `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`;
        } else if (engine === "qwant") {
            if (type === 'images') url = `https://www.qwant.com/images?q=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://www.qwant.com/news?q=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://www.qwant.com/?q=${encodeURIComponent(q)}`; 
            else url = `https://www.qwant.com/?q=${encodeURIComponent(q)}`;
        } else if (engine === "ask") {
            if (type === 'images') url = `https://www.ask.com/images?q=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://www.ask.com/news?q=${encodeURIComponent(q)}`;
            else if (type === 'shopping') url = `https://www.ask.com/web?q=${encodeURIComponent(q)}+shopping`;
            else url = `https://www.ask.com/web?q=${encodeURIComponent(q)}`;
        } else if (engine === "baidu") {
            if (type === 'images') url = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(q)}`;
            else if (type === 'video') url = `https://video.baidu.com/v?word=${encodeURIComponent(q)}`;
            else if (type === 'news') url = `https://news.baidu.com/ns?word=${encodeURIComponent(q)}`;
            else url = `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`;
        }


        // --- SafeSearch parametresi ---
        if (safeSearch) {
            if (engine === "google") url += (url.includes("?") ? "&" : "?") + "safe=active";
            else if (engine === "bing") url += (url.includes("?") ? "&" : "?") + "adlt=strict";
            else if (engine === "duckduckgo") url += (url.includes("?") ? "&" : "?") + "kp=1";
            else if (engine === "yahoo") url += (url.includes("?") ? "&" : "?") + "vm=r";
            else if (engine === "brave") url += (url.includes("?") ? "&" : "?") + "safe=active";
            else if (engine === "yandex") url += (url.includes("?") ? "&" : "?") + "is_safesearch=1";
            else if (engine === "baidu") url += (url.includes("?") ? "&" : "?") + "safe=strict";
            else if (engine === "qwant") url += (url.includes("?") ? "&" : "?") + "tbs=li:1";
            else if (engine === "mojeek") url += (url.includes("?") ? "&" : "?") + "safe=1";
            else if (engine === "startpage") url += (url.includes("?") ? "&" : "?") + "prf=fp&safe=active";
            else if (engine === "ecosia") url += (url.includes("?") ? "&" : "?") + "safe=active";
        }

        // --- Sekme açma ---
        if (!url) {
            console.warn(`URL oluşturulamadı, ${engine} atlanıyor.`);
            continue; // undefined url açılmasını engelle
        }
        console.log(`Opening URL for ${engine}: ${url}`);
        if (linkBehavior === "closeCurrent" && index === 0) {
            window.location.href = url;
        } else {
            openInNewTab(url);
        }

    }

    document.getElementById("searchInput").value = "";
}

// Mevcut search fonksiyonu
export async function search(type = 'web') {
    const q = document.getElementById("searchInput").value.trim();
    const suggestionsBox = document.getElementById("suggestions");
    suggestionsBox.style.display = "none";
    if (!q) return;
    
    // Multisearch kontrolü (AI hariç - multi açıkken bile AI single çalışır)
    const multiSearchEnabled = localStorage.getItem("multiSearchEnabled") === "true";
    console.log("MultiSearch Enabled:", multiSearchEnabled);
    if (multiSearchEnabled && type !== "ai") {
        performMultiSearch(type);
        return;
    }
    
    const engine = localStorage.getItem("searchEngine") || "google";
    const linkBehavior = localStorage.getItem("linkBehavior") || "closeCurrent";
    const aiProvider = localStorage.getItem("aiProvider") || "grok";
    const customAiUrl = localStorage.getItem("customAiUrl") || "";
    const lang = localStorage.getItem("language") || "tr";
    let url;

    const safeSearch = localStorage.getItem("safeSearch") === "true";
    const disableSearchHistoryLog = localStorage.getItem("disableSearchHistoryLog") === "true";

    if (type === "ai") {
        if (aiProvider === "custom" && !customAiUrl) {
            alert(translations[lang].invalidAiUrl || "Geçersiz veya eksik AI sitesi URL'si!");
            return;
        }
        if (aiProvider === "grok") {
            // Grok ana sayfası yerine sorgu ile açılmasını sağla (varsa q parametresi ekle)
            url = `https://grok.x.ai/`;
            if (q) {
                const sep = url.includes('?') ? '&' : '?';
                url = `${url}${sep}q=${encodeURIComponent(q)}`;
            }
        } else if (aiProvider === "chatgpt") {
            url = `https://chat.openai.com/?model=gpt-4o&q=${encodeURIComponent(q)}`;
        } else if (aiProvider === "claude") {
            // Claude için sorguyu 'prompt' olarak gönder (daha yaygın kullanılan form)
            url = `https://claude.ai/`;
            if (q) {
                // bazı Claude yolları /chat veya /chats olabiliyor; prompt parametresi ekleyerek ana sayfaya yönlendirmeyi dene
                url = `https://claude.ai/chat?prompt=${encodeURIComponent(q)}`;
            }
        } else if (aiProvider === "copilot") {
            url = `https://copilot.microsoft.com/?q=${encodeURIComponent(q)}`;
        } else if (aiProvider === "perplexity") {
            url = `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`;
        } else if (aiProvider === "deepseek") {
            url = `https://chat.deepseek.com/?q=${encodeURIComponent(q)}`;
        } else if (aiProvider === "gemini") {
            url = `https://gemini.google.com/app?q=${encodeURIComponent(q)}`;
        } else if (aiProvider === "custom") {
            try {
                new URL(customAiUrl);
                // Custom için query param'ı varsayalım, yoksa ana sayfaya git
                const separator = customAiUrl.includes('?') ? '&' : '?';
                url = `${customAiUrl}${separator}q=${encodeURIComponent(q)}`;
            } catch {
                alert(translations[lang].invalidAiUrl || "Geçersiz AI sitesi URL'si!");
                return;
            }
        }
    } else {
        if (engine === "yandex") {
            if (type === 'images') {
                url = `https://yandex.com/images/search?text=${encodeURIComponent(q)}`;
            } else if (type === 'news') {
                url = `https://news.yandex.com/search?text=${encodeURIComponent(q)}`;
            } else if (type === 'shopping') {
                url = `https://market.yandex.com/search?text=${encodeURIComponent(q)}`;
            } else {
                url = `https://yandex.com/search/?text=${encodeURIComponent(q)}`;
            }
        } else if (engine === "bing") {
            if (type === 'images') {
                url = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`;
            } else if (type === 'shopping') {
                url = `https://www.bing.com/shop?q=${encodeURIComponent(q)}`;
            } else if (type === 'news') {
                url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}`;
            } else {
                url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
            }
        } else if (engine === "duckduckgo") {
            if (type === 'images') {
                url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`;
            } else if (type === 'shopping') {
                url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&ia=products`;
            } else if (type === 'news') {
                url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iar=news&ia=news`;
            } else {
                url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
            }
        } else if (engine === "google") {
            if (type === 'images') {
                url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
            } else if (type === 'shopping') {
                url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
            } else if (type === 'news') {
                url = `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(q)}`;
            } else {
                url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
            }
        } else if (engine === "brave") {
            if (type === 'images') {
                url = `https://search.brave.com/images?q=${encodeURIComponent(q)}`;
            } else if (type === 'shopping') {
                url = `https://search.brave.com/search?q=${encodeURIComponent(q)}&source=web&show=shop`;
            } else if (type === 'news') {
                url = `https://search.brave.com/news?q=${encodeURIComponent(q)}`;
            } else {
                url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
            }
        } else if (engine === "yahoo") {
            if (type === 'images') {
                url = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(q)}`;
            } else if (type === 'shopping') {
                url = `https://shopping.yahoo.com/search?p=${encodeURIComponent(q)}`;
            } else if (type === 'news') {
                url = `https://news.search.yahoo.com/search?p=${encodeURIComponent(q)}`;
            } else {
                url = `https://search.yahoo.com/search?p=${encodeURIComponent(q)}`;
            }
        } else if (engine === "searx") {
            if (type === 'images') url = `https://searx.org/search?q=${encodeURIComponent(q)}&categories=images`;
                else if (type === 'shopping') url = `https://searx.org/search?q=${encodeURIComponent(q)}&categories=shopping`;
                else if (type === 'news') url = `https://searx.org/search?q=${encodeURIComponent(q)}&categories=news`;
                else url = `https://searx.org/search?q=${encodeURIComponent(q)}`;

        } else if (engine === "archive") {
                url = `https://archive.org/search.php?query=${encodeURIComponent(q)}`;

        } else if (engine === "wolfram") {
            url = `https://www.wolframalpha.com/input/?i=${encodeURIComponent(q)}`;

        } else if (engine === "wikipedia") {
                url = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`;

        } else if (engine === "mojeek") {
            if (type === 'images') url = `https://www.mojeek.com/images?q=${encodeURIComponent(q)}`;
                else if (type === 'shopping') url = `https://www.mojeek.com/search?q=${encodeURIComponent(q)}`;
                else if (type === 'news') url = `https://www.mojeek.com/news?q=${encodeURIComponent(q)}`;
                else url = `https://www.mojeek.com/search?q=${encodeURIComponent(q)}`;
    
        } else if (engine === "startpage") {
            if (type === 'images') url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}&cat=images`;
                else if (type === 'shopping') url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}`; 
                else if (type === 'news') url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}&cat=news`;
                else url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}`;
        } else if (engine === "ecosia") {
            if (type === 'images') url = `https://www.ecosia.org/images?q=${encodeURIComponent(q)}`;
                else if (type === 'shopping') url = `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`; 
                else if (type === 'news') url = `https://www.ecosia.org/news?q=${encodeURIComponent(q)}`;
                else url = `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`;

            } else if (engine === "qwant") {
    if (type === 'images') {
        url = `https://www.qwant.com/images?q=${encodeURIComponent(q)}`;
    } else if (type === 'news') {
        url = `https://www.qwant.com/news?q=${encodeURIComponent(q)}`;
    } else if (type === 'shopping') {
        url = `https://www.qwant.com/?q=${encodeURIComponent(q)}`;
    } else {
        url = `https://www.qwant.com/?q=${encodeURIComponent(q)}`;
    }
            } else if (engine === "baidu") {
    if (type === 'images') {
        url = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(q)}`;
    } else if (type === 'shopping') {
        url = `https://s.taobao.com/search?q=${encodeURIComponent(q)}`;
    } else if (type === 'news') {
        url = `https://news.baidu.com/ns?word=${encodeURIComponent(q)}`;
    } else {
        url = `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`;
    }
} else if (engine === "ask") {
    if (type === 'images') {
        url = `https://www.ask.com/images?q=${encodeURIComponent(q)}`;
    } else if (type === 'news') {
        url = `https://www.ask.com/news?q=${encodeURIComponent(q)}`;
    } else if (type === 'shopping') {
        url = `https://www.ask.com/web?q=${encodeURIComponent(q)}+shopping`;
    } else {
        url = `https://www.ask.com/web?q=${encodeURIComponent(q)}`;
    }
}
    
    }
    if (!url) {
        alert(translations[lang].invalidSearchEngine || "Geçersiz arama motoru!");
        return;
    }

    // SafeSearch parametresi ekle
    if (safeSearch) {
        if (engine === "google") {
            url += (url.includes("?") ? "&" : "?") + "safe=active";
        } else if (engine === "bing") {
            url += (url.includes("?") ? "&" : "?") + "adlt=strict";
        } else if (engine === "duckduckgo") {
            url += (url.includes("?") ? "&" : "?") + "kp=1";
        } else if (engine === "yahoo") {
            url += (url.includes("?") ? "&" : "?") + "vm=r";
        } else if (engine === "brave") {
            url += (url.includes("?") ? "&" : "?") + "safe=active";
        } else if (engine === "yandex") {
            url += (url.includes("?") ? "&" : "?") + "is_safesearch=1";
        } else if (engine === "qwant") {
            url += (url.includes("?") ? "&" : "?") + "tbs=li:1";
        } else if (engine === "baidu") {
            url += (url.includes("?") ? "&" : "?") + "safe=strict";
        } else if (engine === "mojeek") {
            url += (url.includes("?") ? "&" : "?") + "safe=1";
        } else if (engine === "startpage") {
            url += (url.includes("?") ? "&" : "?") + "prf=fp&safe=active";
        } else if (engine === "ecosia") {
            url += (url.includes("?") ? "&" : "?") + "safe=active";
        }
    }

    // Arama geçmişi kaydını kontrol et
    if (!disableSearchHistoryLog) {
        let searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
        let searchHistoryEngines = JSON.parse(localStorage.getItem("searchHistoryEngines") || "[]");
        if (!searchHistory.includes(q)) {
            searchHistory.unshift(q);
            searchHistoryEngines.unshift(type === "ai" ? aiProvider : engine);
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
            localStorage.setItem("searchHistoryEngines", JSON.stringify(searchHistoryEngines));
        }
        loadSearchHistory();
    }
    document.getElementById("searchInput").value = "";
    console.log(`Opening URL for single search: ${url}`);
    if (linkBehavior === "closeCurrent") {
        window.location.href = url;
    } else {
        // eski: window.open(url, "_blank");
        openInNewTab(url);
    }
}

// Yeni: about:blank oluşumunu azaltmak için anchor-click yöntemiyle yeni sekme açma helper'ı
function openInNewTab(url) {
	// ... güvenlik için noopener noreferrer ekliyoruz
	const a = document.createElement('a');
	a.href = url;
	a.target = '_blank';
	a.rel = 'noopener noreferrer';
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	a.remove();
}

export function fetchSuggestions(query) {
    if (localStorage.getItem("showSuggestions") === "false") return;
    const encodedQuery = encodeURIComponent(query.trim());
    const callbackName = "jsonpCallback_" + Math.random().toString(36).substr(2);
    window[callbackName] = function(data) {
        try {
            console.log("Google Suggest JSONP yanıtı:", data);
            const suggestionsBox = document.getElementById("suggestions");
            suggestionsBox.innerHTML = "";
            const suggestions = data[1].slice(0, 8);
            suggestionsBox.style.display = suggestions.length ? "block" : "none";
            suggestions.forEach(suggestion => {
                const li = document.createElement("li");
                li.textContent = suggestion;
                li.onclick = () => {
                    document.getElementById("searchInput").value = suggestion;
                    search();
                    suggestionsBox.style.display = "none";
                };
                suggestionsBox.appendChild(li);
            });
            window.selectedIndex = -1;
        } catch (e) {
            console.error("Öneri alınamadı:", e);
            const suggestionsBox = document.getElementById("suggestions");
            suggestionsBox.innerHTML = `<li style="padding: 12px; color: #ff4444;">${translations[localStorage.getItem("language") || "tr"].noSuggestions}</li>`;
            suggestionsBox.style.display = "block";
        } finally {
            delete window[callbackName];
        }
    };
    const script = document.createElement("script");
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&jsonp=${callbackName}`;
    script.onload = () => {
        script.remove();
    };
    script.onerror = () => {
        console.error("Öneri alınamadı: Script yüklenemedi");
        const suggestionsBox = document.getElementById("suggestions");
        suggestionsBox.innerHTML = `<li style="padding: 12px; color: #ff4444;">${translations[localStorage.getItem("language") || "tr"].noSuggestions}</li>`;
        suggestionsBox.style.display = "block";
        delete window[callbackName];
        script.remove();
    };
    document.body.appendChild(script);
}

export function toggleMultiSearchMenu(e) {
    e.preventDefault();
    const menu = document.getElementById("multiSearchMenu");
    const rect = e.target.getBoundingClientRect();
    menu.style.display = menu.style.display === "block" ? "none" : "block";
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 5}px`;

    const selectedEngines = JSON.parse(localStorage.getItem("multiSearchEngines") || "[]");
    menu.querySelectorAll("div:not(#selectAllMultiSearch)").forEach(div => {
        const engineId = div.getAttribute("data-engine");
        div.classList.toggle("selected", selectedEngines.includes(engineId));
        div.onclick = () => {
            div.classList.toggle("selected");
            const updatedEngines = Array.from(menu.querySelectorAll(".selected")).map(el => el.getAttribute("data-engine"));
            localStorage.setItem("multiSearchEngines", JSON.stringify(updatedEngines));
            console.log("Updated Engines:", updatedEngines);
        };
    });

    document.getElementById("selectAllMultiSearch").onclick = () => {
        const allEngines = ["google", "bing", "wikipedia", "duckduckgo", "ask", "yandex", "brave", "yahoo", "baidu", "qwant", "mojeek", "startpage", "ecosia", "searx", "archive", "wolfram"];
        menu.querySelectorAll("div:not(#selectAllMultiSearch)").forEach(div => div.classList.add("selected"));
        localStorage.setItem("multiSearchEngines", JSON.stringify(allEngines));
        menu.style.display = "none";
        console.log("All Engines Selected:", allEngines);
    };

    const closeMenu = (event) => {
        if (!menu.contains(event.target) && !event.target.closest(".icon-left")) {
            menu.style.display = "none";
            document.removeEventListener("click", closeMenu);
        }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
}
