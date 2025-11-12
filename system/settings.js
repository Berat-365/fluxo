const defaultSettings = {
  bgUrl: "",
  font: "'Segoe UI', sans-serif",
  theme: "dark",
  systemTheme: "vanilla",
  accentColor: "#6F958D",
  language: "",
  searchEngine: "google",
  showFavorites: "true",
  showSuggestions: "true",
  showWeather: "true",
  showInfoBar: "true",
  showSearch: "true",
  showSearchShortcuts: "true",
  showAISearch: "true",
  showAccountButton: "true",
  showAccountInfoText: "false",
  logoDisplay: "logo-name",
  logoPosition: "center",
  logoColor: "colored",
  showVoiceSearch: "true",
  showMultiSearch: "true",
  showLensSearch: "true",
  safeSearch: "true",  
  disableSearchHistoryLog: "false",
  privateMode: "false",
  maxFavorites: "5",
  searchShortcut: "Ctrl + /",
  favoriteShortcut: "Ctrl + Shift + F",
  settingsShortcut: "Ctrl + Shift + X",
  historyShortcut: "Ctrl + Shift + H",
  weatherLocation: "",
  weatherUpdateInterval: "0",
  linkBehavior: "closeCurrent",
  multiSearchEnabled: "false",
  aiProvider: "grok",
  customAiUrl: "",
  buttonDisplayMode: "text-only", 
  disableAnimations: "false",
  showTools: "true",
  backgroundHistory: JSON.stringify([]),
  idleScreenEnabled: "true",
  idleScreenTimeout: "2",
  hourSelections: "24"     
};

// Global ayar cache'i (performans için)
let cachedSettings = null;

// Güvenli localStorage erişimi
function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error(`localStorage erişim hatası: ${key}`, e);
        return null;
    }
}
function safeSetItem(key, value) {
  try { 
    localStorage.setItem(key, value); 
    return true; 
  } catch (e) { 
    console.warn(`localStorage.setItem failed for ${key}:`, e); 
    return false; 
  }
}
function safeRemoveItem(key) {
  try { localStorage.removeItem(key); return true; } catch (e) { return false; }
}

// localStorage kullanılabilir mi?
export function checkStorageAvailability() {
  try {
    const testKey = '__fluxo_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage kullanılamıyor:', e);
    let lang = safeGetItem('language') || 'tr';
    const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
    try { 
      alert(t.storageError || 'Depolama alanı dolu veya erişilemiyor. Lütfen tarayıcı ayarlarınızı kontrol edin.'); 
    } catch {}
    return false;
  }
}

// Basit DOM cache
const DOM = {};
function $(id) {
  if (!DOM[id]) DOM[id] = document.getElementById(id);
  return DOM[id];
}

// ------------------------- Color & UI helpers -------------------------
export function selectColor(color) {
  if (!color) return;
  const accentInput = $('accentColor');
  if (accentInput) accentInput.value = color;
  document.documentElement.style.setProperty('--accent-color', color);
  safeSetItem('accentColor', color);
}

// RGB'yi HEX'e dönüştür
export function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  const [r, g, b] = result.map(n => parseInt(n, 10));
  const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  return `#${hex}`;
}

export function updateSearchEnginePreview() {
  const engine = $('searchEngineSelect')?.value || safeGetItem('searchEngine') || defaultSettings.searchEngine;
  const preview = $('engineLogo');
  const logos = {
    google: "assets/engines/google.png",
    bing: "assets/engines/bing.png",
    duckduckgo: "assets/engines/duckduckgo.png",
    yandex: "assets/engines/yandex.png",
    brave: "assets/engines/brave.png",
    yahoo: "assets/engines/yahoo.png",
    ask: "assets/engines/ask.png",
    baidu: "assets/engines/baidu.png",
    qwant: "assets/engines/qwant.png",
    mojeek: "assets/engines/mojeek.png",
    startpage: "assets/engines/startpage.png",
    ecosia: "assets/engines/ecosia.png",
    wikipedia: "assets/engines/wikipedia.png",
    searx: "assets/engines/searx.png",
    archive: "assets/engines/archive.png",
    wolfram: "assets/engines/wolfram.png",
  };
  if (!preview) return;
  preview.src = logos[engine] || "";
  preview.style.display = logos[engine] ? "block" : "none";
}

// ------------------------- Shortcuts -------------------------
function _normalizeShortcut(s) {
  if (!s || typeof s !== 'string') return '';
  return s.replace(/\s*\+\s*/g, ' + ').trim().toUpperCase();
}

