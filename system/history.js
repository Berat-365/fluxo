import { translations } from './language.js';
import { search } from './search.js';


export function loadSearchHistory() {
    const lang = localStorage.getItem("language") || "tr";
    const historyList = document.getElementById("historyList");
    if (historyList) {
        historyList.innerHTML = "";
        const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
        const historyEngines = JSON.parse(localStorage.getItem("searchHistoryEngines") || "[]");
        if (history.length === 0) {
            const noHistoryMsg = document.createElement("li");
            noHistoryMsg.textContent = translations[lang]?.noHistory || "Geçmiş yok";
            historyList.appendChild(noHistoryMsg);
        } else {
            history.forEach((item, i) => {
                const engine = historyEngines[i] || "Bilinmeyen";
                const li = document.createElement("li");
                li.className = "history-item";
                li.innerHTML = `
                    <span class="history-text">${item}</span>
                    <img class="history-engine-logo" src="assets/engines/${engine.toLowerCase()}.png" alt="${engine}" onerror="this.src='assets/engines/unknown.png'">
                    <span class="history-remove-btn">×</span>
                `;
                li.querySelector(".history-text").onclick = () => {
                    document.getElementById("searchInput").value = item;
                    document.getElementById("suggestions").style.display = "none";
                    search(); // Import from search.js
                };
                const removeBtn = li.querySelector(".history-remove-btn");
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeSearchHistory(i);
                };
                historyList.appendChild(li);
            });
        }
    }
}

export function removeSearchHistory(index) {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    const historyEngines = JSON.parse(localStorage.getItem("searchHistoryEngines") || "[]");
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        historyEngines.splice(index, 1);
        localStorage.setItem("searchHistory", JSON.stringify(history));
        localStorage.setItem("searchHistoryEngines", JSON.stringify(historyEngines));
        loadSearchHistory();
    } else {
        console.warn("Geçersiz tarih indeksi:", index);
    }
}
