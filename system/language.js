// system/language.js

// ----------------------------
// Dilleri import et
// ----------------------------
import tr from '../languages/tr.js';
import en from '../languages/en.js';
import az from '../languages/az.js';
import tk from '../languages/tk.js';
import gag from '../languages/gag.js';
import kk from '../languages/kk.js';
import ky from '../languages/ky.js';
import uz from '../languages/uz.js';
import tt from '../languages/tt.js';
import ba from '../languages/ba.js';
import ug from '../languages/ug.js';
import sah from '../languages/sah.js';
import cv from '../languages/cv.js';
import mn from '../languages/mn.js';
import ja from '../languages/ja.js';
import zh from '../languages/zh.js';
import ko from '../languages/ko.js';
import de from '../languages/de.js';
import fr from '../languages/fr.js';
import it from '../languages/it.js';
import es from '../languages/es.js';
import ru from '../languages/ru.js';
import pt from '../languages/pt.js';
import el from '../languages/el.js';
import ar from '../languages/ar.js';
import he from '../languages/he.js';
import hi from '../languages/hi.js';

// ----------------------------
// Tüm çeviriler objesi
// ----------------------------
export const translations = {
    tr, en, az, tk, gag, kk, ky, uz, tt, ba, ug, sah, cv, mn, ja, zh, ko,
    de, fr, it, es, ru, pt, el, ar, he, hi
};

// ----------------------------
// Kullanıcıya toast göstermek için
// ----------------------------
function showNotification(message) {
    const existing = document.getElementById('langNotification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'langNotification';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 20px';
    toast.style.background = 'rgba(0, 0, 0, 0)';
    toast.style.color = 'white';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '9999';
    toast.style.fontFamily = 'sans-serif';
    toast.style.fontSize = '14px';
    toast.style.transition = 'opacity 0.5s, transform 0.5s';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ----------------------------
// Dili güncelleme fonksiyonu
// ----------------------------
export function updateLanguage(lang) {
    let browserLangMessage = '';
    
    if (!translations[lang]) {
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            lang = browserLang;
            browserLangMessage = translations[lang].browserLangUsed || `Tarayıcı diliniz '${browserLang}' kullanılıyor.`;
        } else {
            lang = 'en';
            browserLangMessage = translations[lang].browserLangUnsupported || `Tarayıcı diliniz uygulanamadı. İngilizce kullanılıyor.`;
        }
    }

    // ===== RTL OTOMATİK AYAR =====
    const rtlLanguages = ['ar', 'he', 'ug'];
    document.documentElement.dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // ----------------------------
    // Tüm elementleri çevir
    // ----------------------------
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        const text = translations[lang][key];
        if (!text) return;

        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
            el.placeholder = text;
        } else if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else {
            el.textContent = text;
        }
    });

    // ----------------------------
    // Özel ID elementleri
    // ----------------------------
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = translations[lang].searchPlaceholder || "Search...";

    const feedbackTextarea = document.getElementById('feedbackMessage');
    if (feedbackTextarea && translations[lang].feedbackMessageHolder) {
        feedbackTextarea.placeholder = translations[lang].feedbackMessageHolder;
    }

    const accountPassword = document.getElementById('accountPassword');
    if (accountPassword && translations[lang].accountPasswordInput) {
        accountPassword.placeholder = translations[lang].accountPasswordInput;
    }

    const langDisplay = document.getElementById('languageDisplay');
    if (langDisplay) langDisplay.textContent = translations[lang].languageDisplay || lang.toUpperCase();

    const addFavBtn = document.getElementById('addFavoriteBtn');
    if (addFavBtn) addFavBtn.textContent = translations[lang].addFavorite || '+';

    // ----------------------------
    // Yeni browser lang mesaj elementleri
    // ----------------------------
    const browserLangUsedEl = document.querySelector('[data-lang-key="browserLangUsed"]');
    if (browserLangUsedEl && translations[lang].browserLangUsed) {
        browserLangUsedEl.textContent = translations[lang].browserLangUsed;
    }

    const browserLangUnsupportedEl = document.querySelector('[data-lang-key="browserLangUnsupported"]');
    if (browserLangUnsupportedEl && translations[lang].browserLangUnsupported) {
        browserLangUnsupportedEl.textContent = translations[lang].browserLangUnsupported;
    }

    // ----------------------------
    // Toast göster
    // ----------------------------
    if (browserLangMessage) showNotification(browserLangMessage);

    console.log(`Dil '${lang}' uygulandı. ${rtlLanguages.includes(lang) ? 'RTL etkin.' : 'LTR etkin.'}`);
}

// ----------------------------
// Sayfa yüklendiğinde başlangıç dili
// ----------------------------
const savedLang = localStorage.getItem('selectedLang');
const browserLang = navigator.language.split('-')[0];
const initialLang = savedLang && translations[savedLang] ? savedLang :
                    translations[browserLang] ? browserLang : 'en';

updateLanguage(initialLang);

// ----------------------------
// Dropdown ile dil seçimi
// ----------------------------
const langSelect = document.getElementById('languageSelect');
if (langSelect) {
    langSelect.value = initialLang;

    langSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        localStorage.setItem('selectedLang', selected);
        updateLanguage(selected);
        langSelect.value = selected;
    });
}