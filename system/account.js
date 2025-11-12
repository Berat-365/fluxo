import { translations } from './language.js';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { isInappropriateUsername } from './security.js';

// IndexedDB for profile pics
let dbPromise = openDB('userDB', 1, {
    upgrade(db) {
        db.createObjectStore('profilePics', { keyPath: 'username' });
    }
});

async function openDB(name, version, options) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => options.upgrade(e.target.result, e.target.transaction);
    });
}

async function getProfilePic(username) {
    const db = await dbPromise;
    return new Promise((resolve) => {
        const tx = db.transaction('profilePics', 'readonly');
        const store = tx.objectStore('profilePics');
        const request = store.get(username);
        request.onsuccess = () => resolve(request.result?.pic || null);
    });
}

async function setProfilePic(username, pic) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profilePics', 'readwrite');
        const store = tx.objectStore('profilePics');
        const request = store.put({ username, pic });
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}

async function removeProfilePic(username) {
    if (!username) return;
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profilePics', 'readwrite');
        const store = tx.objectStore('profilePics');
        const request = store.delete(username);
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}

// Firebase init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Local users storage (hashed passwords)
let storedUsers = JSON.parse(localStorage.getItem("users") || "{}");

// Password hashing (PBKDF2)
async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const saltB64 = btoa(String.fromCharCode(...salt));
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    return { hash: hashB64, salt: saltB64 };
}

async function verifyPassword(password, storedHash, salt) {
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    return hashB64 === storedHash;
}

// Rate Limiting
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 50000;

function checkRateLimit(username) {
    const lang = localStorage.getItem("language") || "tr";
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "{}");
    const now = Date.now();
    let userAttempts = attempts[username];
    if (userAttempts) {
        if (now - userAttempts.lastAttempt >= LOCKOUT_DURATION) {
            userAttempts.count = 0;
            userAttempts.lastAttempt = now;
            localStorage.setItem("loginAttempts", JSON.stringify(attempts));
        } else if (userAttempts.count >= MAX_ATTEMPTS) {
            const remaining = Math.ceil((LOCKOUT_DURATION - (now - userAttempts.lastAttempt)) / 1000 / 60);
            const rateLimitMsg = translations[lang]?.rateLimitError || "Çok fazla deneme. {remaining} dakika bekleyin.";
            return { isLocked: true, message: rateLimitMsg.replace("{remaining}", remaining) };
        }
    }
    return { isLocked: false };
}

function recordFailedAttempt(username) {
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "{}");
    if (!attempts[username]) attempts[username] = { count: 0, lastAttempt: Date.now() };
    attempts[username].count += 1;
    attempts[username].lastAttempt = Date.now();
    localStorage.setItem("loginAttempts", JSON.stringify(attempts));
}

function resetRateLimit(username) {
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "{}");
    if (attempts[username]) {
        attempts[username].count = 0;
        attempts[username].lastAttempt = Date.now();
        localStorage.setItem("loginAttempts", JSON.stringify(attempts));
    }
}

// Strong password check
function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
}

// Update profile button
async function updateProfileButton() {
    const username = localStorage.getItem("accountUsername");
    const btn = document.getElementById("accountButton");
    const theme = localStorage.getItem("theme") || "dark";
    const accountIcon = theme === "light" ? "assets/dark/account.png" : "assets/light/account.png";
    btn.innerHTML = '';
    if (username) {
        const profilePic = await getProfilePic(username);
        if (profilePic) {
            const img = document.createElement('img');
            img.src = profilePic;
            img.alt = "Profil Resmi";
            img.style.borderRadius = '50%';
            img.style.width = '40px';
            img.style.height = '40px';
            btn.appendChild(img);
        } else {
            const img = document.createElement('img');
            img.src = accountIcon;
            img.alt = "Hesap";
            img.style.borderRadius = '50%';
            img.style.width = '40px';
            img.style.height = '40px';
            btn.appendChild(img);
        }
    } else {
        const img = document.createElement('img');
        img.src = accountIcon;
        img.alt = "Hesap";
        img.style.borderRadius = '50%';
        img.style.width = '20px';
        img.style.height = '20px';
        btn.appendChild(img);
    }
}

// Is local user?
function isLocalUserSession() {
    return !auth.currentUser && !!localStorage.getItem("accountUsername");
}

