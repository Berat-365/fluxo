import { translations } from './language.js';
import { search } from './search.js';

export function initVoiceSearch() {
    const voiceBtn = document.getElementById("voiceSearchBtn");
    const modal = document.getElementById("voiceSearchModal");
    const transcriptDiv = document.getElementById("voiceTranscript");
    const searchInput = document.getElementById("searchInput");
    const confirmBtn = document.getElementById("confirmVoiceBtn");
    const cancelBtn = document.getElementById("cancelVoiceBtn");
    const voiceIcon = document.getElementById("voiceIcon");

    if (!voiceBtn || !modal || !transcriptDiv || !searchInput) {
        console.warn("Voice search elementleri eksik!");
        return;
    }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS || !("webkitSpeechRecognition" in window)) {
        voiceBtn.onclick = () => {
            const lang = localStorage.getItem("language") || "tr";
            alert(translations[lang].voiceSearchNotSupported);
        };
        return;
    }

    const langMap = {
        tr: "tr-TR", en: "en-US", es: "es-ES", ru: "ru-RU", ja: "ja-JP",
        zh: "zh-CN", ko: "ko-KR", de: "de-DE", fr: "fr-FR", ar: "ar-SA",
        az: "az-AZ", tk: "tk-TM", kk: "kk-KZ", ky: "ky-KG", uz: "uz-UZ",
        tt: "tt-RU", ba: "ba-RU", ug: "ug-CN", sah: "sah-RU", gag: "gag-RU",
        cv: "cv-RU", he: "he-IL", hi: "hi-IN", it: "it-IT", el: "el-GR", mn: "mn-MN"
    };

    let recognition;
    let isListening = false;
    let speechTimeout;
    let autoSearchTimeout;

    function cleanup() {
        if (recognition && isListening) recognition.stop();
        clearTimeout(speechTimeout);
        clearTimeout(autoSearchTimeout);
        isListening = false;
        modal.style.display = "none";
        voiceIcon.classList.remove("active");
    }

    voiceBtn.onclick = () => {
        const lang = localStorage.getItem("language") || "tr";
        recognition = new webkitSpeechRecognition();
        recognition.lang = langMap[lang] || "en-US";
        recognition.interimResults = true;
        recognition.continuous = false;

        transcriptDiv.textContent = translations[lang].voiceSearch || "Söyledikleriniz burada görünecek...";
        modal.style.display = "block";
        voiceIcon.classList.add("active");
        isListening = true;

        recognition.start();

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript = transcript.trim();
                    transcriptDiv.textContent = finalTranscript;
                    searchInput.value = finalTranscript;

                    clearTimeout(autoSearchTimeout);
                    autoSearchTimeout = setTimeout(() => {
                        if (searchInput.value.trim()) {
                            search('web'); // Gerçek arama motoruna yönlendirir
                            cleanup();
                        }
                    }, 10000);
                } else {
                    interimTranscript += transcript;
                    transcriptDiv.textContent = interimTranscript.trim() || translations[lang].voiceSearch;
                }
            }
        };

        recognition.onerror = (event) => {
            transcriptDiv.textContent = `${translations[lang].voiceSearchNotSupported} (Hata: ${event.error})`;
            cleanup();
        };

        recognition.onend = () => {
            clearTimeout(speechTimeout);
            voiceIcon.classList.remove("active");
        };

        // Maksimum dinleme süresi
        speechTimeout = setTimeout(() => {
            if (isListening) {
                transcriptDiv.textContent = translations[lang].voiceSearchNotSupported + " (Zaman aşımı)";
                cleanup();
            }
        }, 10000);
    };

    // Onay tuşu
    confirmBtn.onclick = () => {
        if (searchInput.value.trim()) {
            clearTimeout(autoSearchTimeout);
            search('web'); // Gerçek arama motoruna yönlendirir
            cleanup();
        }
    };

    // İptal tuşu
    cancelBtn.onclick = () => {
        clearTimeout(autoSearchTimeout);
        cleanup();
    };
}