export function bindShortcuts() {
  if (document._fluxHandleShortcuts) {
    document.removeEventListener('keydown', document._fluxHandleShortcuts);
    document._fluxHandleShortcuts = null;
  }

  const shortcuts = {
    search: safeGetItem("searchShortcut") || defaultSettings.searchShortcut,
    favorite: safeGetItem("favoriteShortcut") || defaultSettings.favoriteShortcut,
    settings: safeGetItem("settingsShortcut") || defaultSettings.settingsShortcut,
    history: safeGetItem("historyShortcut") || defaultSettings.historyShortcut,
  };

  Object.keys(shortcuts).forEach(k => { shortcuts[k] = _normalizeShortcut(shortcuts[k]); });

  const handleShortcuts = (e) => {
    if (!e || !e.key || (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const parts = [];
    if (e.ctrlKey) parts.push('CTRL');
    if (e.shiftKey) parts.push('SHIFT');
    if (e.altKey) parts.push('ALT');
    let keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key.replace(/^Arrow/, '').toUpperCase();
    parts.push(keyName);
    const keyCombo = parts.join(' + ');

    try {
      if (keyCombo === shortcuts.search) {
        e.preventDefault();
        $('searchInput')?.focus();
      } else if (keyCombo === shortcuts.favorite) {
        e.preventDefault();
        const modal = $('addFavoriteModal');
        if (modal) { modal.style.display = "block"; $('modalName')?.focus(); }
      } else if (keyCombo === shortcuts.settings) {
        e.preventDefault();
        const p = $('menuPanel');
        if (p) {
          p.style.display = p.style.display === "block" ? "none" : "block";
          document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
          $('settingsContent')?.classList.add("active");
          document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
          document.querySelector(".tab-button[data-tab='settings']")?.classList.add("active");
        }
      } else if (keyCombo === shortcuts.history) {
        e.preventDefault();
        const p = $('menuPanel');
        if (p) {
          p.style.display = p.style.display === "block" ? "none" : "block";
          document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
          $('historyContent')?.classList.add("active");
          document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
          document.querySelector(".tab-button[data-tab='history']")?.classList.add("active");
          if (typeof window.loadSearchHistory === 'function') window.loadSearchHistory();
        }
      }
    } catch (err) {
      console.error('bindShortcuts handler error:', err);
    }
  };

  document._fluxHandleShortcuts = handleShortcuts;
  document.addEventListener('keydown', handleShortcuts);
}

// ------------------------- IndexedDB wrapper for background caching -------------------------
const IDB_DB = 'fluxo_bg_db';
const IDB_STORE = 'backgrounds';

let idbPromise = null;

function openIdb() {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return resolve(null);
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  return idbPromise;
}

async function idbPut(key, value) {
  const db = await openIdb();
  if (!db) return false;
  return new Promise((res) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const r = store.put(value, key);
      r.onsuccess = () => { res(true); db.close(); };
      r.onerror = () => { res(false); db.close(); };
    } catch (e) { res(false); }
  });
}

async function idbGet(key) {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const r = store.get(key);
      r.onsuccess = () => { resolve(r.result ?? null); db.close(); };
      r.onerror = () => { resolve(null); db.close(); };
    } catch (e) { resolve(null); }
  });
}

