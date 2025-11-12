// favorites.js
import { translations } from './language.js';

const FOLDERS_KEY = "userFolders";
const MAX_FOLDERS = 10;
const MAX_ITEMS_PER_FOLDER = 5;

function getMaxFavorites() {
    return parseInt(localStorage.getItem("maxFavorites") || "5", 10);
}

function t(key, placeholders = {}) {
    const lang = localStorage.getItem("language") || "tr";
    let text = translations[lang]?.[key] || translations.tr[key] || key;
    Object.keys(placeholders).forEach(p => {
        text = text.replace(`{${p}}`, placeholders[p]);
    });
    return text;
}

// === EXPORT ===
export function saveFavorites(favs) {
    try {
        localStorage.setItem("userFavorites", JSON.stringify(favs));
    } catch (e) {
        console.warn("Favoriler kaydedilemedi:", e);
    }
}

export function loadFavorites() {
    const cont = document.getElementById("favorites");
    cont.innerHTML = "";
    cont.addEventListener("dragover", handleDragOver);
    cont.addEventListener("drop", handleDrop);

    let favs = [], folders = [], linkBehavior = "newTab";
    try {
        favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
        folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
        linkBehavior = localStorage.getItem("linkBehavior") || "newTab";
    } catch (e) {
        localStorage.setItem("userFavorites", "[]");
        localStorage.setItem(FOLDERS_KEY, "[]");
    }

    const theme = localStorage.getItem("theme") || "light";
    const textColor = theme === "light" ? "#000000" : "var(--text-light)";

    // === KLASÖRLER (ORİJİNAL GÖRÜNÜM) ===
    folders.forEach((folder, fIndex) => {
        const folderDiv = document.createElement("div");
        folderDiv.className = "favorite-item folder-item";
        folderDiv.draggable = true;
        folderDiv.dataset.folderIndex = fIndex;

        const iconSrc = folder.icon && folder.icon !== "" 
            ? folder.icon 
            : (theme === "light" ? "assets/dark/folder.png" : "assets/light/folder.png");

        folderDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                <img src="${iconSrc}" style="width:32px; height:32px; border-radius:6px;" alt="Klasör">
                <span style="
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 12px;
                    color: ${textColor};
                    text-align: center;
                    max-width: 70px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    position: relative;
                    top: 12px;
                ">${folder.name}</span>
            </div>
        `;

        folderDiv.onclick = (e) => {
            e.stopPropagation();
            openFolderModal(fIndex, folder, e.pageX, e.pageY);
        };

        folderDiv.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            showFolderContextMenu(e, fIndex, folder);
        });

        folderDiv.addEventListener("dragstart", handleDragStart);
        folderDiv.addEventListener("dragover", handleDragOver);
        folderDiv.addEventListener("drop", (e) => handleDropToFolder(e, fIndex));
        cont.appendChild(folderDiv);
    });

    // === NORMAL FAVORİLER (ORİJİNAL) ===
    favs.forEach((f, i) => {
        if (!f.url || !f.name) return;
        let faviconUrl = "ico/default-favicon.png";
        try {
            faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(f.url).hostname}`;
        } catch {}

        const btn = document.createElement("div");
        btn.className = "favorite-item";
        btn.draggable = true;
        btn.dataset.index = i;
        btn.innerHTML = `
            <div style="display:flex; flex-direction: column; align-items: center; gap:4px; text-align: center;">
                <img src="${faviconUrl}" style="width:32px;height:32px;border-radius:6px;" onerror="this.src='assets/logo.png'">
                <a href="${f.url}" ${linkBehavior === "closeCurrent" ? "" : 'target="_blank"'}>${f.name}</a>
            </div>
        `;

        btn.addEventListener("dragstart", handleDragStart);
        btn.addEventListener("dragover", handleDragOver);
        btn.addEventListener("drop", handleDrop);
        btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            showFavoriteContextMenu(e, i, f);
        });

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(f.url, linkBehavior === "newTab" ? "_blank" : "_self");
        };

        cont.appendChild(btn);
    });

    // === EKLE BUTONU (BİRLEŞİK SINIR) ===
    const totalMainItems = favs.length + folders.length;
    const maxFavorites = getMaxFavorites();
    const isFull = totalMainItems >= maxFavorites;

    const addBtn = document.createElement("div");
    addBtn.id = "addFavoriteBtn";
    addBtn.className = "favorite-item accent";
    addBtn.innerHTML = `<span data-lang="addFavorite">${t("addFavorite")}</span>`;
    addBtn.onclick = () => {
        document.getElementById("addFavoriteModal").style.display = "block";
        document.getElementById("modalName").focus();
    };
    cont.appendChild(addBtn);
    addBtn.style.display = isFull ? "none" : "flex";
}

