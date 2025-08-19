// ./panel/settings.js

// Renk seçimi
export function selectColor(color) {
    console.log("Seçilen renk:", color);
    document.getElementById("accentColor").value = color;
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem("accentColor", color);
}

// RGB'den HEX'e çevirme
export function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    return '#' + ((1 << 24) + (parseInt(result[0]) << 16) + (parseInt(result[1]) << 8) + parseInt(result[2])).toString(16).slice(1).toUpperCase();
}

// Arama motoru önizlemesini güncelleme
export function updateSearchEnginePreview() {
    const engine = document.getElementById("searchEngineSelect").value;
    const preview = document.getElementById("engineLogo");
    const logos = {
        google: "https://www.google.com/favicon.ico",
        bing: "https://www.bing.com/favicon.ico",
        duckduckgo: "https://duckduckgo.com/favicon.ico",
        yandex: "https://yandex.com/favicon.ico",
        yahoo: "https://www.yahoo.com/favicon.ico"
    };
    preview.src = logos[engine] || "";
    preview.style.display = logos[engine] ? "block" : "none";
}

// Klavye kısayollarını bağlama
export function bindShortcuts() {
    let handleShortcuts = null;
    if (handleShortcuts) {
        document.removeEventListener("keydown", handleShortcuts);
    }

    const searchShortcut = localStorage.getItem("searchShortcut") || "Ctrl + /";
    const favoriteShortcut = localStorage.getItem("favoriteShortcut") || "Ctrl + Shift + F";
    const settingsShortcut = localStorage.getItem("settingsShortcut") || "Ctrl + Shift + S";
    const historyShortcut = localStorage.getItem("historyShortcut") || "Ctrl + Shift + H";
    const imagesShortcut = localStorage.getItem("imagesShortcut") || "Ctrl + I";
    const shoppingShortcut = localStorage.getItem("shoppingShortcut") || "Ctrl + S";
    const newsShortcut = localStorage.getItem("newsShortcut") || "Ctrl + N";

    handleShortcuts = (e) => {
        const keyCombo = `${e.ctrlKey ? 'Ctrl + ' : ''}${e.shiftKey ? 'Shift + ' : ''}${e.key}`;
        if (keyCombo === searchShortcut) {
            e.preventDefault();
            document.getElementById("searchInput").focus();
        } else if (keyCombo === favoriteShortcut) {
            e.preventDefault();
            document.getElementById("addFavoriteModal").style.display = "block";
            document.getElementById("modalName").focus();
        } else if (keyCombo === settingsShortcut) {
            e.preventDefault();
            const p = document.getElementById("settingsPanel");
            p.style.display = p.style.display === "block" ? "none" : "block";
            document.getElementById("historyPanel").style.display = "none";
        } else if (keyCombo === historyShortcut) {
            e.preventDefault();
            const p = document.getElementById("historyPanel");
            p.style.display = p.style.display === "block" ? "none" : "block";
            document.getElementById("settingsPanel").style.display = "none";
            document.getElementById("historyList").innerHTML = "";
            const lang = localStorage.getItem("language") || "tr";
            const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
            if (history.length === 0) {
                const noHistoryMsg = document.createElement("li");
                noHistoryMsg.textContent = translations[lang]?.noHistory || "Geçmiş yok";
                document.getElementById("historyList").appendChild(noHistoryMsg);
            } else {
                history.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = item;
                    document.getElementById("historyList").appendChild(li);
                });
            }
        } else if (keyCombo === imagesShortcut && document.getElementById("searchInput").value.trim()) {
            e.preventDefault();
            search('images');
        } else if (keyCombo === shoppingShortcut && document.getElementById("searchInput").value.trim()) {
            e.preventDefault();
            search('shopping');
        } else if (keyCombo === newsShortcut && document.getElementById("searchInput").value.trim()) {
            e.preventDefault();
            search('news');
        }
    };

    document.addEventListener("keydown", handleShortcuts);
}

// Arka plan resmini önbelleğe alma
export async function cacheBackgroundImage(url) {
    const isYouTube = /youtube\.com|youtu\.be/i.test(url);
    if (isYouTube) {
        localStorage.setItem(`bgCache_${url}`, url);
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch background image");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            localStorage.setItem(`bgCache_${url}`, reader.result);
        };
    } catch (e) {
        console.error("Arka plan önbellekleme hatası:", e);
    }
}

// YouTube video ID'sini çıkarma
export function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