// ------------------------- Background caching & loading -------------------------
export async function cacheBackgroundImage(url) {
  if (!url) return;
  try {
    const isYouTube = /youtube\.com|youtu\.be/i.test(url);
    if (isYouTube) {
      safeSetItem(`bgCache_${url}`, url);
      let history = JSON.parse(safeGetItem('backgroundHistory') || '[]');
      history = [url, ...history.filter(h => h !== url).slice(0, 2)];
      safeSetItem('backgroundHistory', JSON.stringify(history));
      history.slice(3).forEach(oldUrl => {
        safeRemoveItem(`bgCache_${oldUrl}`);
        openIdb().then(db => {
          if (db) {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).delete(`bg_${oldUrl}`);
            db.close();
          }
        }).catch(console.error);
      });
      return;
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('fetch failed ' + resp.status);
    const blob = await resp.blob();

    const saved = await idbPut(`bg_${url}`, blob);
    if (!saved) {
      const reader = new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      safeSetItem(`bgCache_${url}`, await reader);
    }
    let history = JSON.parse(safeGetItem('backgroundHistory') || '[]');
    history = [url, ...history.filter(h => h !== url).slice(0, 2)];
    safeSetItem('backgroundHistory', JSON.stringify(history));
    history.slice(3).forEach(oldUrl => {
      safeRemoveItem(`bgCache_${oldUrl}`);
      openIdb().then(db => {
        if (db) {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).delete(`bg_${oldUrl}`);
          db.close();
        }
      }).catch(console.error);
    });
  } catch (e) {
    console.error('cacheBackgroundImage hata:', e);
  }
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function loadCachedBackground(url, delay = 0) {
  if (delay > 0) await new Promise(r => setTimeout(r, delay));
  
  const videoElement = $('backgroundVideo');
  const youTubeElement = $('backgroundYouTube');

  if (!url) {
    const history = JSON.parse(safeGetItem('backgroundHistory') || '[]');
    if (history.length > 0) {
      await loadCachedBackground(history[0], 100);
      return;
    }
    if (videoElement) {
      videoElement.style.display = 'none';
      videoElement.pause?.();
      const source = videoElement.querySelector('source');
      if (source) source.src = '';
      videoElement.load?.();
    }
    if (youTubeElement) {
      youTubeElement.style.display = 'none';
      youTubeElement.src = '';
    }
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '';
    return;
  }

  const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  const isYouTube = /youtube\.com|youtu\.be/i.test(url);
  if (isYouTube) {
    if (videoElement) {
      videoElement.style.display = 'none';
      videoElement.pause?.();
      const source = videoElement.querySelector('source');
      if (source) source.src = '';
      videoElement.load?.();
    }
    const videoId = extractYouTubeId(url);
    if (videoId && youTubeElement) {
      youTubeElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&iv_load_policy=3&playsinline=1`;
      youTubeElement.style.display = 'block';
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '';
      cacheBackgroundImage(url);
      return;
    } else {
      console.error('Geçersiz YouTube URL:', url);
      const lang = safeGetItem('language') || 'tr';
      const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
      try { alert(t.invalidYouTube || 'Geçersiz YouTube URL\'si. Lütfen geçerli bir video bağlantısı girin.'); } catch {}
      if (youTubeElement) {
        youTubeElement.style.display = 'none';
        youTubeElement.src = '';
      }
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '';
      return;
    }
  }

  try {
    const idbVal = await idbGet(`bg_${url}`);
    if (idbVal instanceof Blob) {
      if (isVideo && videoElement) {
        const source = videoElement.querySelector('source');
        const blobUrl = URL.createObjectURL(idbVal);
        if (source) source.src = blobUrl;
        videoElement.style.display = 'block';
        videoElement.load?.();
        videoElement.play?.();
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = '';
        return;
      } else {
        const blobUrl = URL.createObjectURL(idbVal);
        if (videoElement) {
          videoElement.style.display = 'none';
          videoElement.pause?.();
          const source = videoElement.querySelector('source');
          if (source) source.src = '';
          videoElement.load?.();
        }
        document.body.style.backgroundImage = `url('${blobUrl}')`;
        document.body.style.backgroundColor = '';
        return;
      }
    }

    let cached = safeGetItem(`bgCache_${url}`);
    if (!cached) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch background');
      const blob = await resp.blob();
      const saved = await idbPut(`bg_${url}`, blob);
      if (saved) {
        return loadCachedBackground(url, 0);
      }
      cached = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(blob);
      });
      safeSetItem(`bgCache_${url}`, cached);
    }

    if (isVideo && videoElement) {
      const source = videoElement.querySelector('source');
      if (source) source.src = cached;
      videoElement.style.display = 'block';
      videoElement.load?.();
      videoElement.play?.();
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '';
    } else {
      if (videoElement) {
        videoElement.style.display = 'none';
        videoElement.pause?.();
        const source = videoElement.querySelector('source');
        if (source) source.src = '';
        videoElement.load?.();
      }
      document.body.style.backgroundImage = `url('${cached}')`;
      document.body.style.backgroundColor = '';
    }
  } catch (e) {
    console.error('Arka plan yükleme hatası:', e);
    if (videoElement) {
      videoElement.style.display = 'none';
      videoElement.pause?.();
      const source = videoElement.querySelector('source');
      if (source) source.src = '';
      videoElement.load?.();
    }
    if ($('backgroundYouTube')) {
      $('backgroundYouTube').style.display = 'none';
      $('backgroundYouTube').src = '';
    }
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '';
  }
}

// ------------------------- Settings persistence & apply/load -------------------------
function getSettingFromInputs(key, inputId) {
  const el = inputId ? $(inputId) : null;
  const elVal = el?.value?.trim?.();
  if (elVal !== undefined) return elVal;
  const stored = safeGetItem(key);
  if (stored !== undefined) return stored;
  return defaultSettings[key] ?? '';
}

function loadCachedSettings() {
  if (cachedSettings) return cachedSettings;
  cachedSettings = {};
  Object.keys(defaultSettings).forEach(k => {
    const stored = safeGetItem(k);
    cachedSettings[k] = (stored !== null) ? stored : defaultSettings[k];
  });
  return cachedSettings;
}

export function saveSettings(settings) {
  if (!checkStorageAvailability()) return false;
  try {
    Object.entries(settings).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        safeSetItem(k, String(v));
        if (cachedSettings) cachedSettings[k] = String(v);
      }
    });
    return true;
  } catch (e) {
    console.error('saveSettings hata:', e);
    return false;
  }
}

export function saveSettingsFromInputs() {
  if (!checkStorageAvailability()) return false;

  try {
    const settings = {
      bgUrl: getSettingFromInputs('bgUrl', 'bgUrlInput'),
      font: getSettingFromInputs('font', 'fontSelect'),
      theme: getSettingFromInputs('theme', 'themeSelect'),
      systemTheme: getSettingFromInputs('systemTheme', 'systemThemeSelect'),
      accentColor: getSettingFromInputs('accentColor', 'accentColor'),
      language: getSettingFromInputs('language', 'languageSelect'),
      searchEngine: getSettingFromInputs('searchEngine', 'searchEngineSelect'),
      showFavorites: getSettingFromInputs('showFavorites', 'showFavorites'),
      showSuggestions: getSettingFromInputs('showSuggestions', 'showSuggestions'),
      showWeather: getSettingFromInputs('showWeather', 'showWeather'),
      showInfoBar: getSettingFromInputs('showInfoBar', 'showInfoBar'),
      showSearch: getSettingFromInputs('showSearch', 'showSearch'),
      showSearchShortcuts: getSettingFromInputs('showSearchShortcuts', 'showSearchShortcuts'),
      showAISearch: getSettingFromInputs('showAISearch', 'showAISearch'),
      showAccountButton: getSettingFromInputs('showAccountButton', 'showAccountButton'),
      showAccountInfoText: getSettingFromInputs('showAccountInfoText', 'showAccountInfoText'),
      showTools: getSettingFromInputs('showTools', 'showTools'),
      logoDisplay: getSettingFromInputs('logoDisplay', 'logoDisplaySelect'),
      logoPosition: getSettingFromInputs('logoPosition', 'logoPositionSelect'),
      logoColor: getSettingFromInputs('logoColor', 'logoColorSelect'),
      maxFavorites: getSettingFromInputs('maxFavorites', 'maxFavorites'),
      searchShortcut: _normalizeShortcut(getSettingFromInputs('searchShortcut', 'searchShortcutInput')),
      favoriteShortcut: _normalizeShortcut(getSettingFromInputs('favoriteShortcut', 'favoriteShortcutInput')),
      settingsShortcut: _normalizeShortcut(getSettingFromInputs('settingsShortcut', 'settingsShortcutInput')),
      historyShortcut: _normalizeShortcut(getSettingFromInputs('historyShortcut', 'historyShortcutInput')),
      weatherLocation: getSettingFromInputs('weatherLocation', 'weatherLocation'),
      weatherUpdateInterval: getSettingFromInputs('weatherUpdateInterval', 'weatherUpdateInterval'),
      linkBehavior: getSettingFromInputs('linkBehavior', 'linkBehavior'),
      multiSearchEnabled: getSettingFromInputs('multiSearchEnabled', 'multiSearchEnabled'),
      aiProvider: getSettingFromInputs('aiProvider', 'aiProviderSelect'),
      customAiUrl: getSettingFromInputs('customAiUrl', 'customAiUrl'),
      showLensSearch: getSettingFromInputs('showLensSearch', 'showLensSearch'),
      showVoiceSearch: getSettingFromInputs('showVoiceSearch', 'showVoiceSearch'),
      showMultiSearch: getSettingFromInputs('showMultiSearch', 'showMultiSearch'),
      buttonDisplayMode: getSettingFromInputs('buttonDisplayMode', 'buttonDisplayMode'),
      disableAnimations: getSettingFromInputs('disableAnimations', 'disableAnimations'),
      safeSearch: getSettingFromInputs('safeSearchOptions', 'safeSearchOptions') === 'safeSearchEnable' ? 'true' : 'false',
      disableSearchHistoryLog: getSettingFromInputs('disableSearchHistoryLogOptions', 'disableSearchHistoryLogOptions') === 'disableSearchHistoryLogEnable' ? 'true' : 'false',
      privateMode: getSettingFromInputs('privateModeOptions', 'privateModeOptions') === 'privateModeEnable' ? 'true' : 'false',
      backgroundHistory: JSON.stringify(JSON.parse(safeGetItem('backgroundHistory') || '[]')),
      idleScreenEnabled: getSettingFromInputs('idleScreenEnabled', 'idleScreenEnabled'),
      idleScreenTimeout: getSettingFromInputs('idleScreenTimeout', 'idleScreenTimeout'),
      hourSelections: getSettingFromInputs('hourSelections', 'hourSelections'),
    }; 

    saveSettings(settings);
    applySettings({
      updateSearchEnginePreview,
      loadCachedBackground,
      updateLanguage: typeof window.updateLanguage === 'function' ? window.updateLanguage : undefined,
      loadFavorites: typeof window.loadFavorites === 'function' ? window.loadFavorites : undefined,
      fetchWeather: typeof window.fetchWeather === 'function' ? window.fetchWeather : undefined,
      bindShortcuts,
      startWeatherUpdate: typeof window.startWeatherUpdate === 'function' ? window.startWeatherUpdate : undefined
    });
    return true;
  } catch (e) {
    console.error('saveSettingsFromInputs hata:', e);
    return false;
  }
}

export function forceDefaultSettings() {
  if (!checkStorageAvailability()) return;
  Object.entries(defaultSettings).forEach(([k, v]) => {
    safeSetItem(k, String(v));
  });
  cachedSettings = { ...defaultSettings };
  loadCachedSettings();
}

export async function applySettings(options = {}) {
  try {
    if (!checkStorageAvailability()) {
      console.warn('Depolama kullanılamıyor, varsayılan ayarlar uygulanacak.');
      forceDefaultSettings();
      cachedSettings = { ...defaultSettings };
    } else {
      loadCachedSettings();
    }
    const settings = cachedSettings || { ...defaultSettings };

    const themeStylesheet = document.getElementById('systemThemeLink');
    if (themeStylesheet) {
        const systemTheme = settings.systemTheme || 'vanilla';
        themeStylesheet.href = `./styles/${systemTheme}.css`;
    }

    document.body.classList.remove('light', 'dark');
    if (settings.theme) document.body.classList.add(settings.theme);

    const fontFamily = settings.font || defaultSettings.font;
    document.documentElement.style.setProperty('--font-family', fontFamily, 'important');
    document.body.style.setProperty('font-family', fontFamily, 'important');

    let fontLink = document.getElementById('fontStylesheet');
    if (fontLink) {
      const match = fontFamily.match(/'([^']+)'/);
      const fontName = match ? match[1] : fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (fontName !== 'Segoe UI') {
        fontLink.href = `https://fonts.googleapis.com/css?family=${encodeURIComponent(fontName)}:400,700&display=swap`;
      } else {
        fontLink.remove();
      }
    }

    selectColor(settings.accentColor || defaultSettings.accentColor);

    const logoEl = document.getElementById('logo');
    if (logoEl) {
        logoEl.style.display = settings.logoDisplay === 'none' ? 'none' : 'flex';
        logoEl.style.justifyContent = settings.logoPosition || 'flex-start';

        const logoImg = logoEl.querySelector('img');
        if (logoImg) {
            switch (settings.logoColor) {
                case 'light': logoImg.src = 'assets/logo/logo-light.png'; break;
                case 'dark': logoImg.src = 'assets/logo/logo-dark.png'; break;
                default: logoImg.src = 'assets/logo/logo.png';
            }
            logoImg.style.filter = 'none';
        }
    }

    const buttonMode = settings.buttonDisplayMode || defaultSettings.buttonDisplayMode;
    const buttonsEl = document.getElementById('buttons');
    if (buttonsEl) {
      buttonsEl.classList.remove('icons-only', 'text-only');
      if (buttonMode === 'icons-only') buttonsEl.classList.add('icons-only');
      else if (buttonMode === 'text-only') buttonsEl.classList.add('text-only');
    }

    const buttonIcons = document.querySelectorAll('.buttons .accent .button-icon');
    const buttonTexts = document.querySelectorAll('.buttons .accent .button-text');
    buttonIcons.forEach(icon => icon.style.display = (buttonMode === 'text-only') ? 'none' : 'inline-block');
    buttonTexts.forEach(text => text.style.display = (buttonMode === 'icons-only') ? 'none' : 'inline');

    if (settings.disableAnimations === "true") {
      document.body.classList.add("no-animations");
    } else {
      document.body.classList.remove("no-animations");
    }

    const toggleMap = {
      showFavorites: 'favorites',
      showSuggestions: 'suggestions',
      showWeather: 'weatherWidget',
      showInfoBar: 'infoWrapper',
      showSearch: 'searchBar',
      showSearchShortcuts: 'buttons',
      showAISearch: 'searchAIBtn',
      showAccountButton: 'accountButton',
      showLensSearch: 'lensSearchBtn',
      showAccountInfoText: 'infoRight',
      showTools: 'toolsWidget',
      showVoiceSearch: 'voiceSearchBtn',
      showMultiSearch: 'multiSearchIcon',
    };
    Object.entries(toggleMap).forEach(([settingKey, elId]) => {
      const el = $(elId);
      if (el) el.style.display = (settings[settingKey] || 'true') === 'true' ? '' : 'none';
    });

    const linkBehavior = settings.linkBehavior || defaultSettings.linkBehavior;
    window.linkBehavior = linkBehavior;
    safeSetItem('linkBehavior', linkBehavior); 

    window.linkBehavior = settings.linkBehavior || defaultSettings.linkBehavior;
    window.multiSearchEnabled = settings.multiSearchEnabled === 'true';
    window.safeSearch = settings.safeSearch === 'true';
    window.disableSearchHistory = settings.disableSearchHistoryLog === 'true';
    window.privateMode = settings.privateMode === 'true';
    window.backgroundHistory = JSON.parse(settings.backgroundHistory || '[]');

    // Ensure AI provider settings are exposed globally so other modules use the selected provider
    // window.aiProvider will be like 'grok', 'bard', 'openai', 'custom', etc.
    // window.customAiUrl holds the custom AI endpoint when aiProvider === 'custom'
    window.aiProvider = settings.aiProvider || defaultSettings.aiProvider;
    window.customAiUrl = settings.customAiUrl || '';
    // Persist these values to storage as well (keeps state consistent)
    safeSetItem('aiProvider', String(window.aiProvider));
    safeSetItem('customAiUrl', String(window.customAiUrl));
    
    const asyncTasks = [
      async () => { try { return options.updateSearchEnginePreview?.() || updateSearchEnginePreview(); } catch (e) { console.error(e); } },
      async () => { try { await loadCachedBackground(settings.bgUrl || defaultSettings.bgUrl, 50); } catch (e) { console.error(e); } },
      async () => { try { const lang = settings.language || defaultSettings.language; if (options.updateLanguage) options.updateLanguage(lang); else if (typeof window.updateLanguage === 'function') window.updateLanguage(lang); } catch (e) { console.error(e); } },
      async () => { try { const maxFav = settings.maxFavorites || defaultSettings.maxFavorites; if (options.loadFavorites) options.loadFavorites(maxFav); else if (typeof window.loadFavorites === 'function') window.loadFavorites(maxFav); } catch (e) { console.error(e); } },
      async () => { try { if (options.fetchWeather) options.fetchWeather(); else if (typeof window.fetchWeather === 'function') window.fetchWeather(); } catch (e) { console.error(e); } },
      async () => { try { options.bindShortcuts?.() || bindShortcuts(); } catch (e) { console.error(e); } },
      async () => { try { if (options.startWeatherUpdate) options.startWeatherUpdate(); else if (typeof window.startWeatherUpdate === 'function') window.startWeatherUpdate(); } catch (e) { console.error(e); } },
      async () => {
        try {
          const enabled = settings.idleScreenEnabled === 'true';
          const timeoutMinutes = Math.max(1, Math.min(60, parseInt(settings.idleScreenTimeout) || 2));
          if (window.initIdleScreen) {
            window.initIdleScreen(enabled, timeoutMinutes);
          }
        } catch (e) { console.error(e); }
      }
    ];

    await Promise.all(asyncTasks.map(task => task().catch(console.error)));

    loadThemeIcons(settings.theme || defaultSettings.theme);
    updateSettingsInputs(settings);

    return settings;
  } catch (e) {
    console.error('applySettings hata:', e);
    return defaultSettings;
  }
}