export function removeFavorite(i) {
    const favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
    favs.splice(i, 1);
    saveFavorites(favs);
    loadFavorites();
}

let currentOpenFolderIndex = -1;
let lastModalPos = { x: 100, y: 100 };

// === EXPORT: handleDragStart ===
export function handleDragStart(e) {
    const el = e.currentTarget;
    let type, index, folderIndex;

    if (el.classList.contains("folder-item")) {
        type = "folder";
        index = parseInt(el.dataset.folderIndex);
    } else if (el.dataset.itemIndex !== undefined) {
        type = "folder-item";
        index = parseInt(el.dataset.itemIndex);
        folderIndex = parseInt(el.dataset.folderIndex);
    } else {
        type = "fav";
        index = parseInt(el.dataset.index);
    }

    e.dataTransfer.setData("application/json", JSON.stringify({ type, index, folderIndex }));
}

// === EXPORT: handleDragOver ===
export function handleDragOver(e) {
    e.preventDefault();
}

// === EXPORT: handleDrop ===
export function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const dragged = JSON.parse(data);

    const droppedItem = e.target.closest(".favorite-item");
    const isFolderDrop = droppedItem?.classList.contains("folder-item");
    if (isFolderDrop && dragged.type !== "folder") return;

    let targetIndex = droppedItem ? parseInt(droppedItem.dataset.index || droppedItem.dataset.folderIndex) : -1;
    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    const favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
    const maxFavorites = getMaxFavorites();

    if (dragged.type === "fav") {
        if (targetIndex === -1) targetIndex = favs.length;
        if (dragged.index === targetIndex) return;

        const [item] = favs.splice(dragged.index, 1);
        const insertIdx = dragged.index < targetIndex ? targetIndex - 1 : targetIndex;
        favs.splice(insertIdx, 0, item);
        saveFavorites(favs);
    }

    if (dragged.type === "folder") {
        if (targetIndex === -1) targetIndex = folders.length;
        if (dragged.index === targetIndex) return;

        const newTotal = favs.length + folders.length;
        if (newTotal > maxFavorites) {
            alert(t("totalMaxFavorites", { max: maxFavorites }));
            loadFavorites();
            return;
        }

        const [folder] = folders.splice(dragged.index, 1);
        const insertIdx = dragged.index < targetIndex ? targetIndex - 1 : targetIndex;
        folders.splice(insertIdx, 0, folder);
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }

    loadFavorites();
    if (currentOpenFolderIndex !== -1) {
        setTimeout(() => openFolderModal(currentOpenFolderIndex, folders[currentOpenFolderIndex], lastModalPos.x, lastModalPos.y), 100);
    }
}

// === EXPORT: handleDropToFolder ===
export function handleDropToFolder(e, targetFolderIndex) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const dragged = JSON.parse(data);

    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    const favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");

    if (folders[targetFolderIndex].items.length >= MAX_ITEMS_PER_FOLDER) {
        alert(t("folderMaxItems"));
        return;
    }

    const targetItem = e.target.closest("[data-item-index]");
    let targetItemIndex = targetItem ? parseInt(targetItem.dataset.itemIndex) : folders[targetFolderIndex].items.length;

    if (dragged.type === "fav") {
        const [item] = favs.splice(dragged.index, 1);
        folders[targetFolderIndex].items.splice(targetItemIndex, 0, item);
        saveFavorites(favs);
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } else if (dragged.type === "folder-item") {
        if (dragged.folderIndex === targetFolderIndex) {
            if (dragged.index === targetItemIndex) return;
            const [item] = folders[dragged.folderIndex].items.splice(dragged.index, 1);
            const insertIdx = dragged.index < targetItemIndex ? targetItemIndex - 1 : targetItemIndex;
            folders[dragged.folderIndex].items.splice(insertIdx, 0, item);
        } else {
            const [item] = folders[dragged.folderIndex].items.splice(dragged.index, 1);
            folders[targetFolderIndex].items.splice(targetItemIndex, 0, item);
        }
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }

    loadFavorites();
    if (currentOpenFolderIndex !== -1) {
        const updated = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
        closeFolderModal();
        setTimeout(() => openFolderModal(currentOpenFolderIndex, updated[currentOpenFolderIndex], lastModalPos.x, lastModalPos.y), 100);
    }
}