// Auth observer
onAuthStateChanged(auth, async (user) => {
    if (user && user.providerData[0]?.providerId === "google.com") {
        let username = user.displayName || user.email.split('@')[0];
        localStorage.setItem("accountUsername", username);
        const originalName = localStorage.getItem("originalUsername");
        document.getElementById("revertNameBtn").style.display = originalName && username !== originalName ? "block" : "none";
        if (user.photoURL) {
            const img = document.createElement('img');
            img.src = user.photoURL;
            img.alt = "Profil Resmi";
            img.style.borderRadius = '50%';
            img.style.width = '40px';
            img.style.height = '40px';
            document.getElementById("accountButton").innerHTML = '';
            document.getElementById("accountButton").appendChild(img);
        }
        resetRateLimit(username);
    } else if (!user) {
        if (!isLocalUserSession()) {
            const currentUsername = localStorage.getItem("accountUsername");
            localStorage.removeItem("accountUsername");
            localStorage.removeItem("originalUsername");
            if (currentUsername) {
                await removeProfilePic(currentUsername);
            }
            document.getElementById("revertNameBtn").style.display = "none";
            await updateProfileButton();
        }
    }
    updateAccountUI();
});

export function updateAccountUI() {
    const lang = localStorage.getItem("language") || "tr";
    const username = localStorage.getItem("accountUsername");
    const info = document.getElementById("accountInfo");
    const btn = document.getElementById("accountButton");
    const infoRight = document.getElementById("infoRight");

    if (username) {
        info.textContent = `${username}`;
        btn.title = translations[lang]?.accountLoggedIn || "Hesap (Çıkış için tıkla)";
    } else {
        info.textContent = "";
        btn.title = translations[lang]?.accountLogin || "Hesap (Giriş için tıkla)";
    }

    infoRight.style.display = username ? "block" : "none";
}

export function showAccountModal() {
    const modal = document.getElementById("accountModal");
    const username = localStorage.getItem("accountUsername");
    const errorMsg = document.getElementById("accountError");
    errorMsg.style.display = "none";
    const lang = localStorage.getItem("language") || "tr";
    if (username) {
        document.getElementById("accountForm").style.display = "none";
        document.getElementById("accountLoggedIn").style.display = "flex";
        document.getElementById("accountWelcome").textContent = `${translations[lang]?.welcome || "Hoşgeldin"}, ${username}!`;
        document.getElementById("editNameInput").value = username;
        const originalName = localStorage.getItem("originalUsername");
        document.getElementById("revertNameBtn").style.display = originalName && username !== originalName ? "block" : "none";
        const user = auth.currentUser;
        const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
        document.getElementById("uploadPicBtn").style.display = isLocal ? "block" : "none";
        document.querySelector('.profile-edit input[type="file"]').style.display = isLocal ? "block" : "none";
        document.getElementById("removePicBtn").style.display = isLocal ? "block" : "none";
        document.getElementById("savePicBtn").style.display = window.selectedFile ? "block" : "none";
        document.getElementById("picPreview").style.display = isLocal ? "block" : "none";
        const picLabel = document.querySelector('label[for="profilePicInput"].section-label');
        if (picLabel) picLabel.style.display = isLocal ? "block" : "none";
        document.getElementById("uploadPicBtn").disabled = !isLocal;
        document.querySelector('.profile-edit input[type="file"]').disabled = !isLocal;
        document.getElementById("removePicBtn").disabled = !isLocal;
        document.getElementById("savePicBtn").disabled = !isLocal;
        if (!isLocal) document.getElementById("picPreview").innerHTML = "";
    } else {
        document.getElementById("accountForm").style.display = "flex";
        document.getElementById("accountLoggedIn").style.display = "none";
        document.getElementById("accountUsername").value = "";
        document.getElementById("accountPassword").value = "";
        const picLabel = document.querySelector('label[for="profilePicInput"].section-label');
        if (picLabel) picLabel.style.display = "none";
    }
    modal.style.display = "block";
    modal.classList.add("active");
}

export function closeAccountPanel() {
    const modal = document.getElementById("accountModal");
    modal.style.display = "none";
    modal.classList.remove("active");
    const input = document.getElementById("profilePicInput");
    if (input) {
        input.value = "";
        input.style.display = "none";
    }
    window.selectedFile = null;
}