// Tema ikonları
function loadThemeIcons(theme) {
  const icons = {
    multiSearchIcon: theme === "dark" ? "assets/light/multisearch.png" : "assets/dark/multisearch.png",
    voiceIcon: theme === "light" ? "assets/dark/mic.png" : "assets/light/mic.png",
    menuIcon: theme === "light" ? "assets/dark/menu.png" : "assets/light/menu.png",
    accountIcon: theme === "light" ? "assets/dark/account.png" : "assets/light/account.png",
    lensIcon: theme === "light" ? "assets/dark/lens.png" : "assets/light/lens.png",
    toolsIcon: theme === "dark" ? "assets/light/tools.png" : "assets/dark/tools.png",
    addIcon: theme === "light" ? "assets/dark/add.png" : "assets/light/add.png",
    addFolderIcon: theme === "light" ? "assets/dark/addfolder.png" : "assets/light/addfolder.png",
    addToFolderIcon: theme === "light" ? "assets/dark/addtofolder.png" : "assets/light/addtofolder.png",
    checkIcon: theme === "light" ? "assets/dark/check.png" : "assets/light/check.png",
    cancelIcon: theme === "light" ? "assets/dark/cancel.png" : "assets/light/cancel.png",
  };

  Object.entries(icons).forEach(([id, src]) => {
    const el = document.getElementById(id);
    if (el) el.src = src;
  });

  const tabIcons = {
    settings: theme === "light" ? "assets/dark/settings.png" : "assets/light/settings.png",
    history: theme === "light" ? "assets/dark/history.png" : "assets/light/history.png",
    support: theme === "light" ? "assets/dark/support.png" : "assets/light/support.png"
  };

  Object.entries(tabIcons).forEach(([tab, src]) => {
    const el = document.querySelector(`.tab-button[data-tab="${tab}"] img`);
    if (el) el.src = src;
  });

  const searchIcons = {
    searchWebBtn: theme === "light" ? "assets/dark/search.png" : "assets/light/search.png",
    searchImagesBtn: theme === "light" ? "assets/dark/images.png" : "assets/light/images.png",
    searchShoppingBtn: theme === "light" ? "assets/dark/shopping.png" : "assets/light/shopping.png",
    searchNewsBtn: theme === "light" ? "assets/dark/news.png" : "assets/light/news.png",
    searchAIBtn: theme === "light" ? "assets/dark/aisearch.png" : "assets/light/aisearch.png"
  };

  Object.entries(searchIcons).forEach(([btnId, src]) => {
    const el = document.getElementById(btnId)?.querySelector('.button-icon');
    if (el) el.src = src;
  });

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) themeSelect.value = theme;
}

