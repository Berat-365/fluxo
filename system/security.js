/* Fluxo Secure Ultra */

export async function protectPages() {
    const allowedPages = ['', 'index.html', 'index', '404.html', '404'];
    let currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    if (currentPage.endsWith('.html')) currentPage = currentPage.replace('.html', '');

    if (currentPage === '404' || currentPage === '404.html') {
        return;
    }

    const params = new URLSearchParams(window.location.search);

    // XSS koruması
    const dangerousPatterns = [/<script/i, /javascript:/i, /onerror/i, /onload/i, /data:/i];
    const allParams = Array.from(params.entries()).map(([key, val]) => `${key}=${val}`).join('&');
    if (dangerousPatterns.some(r => r.test(allParams)) || (window.location.hash && dangerousPatterns.some(p => p.test(window.location.hash)))) {
        window.location.href = '404.html';
        return;
    }

    // Bot kontrolü
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = /bot|crawler|spider|googlebot|bingbot|yandexbot|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot/i;
    if (botPatterns.test(userAgent)) {
        window.location.href = '404.html';
        return;
    }

    // Referer kontrolü
    const allowedReferers = [
        /^https:\/\/[a-zA-Z0-9-]+\.github\.io(\/.*)?$/,
        /^https:\/\/github\.com(\/.*)?$/,
        /^http:\/\/127\.0\.0\.1(:[0-9]+)?(\/.*)?$/,
        /^http:\/\/localhost(:[0-9]+)?(\/.*)?$/
    ];
    const referer = document.referrer;
    if (referer && !allowedReferers.some(r => r.test(referer))) {
        window.location.href = '404.html';
        return;
    }

    // Sistem dosyası bütünlük kontrolü
    const systemFiles = [
        'system/search.js',
        'system/account.js',
        'system/settings.js',
        'system/background.js',
        'system/favorites.js',
        'system/feedbackScript.js',
        'system/firebase-config.js',
        'system/history.js',
        'system/language.js',
        'system/voice.js',
        'system/weather.js',
        'styles/flat.css',
        'styles/fluent.css',
        'styles/neomorph.css',
        'styles/skeuomorph.css',
        'styles/vanilla.css',
        'system/fonts.js',
        'system/gallery.js',
        'languages/ar.js',
        'languages/az.js',
        'languages/ba.js',
        'languages/cv.js',
        'languages/de.js',
        'languages/el.js',
        'languages/en.js',
        'languages/es.js',
        'languages/fr.js',
        'languages/gag.js',
        'languages/he.js',
        'languages/hi.js',
        'languages/it.js',
        'languages/ja.js',
        'languages/kk.js',
        'languages/ko.js',
        'languages/ky.js',
        'languages/mn.js',
        'languages/pt.js',
        'languages/ru.js',
        'languages/sah.js',
        'languages/tk.js',
        'languages/tr.js',
        'languages/tt.js',
        'languages/ug.js',
        'languages/uz.js',
        'languages/zh.js',
        'LICENSE',
        '404.html',
        'SECURITY.md',
    ];

    try {
        const results = await Promise.all(
            systemFiles.map(async file => {
                try {
                    const res = await fetch(file + '?v=' + Date.now(), {
                        method: 'GET',
                        cache: 'no-store',
                        redirect: 'error'
                    });
                    return res.ok;
                } catch {
                    return false;
                }
            })
        );

        const missingFiles = results
            .map((ok, i) => (!ok ? systemFiles[i] : null))
            .filter(Boolean);

        if (missingFiles.length > 0) {
            console.error('Eksik sistem dosyaları:', missingFiles);
            window.location.href = '404.html';
            return;
        }
    } catch (err) {
        console.error('Sistem dosyası kontrol hatası:', err);
        window.location.href = '404.html';
        return;
    }

    // Sayfa kontrolü
    if (!allowedPages.includes(currentPage)) {
        console.log('Sayfa bulunamadı:', currentPage);
        window.location.href = '404.html';
    }
}

/* API Güvenliği */
export function validateApiKey(key, apiType) {
    if (!key || key.includes('<') || key.includes('>') || key.length < 10) {
        throw new Error(`Geçersiz ${apiType} API anahtarı`);
    }
    return key;
}