// === EXPORT: addFavoriteFromModal ===
export async function addFavoriteFromModal() {
    const name = document.getElementById("modalName").value.trim();
    let url = document.getElementById("modalUrl").value.trim();
    if (!url) return alert(t("invalidUrlAlert"));
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;

    try { new URL(url); } catch { return alert(t("invalidUrlAlert")); }

    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    const favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
    const maxFavorites = getMaxFavorites();

    const totalMainItems = favs.length + folders.length;

    const folderSelect = document.getElementById("folderSelect");
    if (folderSelect.style.display === "block") {
        const selected = parseInt(document.getElementById("folderDropdown").value);
        if (isNaN(selected)) return alert(t("selectFolder"));
        if (folders[selected].items.length >= MAX_ITEMS_PER_FOLDER) return alert(t("folderMaxItems"));

        const finalName = name || url;
        folders[selected].items.push({ name: finalName, url });
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } else {
        if (totalMainItems >= maxFavorites) {
            alert(t("totalMaxFavorites", { max: maxFavorites }));
            return;
        }

        const finalName = name || url;
        favs.push({ name: finalName, url });
        saveFavorites(favs);
    }

    loadFavorites();
    closeAddFavoriteModal();
}

function closeAddFavoriteModal() {
    document.getElementById("addFavoriteModal").style.display = "none";
    document.getElementById("modalName").value = "";
    document.getElementById("modalUrl").value = "";
    document.getElementById("folderSelect").style.display = "none";
}

// === EXPORT: showFavoriteContextMenu ===
export function showFavoriteContextMenu(e, index, fav) {
    showItemContextMenu(e, "normal", index, fav, null);
}

function showItemContextMenu(e, type, index, item, folderIndex) {
    toggleMenuOff();
    const menu = document.getElementById("favoriteContextMenu");
    menu.style.display = "block";
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    menu.dataset.type = type;
    menu.dataset.index = index;
    if (type === "folder-item") menu.dataset.folderIndex = folderIndex;

    const target = e.target.closest(".favorite-item");
    if (target) target.classList.add("context-active");
}

// === EXPORT: showFolderContextMenu ===
export function showFolderContextMenu(e, index, folder) {
    toggleMenuOff();
    const menu = document.getElementById("folderContextMenu");
    menu.style.display = "block";
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    menu.dataset.folderIndex = index;

    const target = e.target.closest(".folder-item");
    if (target) target.classList.add("context-active");
}

// === GLOBAL FONKSİYONLAR ===
window.createFolder = function () {
    const folderName = prompt(t("enterFolderName"));
    if (!folderName?.trim()) return;

    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    const favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
    const totalMainItems = favs.length + folders.length;
    const maxFavorites = getMaxFavorites();

    if (totalMainItems >= maxFavorites) {
        alert(t("totalMaxFavorites", { max: maxFavorites }));
        return;
    }

    folders.push({ name: folderName.trim(), items: [], icon: "" });
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    loadFavorites();
};