// ------------------------- Settings Export / Import / Modal -------------------------
export function exportSettings() {
  const s = {};
  Object.keys(defaultSettings).forEach(k => {
    const val = safeGetItem(k);
    if (val !== undefined) s[k] = val;
  });
  return JSON.stringify(s, null, 2);
}

export function importSettings(settingsJson) {
  if (!settingsJson || typeof settingsJson !== 'string') return false;
  try {
    const settings = JSON.parse(settingsJson);
    Object.entries(settings).forEach(([k, v]) => {
      if (defaultSettings.hasOwnProperty(k) && v !== undefined && v !== null) {
        safeSetItem(k, String(v));
        if (cachedSettings) cachedSettings[k] = String(v);
      }
    });
    return true;
  } catch (e) {
    console.error("importSettings error:", e);
    return false;
  }
}

export function closeImportExportModal() {
  const m = $('importExportModal');
  if (m) m.style.display = 'none';
}

export function openImportExportModal() {
  const m = $('importExportModal');
  if (m) m.style.display = 'block';
}

// ------------------------- Settings Tarayıcı Sıfırlama -------------------------
export function resetBrowser() {  
  try {
    localStorage.clear();
    forceDefaultSettings();
    sessionStorage.clear();
    cachedSettings = null;

    document.cookie.split(";").forEach(cookie => {
      document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    if (window.indexedDB) {
      indexedDB.deleteDatabase('fluxo_bg_db');
    }

    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))));
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(reg => reg.unregister())));
    }

    const videoElement = $('backgroundVideo');
    const youTubeElement = $('backgroundYouTube');
    if (videoElement) {
      videoElement.style.display = 'none';
      videoElement.pause?.();
      const source = videoElement.querySelector('source');
      if (source) source.src = '';
      videoElement.load?.();
    }
    if (youTubeElement) {
      youTubeElement.style.display = 'none';
      youTubeElement.src = '';
    }
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '';

    applySettings({
      updateSearchEnginePreview,
      loadCachedBackground,
      updateLanguage: typeof window.updateLanguage === 'function' ? window.updateLanguage : undefined,
      loadFavorites: typeof window.loadFavorites === 'function' ? window.loadFavorites : undefined,
      fetchWeather: typeof window.fetchWeather === 'function' ? window.fetchWeather : undefined,
      bindShortcuts,
      startWeatherUpdate: typeof window.startWeatherUpdate === 'function' ? window.startWeatherUpdate : undefined
    });

    setTimeout(() => location.reload(true), 100);
  } catch (e) {
    console.error('resetBrowser hata:', e);
    location.reload(true);
  }
}