/* API Çağrısı */
let cachedApiKey = null;
export async function secureFetch(url, options = {}) {
    try {
        if (!cachedApiKey) {
            const apiKey = localStorage.getItem('openWeatherMapApiKey') || '';
            cachedApiKey = validateApiKey(apiKey, 'Weather');
        }
        const sanitizedUrl = url.replace(/<script|javascript:/gi, '');
        const res = await fetch(sanitizedUrl, {
            ...options,
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        if (!res.ok) throw new Error(`API Hatası: ${res.status}`);
        return res;
    } catch (err) {
        console.error('secureFetch hatası:', err);
        throw err;
    }
}

/* Uygunsuz Kullanıcı Adı Kontrolü */
export function isInappropriateUsername(username) {
    const badWords = [
        // İngilizce
        /(fuck|shit|bitch|asshole|damn|bastard|cunt|dick|prick|twat|wanker|bollocks|piss|wank|knob|tosser|git|slag|munter|chav|nonce|paedo|rapist|badass|terrorist)/gi,
        // Türkçe
        /(orospu|piç|siktir|amcık|yarrak|sik|am|avrat|karı|ibne|eşcinsel|lezbiyen|ananı|gay|avradını|sikiyim|sikerim|bok|siksem|amına|amk|ananı sikeyim|avradını siktir|piç kurusu|orospu çocuğu)/gi,
        // Fransızca
        /(merde|putain|salope|con|bite|chatte|enculé|bordel|connard|salopard)/gi,
        // Almanca
        /(scheiße|kacke|arsch|fotze|hurensohn|wichser|dreckssack|arschloch|mist|verdammt)/gi,
        // İspanyolca
        /(joder|coño|polla|concha|puta|maricón|cojones|cabrón|culero|chingar|pinche|pendejo)/gi,
        // Rusça
        /(блять|сука|хуй|пизда|ебать|пидор|мудак|нахуй|пошел на хуй|еб твою мать|пиздец|охуеть)/gi,
        // Japonca
        /(kuso|kusogaki|baka|ahou|chinpo|manji|unko|chinko)/gi,
        // Çince
        /(cào|bi|gǒu pì|tā mā de|shǐ|niǎo|jī bā|wáng bā dàn)/gi,
        // Korece
        /(씨발|개새끼|병신|미친|존나|엠카이|씨팔|개쌔끼)/gi,
        // Arapça
        /(كس|زب|طيز|عاهرة|لواط|قحبة|عاهر|طيزك|زبي|كسي)/gi,
        // Portekizce
        /(caralho|foda-se|porra|puta|filho da puta|vai tomar no cu|merda|vai se foder|cu|buceta)/gi,
        // İtalyanca
        /(cazzo|stronzo|puttana|fottiti|vaffanculo|culo|figa|troia)/gi,
        // İsveççe
        /(fan|helvete|jävlar|skit|djävul|kuk|fitta|hora)/gi,
        // Yunanca
        /(μαλακας|πουτανα|γάμησε|πούστης|αρχίδια|κλάσεις|κώλος|σκατά)/gi,
        // İbranice
        /(שמתי|קצוץ|זיין|כוס|זין|מזדיין|מזדיינת|אמהות|אונס|הומו)/gi,
        // Hintçe
        /(madarchod|behenchod|randi|chutiya|gaand|lavda|bhenchod|kutte|harami|chut|lund)/gi,
        // Moğolca
        /(хуа|бич|шарвага|хуян|ам|яри|пи)/gi,
        // Ek Portekizce varyasyonları
        /(Filhodaputa|Conas|Corno|Vai-tefoder|Chupa-mos)/gi,
    ];

    const lower = username.toLowerCase().trim();
    const validFormat = /^[a-zA-Z0-9_çğıöşüâêîôûàáèéìíòóùâãäåæçèéêëìíîïñòóôõöøùúûüýÿ\-]+$/.test(lower);
    const validLength = lower.length >= 3 && lower.length <= 20;
    const hasBadWord = badWords.some(r => r.test(lower));

    return hasBadWord || !validFormat || !validLength;
}

document.addEventListener('DOMContentLoaded', protectPages);