export function updateAccountModalTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    const inner = document.getElementById("accountModalInner");
    if (!inner) return;
    inner.classList.remove("dark", "light");
    inner.classList.add(theme);
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (isLocalUserSession()) {
        await updateProfileButton();
        updateAccountUI();
    }
    await updateProfileButton();
    updateAccountUI();

    // Login
    document.getElementById("accountLoginBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const username = document.getElementById("accountUsername").value.trim();
        const password = document.getElementById("accountPassword").value.trim();
        const errorMsg = document.getElementById("accountError");
        errorMsg.style.display = "none";

        const rateLimit = checkRateLimit(username);
        if (rateLimit.isLocked) {
            errorMsg.textContent = rateLimit.message;
            errorMsg.style.display = "block";
            return;
        }

        if (!username || !isStrongPassword(password)) {
            errorMsg.textContent = translations[lang]?.accountError || "Kullanıcı adı ve şifre en az 6 karakter, büyük/küçük harf ve rakam içermeli.";
            errorMsg.style.display = "block";
            recordFailedAttempt(username);
            return;
        }

        const userData = storedUsers[username];
        if (userData && await verifyPassword(password, userData.hash, userData.salt)) {
            localStorage.setItem("accountUsername", username);
            const originalName = localStorage.getItem("originalUsername") || username;
            localStorage.setItem("originalUsername", originalName);
            await updateProfileButton();
            closeAccountPanel();
            resetRateLimit(username);
            location.reload();
        } else {
            errorMsg.textContent = translations[lang]?.accountError || "Hatalı kullanıcı adı veya şifre.";
            errorMsg.style.display = "block";
            recordFailedAttempt(username);
        }
    };

    // Register
    document.getElementById("accountRegisterBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const username = document.getElementById("accountUsername").value.trim();
        const password = document.getElementById("accountPassword").value.trim();
        const errorMsg = document.getElementById("accountError");
        errorMsg.style.display = "none";

        const rateLimit = checkRateLimit(username);
        if (rateLimit.isLocked) {
            errorMsg.textContent = rateLimit.message;
            errorMsg.style.display = "block";
            return;
        }

        if (!username || !isStrongPassword(password)) {
            errorMsg.textContent = translations[lang]?.accountError || "Kullanıcı adı ve şifre en az 6 karakter, büyük/küçük harf ve rakam içermeli.";
            errorMsg.style.display = "block";
            recordFailedAttempt(username);
            return;
        }

        if (isInappropriateUsername(username)) {
            errorMsg.textContent = translations[lang]?.inappropriateUsername || "Bu kullanıcı adı uygunsuz.";
            errorMsg.style.display = "block";
            recordFailedAttempt(username);
            return;
        }

        if (storedUsers[username]) {
            errorMsg.textContent = translations[lang]?.usernameTaken || "Kullanıcı adı alınmış.";
            errorMsg.style.display = "block";
            recordFailedAttempt(username);
            return;
        }

        const { hash, salt } = await hashPassword(password);
        storedUsers[username] = { hash, salt };
        localStorage.setItem("users", JSON.stringify(storedUsers));
        localStorage.setItem("accountUsername", username);
        localStorage.setItem("originalUsername", username);
        await updateProfileButton();
        closeAccountPanel();
        resetRateLimit(username);
        location.reload();
    };

    // Save name
    document.getElementById("saveNameBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const newName = document.getElementById("editNameInput").value.trim();
        const username = localStorage.getItem("accountUsername");
        const errorMsg = document.getElementById("accountError");
        errorMsg.style.display = "none";

        if (!newName) {
            errorMsg.textContent = translations[lang]?.accountError || "Kullanıcı adı boş olamaz.";
            errorMsg.style.display = "block";
            return;
        }

        const user = auth.currentUser;
        const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
        if (isLocal && isInappropriateUsername(newName)) {
            errorMsg.textContent = translations[lang]?.inappropriateUsername || "Bu kullanıcı adı uygunsuz.";
            errorMsg.style.display = "block";
            return;
        }

        if (newName && username) {
            localStorage.setItem("accountUsername", newName);
            if (user && user.providerData[0]?.providerId === "google.com") {
                try {
                    await updateProfile(user, { displayName: newName });
                } catch (error) {
                    errorMsg.textContent = translations[lang]?.nameChangeError || "Ad değiştirme başarısız.";
                    errorMsg.style.display = "block";
                    return;
                }
            }
            updateAccountUI();
            alert(translations[lang]?.nameChanged || "Ad değiştirildi!");
            location.reload();
        }
    };

    // Revert name
    document.getElementById("revertNameBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const originalName = localStorage.getItem("originalUsername");
        const user = auth.currentUser;
        const errorMsg = document.getElementById("accountError");
        errorMsg.style.display = "none";

        if (originalName) {
            const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
            if (isLocal && isInappropriateUsername(originalName)) {
                errorMsg.textContent = translations[lang]?.inappropriateUsername || "Orijinal ad uygunsuz.";
                errorMsg.style.display = "block";
                return;
            }
            localStorage.setItem("accountUsername", originalName);
            if (user && user.providerData[0]?.providerId === "google.com") {
                try {
                    await updateProfile(user, { displayName: originalName });
                } catch (error) {
                    errorMsg.textContent = translations[lang]?.nameRevertError || "Ad geri yüklenemedi.";
                    errorMsg.style.display = "block";
                    return;
                }
            }
            updateAccountUI();
            document.getElementById("revertNameBtn").style.display = "none";
            alert(translations[lang]?.nameReverted || "Orijinal ad geri yüklendi!");
            location.reload();
        }
    };

    // Upload pic
    document.getElementById("uploadPicBtn").onclick = () => {
        const lang = localStorage.getItem("language") || "tr";
        const user = auth.currentUser;
        const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
        if (!isLocal) {
            alert(translations[lang]?.googlePicError || "Google hesaplarında resim değiştirilemez.");
            return;
        }
        const input = document.getElementById("profilePicInput");
        input.value = "";
        input.style.display = "block";
        input.click();
    };

    document.getElementById("profilePicInput").onchange = async (e) => {
        const lang = localStorage.getItem("language") || "tr";
        const user = auth.currentUser;
        const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
        const input = document.getElementById("profilePicInput");
        if (!isLocal) {
            alert(translations[lang]?.googlePicError || "Google hesaplarında resim değiştirilemez.");
            e.target.value = "";
            input.style.display = "none";
            return;
        }
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert(translations[lang]?.invalidFileType || "Sadece resim dosyaları (PNG, JPEG, GIF).");
                e.target.value = "";
                input.style.display = "none";
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(translations[lang]?.fileTooLarge || "Dosya 5MB'dan büyük olamaz.");
                e.target.value = "";
                input.style.display = "none";
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById("picPreview").innerHTML = `<img src="${ev.target.result}" style="width: 50px; height: 50px; border-radius: 50%;">`;
                document.getElementById("savePicBtn").style.display = "block";
            };
            reader.readAsDataURL(file);
            window.selectedFile = file;
        }
        input.style.display = "none";
    };

    document.getElementById("savePicBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const file = window.selectedFile;
        const username = localStorage.getItem("accountUsername");
        const user = auth.currentUser;
        const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
        if (!isLocal) {
            alert(translations[lang]?.googlePicError || "Google hesaplarında resim değiştirilemez.");
            return;
        }
        if (file && username) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                await setProfilePic(username, ev.target.result);
                await updateProfileButton();
                alert(translations[lang]?.picSaved || "Profil resmi kaydedildi!");
                closeAccountPanel();
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove pic
    document.getElementById("removePicBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const user = auth.currentUser;
        const isLocal = !user || user.providerData[0]?.providerId !== "google.com";
        const username = localStorage.getItem("accountUsername");
        if (!isLocal) {
            alert(translations[lang]?.googlePicError || "Google hesaplarında resim değiştirilemez.");
            return;
        }
        if (username) {
            await removeProfilePic(username);
            await updateProfileButton();
            document.getElementById("picPreview").innerHTML = "";
            document.getElementById("removePicBtn").style.display = "none";
            alert(translations[lang]?.picRemoved || "Profil resmi kaldırıldı!");
        }
    };

    // Logout - Düzeltildi: Google logout'ta localStorage temizle
    document.getElementById("accountLogoutBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const user = auth.currentUser;
        if (user && user.providerData[0]?.providerId === "google.com") {
            signOut(auth).then(async () => {
                localStorage.removeItem("accountUsername");
                localStorage.removeItem("originalUsername");
                closeAccountPanel();
                location.reload();
                await updateProfileButton();
                alert(translations[lang]?.loggedOut || "Çıkış yapıldı!");
            }).catch(() => {
                const errorMsg = document.getElementById("accountError");
                errorMsg.textContent = translations[lang]?.logoutError || "Çıkış yapılamadı.";
                errorMsg.style.display = "block";
            });
        } else {
            const username = localStorage.getItem("accountUsername");
            localStorage.removeItem("accountUsername");
            localStorage.removeItem("originalUsername");
            if (username) {
                await removeProfilePic(username);
            }
            closeAccountPanel();
            location.reload();
            await updateProfileButton();
            alert(translations[lang]?.loggedOut || "Çıkış yapıldı!");
        }
    };

    // Google Login
    document.getElementById("googleLoginBtn").onclick = async () => {
        const lang = localStorage.getItem("language") || "tr";
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const username = result.user.displayName || result.user.email.split('@')[0];
                localStorage.setItem("accountUsername", username);
                localStorage.setItem("originalUsername", username);
                closeAccountPanel();
                location.reload();
                alert(translations[lang]?.loggedIn || "Google ile giriş başarılı!");
            })
            .catch(() => {
                const errorMsg = document.getElementById("accountError");
                errorMsg.textContent = translations[lang]?.googleLoginError || "Google ile giriş yapılamadı.";
                errorMsg.style.display = "block";
            });
    };
});