// ------------------- IDLE SCREEN: 2 DAKİKA VARSAYILAN -------------------
(function () {
  let idleTimer = null;
  let clockInterval = null;
  let userActivityEvents = null;
  let lastLang = null;

  const screen = document.getElementById('idleScreen');
  const clockEl = document.getElementById('idleClock');
  const dateEl = document.getElementById('idleDate');

  if (!screen || !clockEl || !dateEl) return;

  function cleanup() {
    if (idleTimer) clearTimeout(idleTimer);
    if (clockInterval) clearInterval(clockInterval);
    if (userActivityEvents) {
      userActivityEvents.forEach(ev => {
        document.removeEventListener(ev.type, ev.handler, ev.options);
      });
      userActivityEvents = null;
    }
    screen.classList.remove('active');
  }

  function updateClock() {
    const now = new Date();
    const hourSelect = document.getElementById('hourSelections');
    const hour12 = hourSelect?.value === '12';

    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: hour12
    };
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    clockEl.textContent = now.toLocaleTimeString(undefined, timeOptions);
    dateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
  }

  function showIdle() {
    if (screen.classList.contains('active')) return;
    screen.classList.add('active');
    lastLang = null;
    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    const hide = () => {
      screen.classList.remove('active');
      if (clockInterval) clearInterval(clockInterval);
      resetTimer();
    };

    screen.addEventListener('click', hide, { once: true, passive: true });
  }

  window.testIdleScreen = showIdle;

  function resetTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    const enabled = safeGetItem('idleScreenEnabled') === 'true';
    if (!enabled) return;
    const timeoutMinutes = Math.max(1, Math.min(60, parseInt(safeGetItem('idleScreenTimeout')) || 2));
    const timeoutMs = timeoutMinutes * 60 * 1000;
    idleTimer = setTimeout(showIdle, timeoutMs);
  }

  function bindActivityEvents() {
    cleanup();
    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'wheel', 'scroll']
      .map(type => ({ type, handler: resetTimer, options: { passive: true } }));
    events.forEach(ev => document.addEventListener(ev.type, ev.handler, ev.options));
    userActivityEvents = events;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) resetTimer();
    });
  }

  function initIdleScreen(enabled = true, timeoutMinutes = 2) {
    cleanup();
    if (!enabled || timeoutMinutes < 1) {
      screen.classList.remove('active');
      return;
    }
    safeSetItem('idleScreenTimeout', String(timeoutMinutes));
    bindActivityEvents();
    resetTimer();
  }

  window.initIdleScreen = initIdleScreen;

  document.addEventListener('DOMContentLoaded', () => {
    const enabled = safeGetItem('idleScreenEnabled') !== 'false';
    const timeoutMinutes = Math.max(1, parseInt(safeGetItem('idleScreenTimeout')) || 2);
    initIdleScreen(enabled, timeoutMinutes);
  });

  const originalApply = window.applySettings;
  if (originalApply) {
    window.applySettings = async function (options = {}) {
      const result = await originalApply.call(this, options);
      const settings = cachedSettings || loadCachedSettings();
      const enabled = settings.idleScreenEnabled === 'true';
      const timeoutMinutes = Math.max(1, Math.min(60, parseInt(settings.idleScreenTimeout) || 2));
      initIdleScreen(enabled, timeoutMinutes);
      return result;
    };
  }
})();