window.openFolderModal = function (folderIndex, folder, x, y) {
    toggleMenuOff();
    currentOpenFolderIndex = folderIndex;
    lastModalPos = { x, y };

    const modal = document.getElementById("folderModal");
    const content = modal.querySelector(".modal-content");
    const title = document.getElementById("folderTitle");
    title.textContent = folder.name;

    title.onclick = () => {
        const input = document.createElement("input");
        input.value = folder.name;
        input.style.cssText = "width:100%; font-size:inherit; font-weight:inherit; border:1px solid var(--text-light); border-radius:4px; padding:2px 4px;";
        title.innerHTML = ""; title.appendChild(input); input.focus();

        const save = () => {
            const newName = input.value.trim();
            if (newName) {
                const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
                folders[folderIndex].name = newName;
                localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
                title.textContent = newName;
                loadFavorites();
            } else {
                title.textContent = folder.name;
            }
        };

        input.addEventListener("keypress", e => e.key === "Enter" && save());
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Escape" && (title.textContent = folder.name));
    };

    const cont = document.getElementById("folderFavorites");
    cont.innerHTML = "";
    cont.addEventListener("dragover", handleDragOver);
    cont.addEventListener("drop", e => handleDropToFolder(e, folderIndex));

    const linkBehavior = localStorage.getItem("linkBehavior") || "newTab";
    folder.items.forEach((item, i) => {
        let faviconUrl = "ico/default-favicon.png";
        try { faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}`; } catch {}

        const div = document.createElement("div");
        div.className = "favorite-item";
        div.draggable = true;
        div.dataset.itemIndex = i;
        div.dataset.folderIndex = folderIndex;
        div.innerHTML = `
            <div style="display:flex; flex-direction: column; align-items: center; gap:4px; text-align: center;">
                <img src="${faviconUrl}" style="width:32px;height:32px;border-radius:6px;" onerror="this.src='assets/logo.png'">
                <a href="${item.url}" ${linkBehavior === "closeCurrent" ? "" : 'target="_blank"'}>${item.name}</a>
            </div>
        `;

        div.addEventListener("dragstart", handleDragStart);
        div.addEventListener("dragover", handleDragOver);
        div.addEventListener("drop", e => handleDropToFolder(e, folderIndex));
        div.addEventListener("contextmenu", e => {
            e.preventDefault();
            showItemContextMenu(e, "folder-item", i, item, folderIndex);
        });
        div.onclick = e => {
            e.preventDefault(); e.stopPropagation();
            window.open(item.url, linkBehavior === "newTab" ? "_blank" : "_self");
        };

        cont.appendChild(div);
    });
    
const isRTL = document.dir === "rtl" || document.documentElement.dir === "rtl";

if (isRTL) {
    content.style.right = `${window.innerWidth - x}px`;
    content.style.left = "auto";
} else {
    content.style.left = `${x}px`;
    content.style.right = "auto";
}
content.style.top = `${y}px`;

    modal.style.display = "block";
};

window.closeFolderModal = function () {
    currentOpenFolderIndex = -1;
    document.getElementById("folderModal").style.display = "none";
};

window.removeFromFolder = function (folderIndex, itemIndex) {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    folders[folderIndex].items.splice(itemIndex, 1);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    loadFavorites();
    const folder = folders[folderIndex];
    if (folder) {
        closeFolderModal();
        setTimeout(() => openFolderModal(folderIndex, folder, lastModalPos.x, lastModalPos.y), 100);
    }
};

window.toggleFolderAdd = function () {
    const selectDiv = document.getElementById("folderSelect");
    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    const dropdown = document.getElementById("folderDropdown");
    dropdown.innerHTML = "";

    if (folders.length === 0) return alert(t("createFolderFirst"));

    folders.forEach((f, i) => {
        const opt = document.createElement("option");
        opt.value = i; opt.textContent = f.name;
        dropdown.appendChild(opt);
    });

    selectDiv.style.display = selectDiv.style.display === "block" ? "none" : "block";
};

function toggleMenuOff() {
    ["favoriteContextMenu", "folderContextMenu"].forEach(id => {
        const menu = document.getElementById(id); // DÜZELTİLDİ!
        if (menu) {
            menu.style.display = "none";
            delete menu.dataset.index;
            delete menu.dataset.type;
            delete menu.dataset.folderIndex;
        }
    });
    document.querySelectorAll(".context-active").forEach(el => el.classList.remove("context-active"));
}

document.addEventListener("click", e => {
    if (!e.target.closest("#favoriteContextMenu, #folderContextMenu, .fav-menu-item")) {
        toggleMenuOff();
    }
    if (e.target.id === "folderModal" || !e.target.closest(".modal-content")) {
        closeFolderModal();
    }
});

window.addEventListener("keyup", e => {
    if (e.key === "Escape") {
        toggleMenuOff();
        closeFolderModal();
    }
});

// Context menü işlemleri
document.getElementById("favoriteContextMenu")?.addEventListener("click", function (e) {
    const target = e.target.closest(".fav-menu-item");
    if (!target) return;
    const action = target.dataset.action;
    const menu = this;
    const type = menu.dataset.type;
    const index = parseInt(menu.dataset.index);
    if (isNaN(index)) return;

    if (type === "normal") {
        let favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
        const fav = favs[index];
        switch (action) {
            case "open": window.open(fav.url, "_blank"); break;
            case "renameFav":
                const name = prompt(t("renameFavorite"), fav.name);
                if (name?.trim()) { favs[index].name = name.trim(); saveFavorites(favs); loadFavorites(); }
                break;
            case "moveLeft": if (index > 0) { [favs[index], favs[index - 1]] = [favs[index - 1], favs[index]]; saveFavorites(favs); loadFavorites(); } break;
            case "moveRight": if (index < favs.length - 1) { [favs[index], favs[index + 1]] = [favs[index + 1], favs[index]]; saveFavorites(favs); loadFavorites(); } break;
            case "remove": removeFavorite(index); break;
        }
    } else if (type === "folder-item") {
        const folderIndex = parseInt(menu.dataset.folderIndex);
        let folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
        const item = folders[folderIndex].items[index];
        switch (action) {
            case "open": window.open(item.url, "_blank"); break;
            case "renameFav":
                const name = prompt(t("renameFavorite"), item.name);
                if (name?.trim()) { folders[folderIndex].items[index].name = name.trim(); localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); updateFolderModal(folderIndex); }
                break;
            case "remove": removeFromFolder(folderIndex, index); break;
            case "moveLeft": if (index > 0) { [folders[folderIndex].items[index], folders[folderIndex].items[index - 1]] = [folders[folderIndex].items[index - 1], folders[folderIndex].items[index]]; localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); updateFolderModal(folderIndex); } break;
            case "moveRight": if (index < folders[folderIndex].items.length - 1) { [folders[folderIndex].items[index], folders[folderIndex].items[index + 1]] = [folders[folderIndex].items[index + 1], folders[folderIndex].items[index]]; localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); updateFolderModal(folderIndex); } break;
            case "moveToMain":
                const favs = JSON.parse(localStorage.getItem("userFavorites") || "[]");
                const moved = folders[folderIndex].items.splice(index, 1)[0];
                favs.push(moved);
                saveFavorites(favs); localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
                loadFavorites(); updateFolderModal(folderIndex);
                break;
        }
    }
    toggleMenuOff();
});

document.getElementById("folderContextMenu")?.addEventListener("click", function (e) {
    const target = e.target.closest(".fav-menu-item");
    if (!target) return;
    const action = target.dataset.action;
    const index = parseInt(this.dataset.folderIndex);
    if (isNaN(index)) return;

    let folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    switch (action) {
        case "renameFolder":
            const name = prompt(t("newFolderName"), folders[index].name);
            if (name?.trim()) { folders[index].name = name.trim(); localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); loadFavorites(); }
            break;
        case "removeFolder":
            if (confirm(t("confirmDeleteFolder"))) { folders.splice(index, 1); localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); loadFavorites(); }
            break;
        case "moveLeft": if (index > 0) { [folders[index], folders[index - 1]] = [folders[index - 1], folders[index]]; localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); loadFavorites(); } break;
        case "moveRight": if (index < folders.length - 1) { [folders[index], folders[index + 1]] = [folders[index + 1], folders[index]]; localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); loadFavorites(); } break;
        case "changeIcon":
            const icon = prompt(t("newIconUrl"), folders[index].icon || "");
            if (icon?.trim()) { folders[index].icon = icon.trim(); localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); loadFavorites(); }
            break;
    }
    toggleMenuOff();
});

function updateFolderModal(folderIndex) {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
    closeFolderModal();
    setTimeout(() => openFolderModal(folderIndex, folders[folderIndex], lastModalPos.x, lastModalPos.y), 100);
}