export function loadCachedBackground(url) {
    const videoElement = document.getElementById('backgroundVideo');
    const youTubeElement = document.getElementById('backgroundYouTube');
    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
    const isYouTube = /youtube\.com|youtu\.be/i.test(url);

    if (isYouTube) {
        videoElement.style.display = 'none';
        videoElement.pause && videoElement.pause();
        videoElement.querySelector('source').src = '';
        videoElement.load && videoElement.load();

        const cached = localStorage.getItem(`bgCache_${url}`);
        const videoId = extractYouTubeId(cached || url);
        if (videoId) {
            youTubeElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&autohide=1&playsinline=1&rel=0&iv_load_policy=3&vq=hd720`;
            youTubeElement.style.display = 'block';
            document.body.style.backgroundImage = 'none';
            // Dinamik ölçeklendirme
            const aspectRatio = window.innerWidth / window.innerHeight;
            youTubeElement.style.transform = aspectRatio < 1.6 ? 'scale(1.15)' : 'scale(1.1)';
            cacheBackgroundImage(url);

            // YouTube yükleme hatası için kontrol
            youTubeElement.onerror = () => {
                console.error("YouTube iframe yüklenemedi:", url);
                alert("YouTube videosu yüklenemedi. Reklam engelleyicinizi kapatmayı veya başka bir video URL'si denemeyi deneyin.");
                youTubeElement.style.display = 'none';
                youTubeElement.src = '';
                document.body.style.backgroundImage = 'none';
            };
        } else {
            console.error("Geçersiz YouTube URL'si:", cached || url);
            alert("Geçersiz YouTube URL'si. Lütfen geçerli bir video bağlantısı girin.");
            youTubeElement.style.display = 'none';
            youTubeElement.src = '';
            document.body.style.backgroundImage = 'none';
        }
    } else if (isVideo) {
        youTubeElement.style.display = 'none';
        youTubeElement.src = '';

        const cached = localStorage.getItem(`bgCache_${url}`);
        if (cached) {
            videoElement.querySelector('source').src = cached;
        } else {
            videoElement.querySelector('source').src = url;
            cacheBackgroundImage(url);
        }
        videoElement.style.display = 'block';
        videoElement.load();
        videoElement.play && videoElement.play();
        document.body.style.backgroundImage = 'none';
    } else {
        videoElement.style.display = 'none';
        videoElement.pause && videoElement.pause();
        videoElement.querySelector('source').src = '';
        videoElement.load && videoElement.load();
        youTubeElement.style.display = 'none';
        youTubeElement.src = '';

        const cached = localStorage.getItem(`bgCache_${url}`);
        if (cached) {
            document.body.style.backgroundImage = `url('${cached}')`;
        } else if (url) {
            document.body.style.backgroundImage = `url('${url}')`;
            cacheBackgroundImage(url);
        } else {
            document.body.style.backgroundImage = 'none';
        }
    }

    // Pencere yeniden boyutlandırıldığında ölçeklendirmeyi güncelle
    window.addEventListener('resize', () => {
        if (isYouTube && youTubeElement.style.display === 'block') {
            const aspectRatio = window.innerWidth / window.innerHeight;
            youTubeElement.style.transform = aspectRatio < 1.6 ? 'scale(1.15)' : 'scale(1.1)';
        }
    }, { once: true });
}

export function applySettings(loadCachedBackground, updateLanguage, loadFavorites, updateSearchEnginePreview, fetchWeather, bindShortcuts, startWeatherUpdate) {
    const bg = document.getElementById("bgUrlInput").value.trim();
    const f = document.getElementById("fontSelect").value;
    const t = document.getElementById("themeSelect").value;
    const c = document.getElementById("accentColor").value;
    const l = document.getElementById("languageSelect").value;
    const se = document.getElementById("searchEngineSelect").value;
    const sf = document.getElementById("showFavorites").value;
    const ss = document.getElementById("showSuggestions").value;
    const sw = document.getElementById("showWeather").value;
    const si = document.getElementById("showInfoBar").value;
    const ld = document.getElementById("logoDisplaySelect").value;
    const maxFav = document.getElementById("maxFavorites").value;
    const searchShortcut = document.getElementById("searchShortcutInput").value.trim();
    const favoriteShortcut = document.getElementById("favoriteShortcutInput").value.trim();
    const settingsShortcut = document.getElementById("settingsShortcutInput").value.trim();
    const historyShortcut = document.getElementById("historyShortcutInput").value.trim();
    const imagesShortcut = document.getElementById("imagesShortcutInput").value.trim();
    const shoppingShortcut = document.getElementById("shoppingShortcutInput").value.trim();
    const newsShortcut = document.getElementById("newsShortcutInput").value.trim();
    const weatherLocation = document.getElementById("weatherLocation").value.trim();
    const weatherUpdateInterval = document.getElementById("weatherUpdateInterval").value;
    const linkBehavior = document.getElementById("linkBehavior").value;

    loadCachedBackground(bg);
    document.documentElement.style.setProperty('--site-font', f);
    document.documentElement.style.setProperty('--accent-color', c);
    document.body.classList.remove("light", "dark");
    document.body.classList.add(t);
    const logoImg = document.getElementById("logoImg");
    const logoName = document.getElementById("logoName");
    const searchIcon = document.getElementById("searchIcon");
    const voiceIcon = document.getElementById("voiceIcon");
    const settingsIcon = document.getElementById("settingsIcon");
    const historyIcon = document.getElementById("historyIcon");
    logoImg.src = t === "light" ? "ico/logo-dark.png" : "ico/logo.png";
    searchIcon.src = t === "light" ? "ico/search-dark.png" : "ico/search.png";
    voiceIcon.src = t === "light" ? "ico/mic-dark.png" : "ico/mic.png";
    settingsIcon.src = t === "light" ? "ico/settings-dark.png" : "ico/settings.png";
    historyIcon.src = t === "light" ? "ico/history-dark.png" : "ico/history.png";

    document.getElementById("favorites").style.display = sf === "true" ? "flex" : "none";
    document.getElementById("weatherWidget").style.display = sw === "true" ? "block" : "none";
    document.getElementById("infoBar").style.display = si === "true" ? "block" : "none";

    const logo = document.getElementById("logo");
    if (ld === "logo") {
        logoImg.style.display = "block";
        logoName.style.display = "none";
        logo.style.display = "flex";
    } else if (ld === "logo-name") {
        logoImg.style.display = "block";
        logoName.style.display = "inline";
        logo.style.display = "flex";
    } else {
        logo.style.display = "none";
    }

    localStorage.setItem("bgUrl", bg);
    localStorage.setItem("font", f);
    localStorage.setItem("theme", t);
    localStorage.setItem("accentColor", c);
    localStorage.setItem("language", l);
    localStorage.setItem("searchEngine", se);
    localStorage.setItem("showFavorites", sf);
    localStorage.setItem("showSuggestions", ss);
    localStorage.setItem("showWeather", sw);
    localStorage.setItem("showInfoBar", si);
    localStorage.setItem("logoDisplay", ld);
    localStorage.setItem("maxFavorites", maxFav);
    localStorage.setItem("searchShortcut", searchShortcut);
    localStorage.setItem("favoriteShortcut", favoriteShortcut);
    localStorage.setItem("settingsShortcut", settingsShortcut);
    localStorage.setItem("historyShortcut", historyShortcut);
    localStorage.setItem("imagesShortcut", imagesShortcut);
    localStorage.setItem("shoppingShortcut", shoppingShortcut);
    localStorage.setItem("newsShortcut", newsShortcut);
    localStorage.setItem("weatherLocation", weatherLocation);
    localStorage.setItem("weatherUpdateInterval", weatherUpdateInterval);
    localStorage.setItem("linkBehavior", linkBehavior);

    let recentBgs = JSON.parse(localStorage.getItem("recentBackgrounds") || "[]");
    recentBgs = recentBgs.filter(url => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    });
    if (bg && !recentBgs.includes(bg)) {
        recentBgs.unshift(bg);
        if (recentBgs.length > 5) recentBgs.pop();
        localStorage.setItem("recentBackgrounds", JSON.stringify(recentBgs));
    }

    const recentBgList = document.getElementById("recentBgList");
    recentBgList.innerHTML = "";
    recentBgs.forEach(bgUrl => {
        const div = document.createElement("div");
        div.className = "bg-preview";
        div.onclick = () => {
            document.getElementById("bgUrlInput").value = bgUrl;
            loadCachedBackground(bgUrl);
            localStorage.setItem("bgUrl", bgUrl);
        };
        const img = document.createElement("img");
        const isYouTube = /youtube\.com|youtu\.be/i.test(bgUrl);
        img.src = isYouTube ? `https://img.youtube.com/vi/${extractYouTubeId(bgUrl)}/0.jpg` : bgUrl;
        img.style.width = "50px";
        img.style.height = "30px";
        img.style.borderRadius = "4px";
        img.style.marginRight = "8px";
        img.onerror = () => { img.src = "ico/default-favicon.png"; }; // Varsayılan resim
        const span = document.createElement("span");
        span.textContent = bgUrl.length > 30 ? bgUrl.substring(0, 27) + "..." : bgUrl;
        div.appendChild(img);
        div.appendChild(span);
        recentBgList.appendChild(div);
    });

    updateLanguage(l);
    loadFavorites();
    updateSearchEnginePreview();
    if (sw === "true") {
        fetchWeather();
        startWeatherUpdate();
    }
    bindShortcuts();
}