// ------------------------- Input güncelleme -------------------------
function updateSettingsInputs(settings) {
  const inputMap = {
    bgUrlInput: 'bgUrl',
    fontSelect: 'font',
    themeSelect: 'theme',
    systemThemeSelect: 'systemTheme',
    accentColor: 'accentColor',
    languageSelect: 'language',
    searchEngineSelect: 'searchEngine',
    logoDisplaySelect: 'logoDisplay',
    logoPositionSelect: 'logoPosition',
    logoColorSelect: 'logoColor',
    maxFavorites: 'maxFavorites',
    searchShortcutInput: 'searchShortcut',
    favoriteShortcutInput: 'favoriteShortcut',
    settingsShortcutInput: 'settingsShortcut',
    historyShortcutInput: 'historyShortcut',
    weatherLocation: 'weatherLocation',
    weatherUpdateInterval: 'weatherUpdateInterval',
    linkBehavior: 'linkBehavior',
    multiSearchEnabled: 'multiSearchEnabled',
    aiProviderSelect: 'aiProvider',
    customAiUrl: 'customAiUrl',
    buttonDisplayMode: 'buttonDisplayMode',
    disableAnimations: 'disableAnimations',
    idleScreenEnabled: 'idleScreenEnabled',
    idleScreenTimeout: 'idleScreenTimeout',
    hourSelections: 'hourSelections',
  };

  Object.entries(inputMap).forEach(([inputId, settingKey]) => {
    const el = document.getElementById(inputId);
    if (el) {
      const val = (settings[settingKey] !== undefined && settings[settingKey] !== null && settings[settingKey] !== '')
                    ? settings[settingKey]
                    : defaultSettings[settingKey] || '';
      el.value = val;
    }
  });

  const toggleIds = [
    'showFavorites', 'showSuggestions', 'showWeather', 'showInfoBar', 'showSearch',
    'showSearchShortcuts', 'showAISearch', 'showAccountButton',
    'showAccountInfoText', 'showTools', 'showLensSearch', 'showVoiceSearch', 'showMultiSearch',
  ];
  toggleIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && settings[id] !== undefined) {
      if (el.type === 'checkbox') {
        el.checked = (settings[id] !== undefined ? settings[id] : defaultSettings[id]) === 'true';
      } else {
        el.value = settings[id];
      }
    }
  });

  const safeSearchOptions = document.getElementById('safeSearchOptions');
  if (safeSearchOptions) {
    safeSearchOptions.value = (settings.safeSearch !== undefined ? settings.safeSearch : defaultSettings.safeSearch) === 'true'
                          ? 'safeSearchEnable' 
                          : 'safeSearchDisable';
  }
  const disableSearchHistoryLogOptions = document.getElementById('disableSearchHistoryLogOptions');
  if (disableSearchHistoryLogOptions) {
    disableSearchHistoryLogOptions.value = settings.disableSearchHistoryLog === 'true' ? 'disableSearchHistoryLogEnable' : 'disableSearchHistoryLogDisable';
  }
  const privateModeOptions = document.getElementById('privateModeOptions');
  if (privateModeOptions) {
    privateModeOptions.value = settings.privateMode === 'true' ? 'privateModeEnable' : 'privateModeDisable';
  }

  const idleEl = document.getElementById('idleScreenTimeout');
  if (idleEl) {
    const savedValue = settings.idleScreenTimeout;
    idleEl.value = (savedValue !== undefined && savedValue !== '') ? savedValue : '2';
  }
}

export function updateSettingsPanel() {
  requestAnimationFrame(() => {
    loadCachedSettings();
    const settings = cachedSettings || { ...defaultSettings };
    updateSettingsInputs(settings);
  });
}

// ------------------------- EVENT LISTENERS (EKSİK OLAN KISIM) -------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Uygula butonu
  $('applySettingsBtn')?.addEventListener('click', () => {
    if (saveSettingsFromInputs()) {
      console.log('Ayarlar kaydedildi ve uygulandı.');
    } else {
      console.warn('Ayarlar kaydedilemedi. Depolama alanınızı kontrol edin.');
      alert('Ayarlar kaydedilemedi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
    }
  });

  // Aktar/Al butonu
  $('importSettingsBtn')?.addEventListener('click', openImportExportModal);

  // Modal kapatma
  $('closeImportExportModalBtn')?.addEventListener('click', closeImportExportModal);

  // Dışa aktar
  $('exportSettingsBtn')?.addEventListener('click', () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluxo-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // İçe aktar
  $('importSettingsBtnModal')?.addEventListener('click', () => {
    $('importFileInput')?.click();
  });
  $('importFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const jsonString = ev.target.result;
      if (importSettings(jsonString)) {
        applySettings({
          updateSearchEnginePreview,
          loadCachedBackground,
          updateLanguage: typeof window.updateLanguage === 'function' ? window.updateLanguage : undefined,
          loadFavorites: typeof window.loadFavorites === 'function' ? window.loadFavorites : undefined,
          fetchWeather: typeof window.fetchWeather === 'function' ? window.fetchWeather : undefined,
          bindShortcuts,
          startWeatherUpdate: typeof window.startWeatherUpdate === 'function' ? window.startWeatherUpdate : undefined
        });
        alert('Ayarlar başarıyla içe aktarıldı.');
        closeImportExportModal();
      } else {
        alert('Geçersiz ayar dosyası. Lütfen doğru bir JSON dosyası seçin.');
      }
    };
    reader.onerror = () => {
      console.error('Dosya okuma hatası:', reader.error);
      alert('Dosya okunamadı.');
    };
    reader.readAsText(file);
  });

  // Arka plan yükleme
  $('bgFileInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      await cacheBackgroundImage(url);
      safeSetItem('bgUrl', url);
      loadCachedBackground(url);
      $('bgUrlInput').value = url;
    }
  });

// Arka planı kaldır (doğrulama gerekmiyor)
$('removeBgBtn')?.addEventListener('click', () => {
  safeSetItem('bgUrl', '');
  $('bgUrlInput').value = '';
  loadCachedBackground('');
  alert('Arka plan kaldırıldı.');
});

// Tarayıcıyı sıfırla (resetConfirm ile dil desteği)
$('resetBrowserBtn')?.addEventListener('click', () => {
  const confirmMessage = getLang('resetConfirm') || 'Tüm ayarlar, önbellek ve veriler silinecek. Devam etmek istiyor musunuz?';
  
  if (confirm(confirmMessage)) {
    resetBrowser();
  }
});

  // Başlangıçta ayarları uygula
  applySettings({
    updateSearchEnginePreview,
    loadCachedBackground,
    updateLanguage: typeof window.updateLanguage === 'function' ? window.updateLanguage : undefined,
    loadFavorites: typeof window.loadFavorites === 'function' ? window.loadFavorites : undefined,
    fetchWeather: typeof window.fetchWeather === 'function' ? window.fetchWeather : undefined,
    bindShortcuts,
    startWeatherUpdate: typeof window.startWeatherUpdate === 'function' ? window.startWeatherUpdate : undefined
  });
});

