// feedbackScript.js

// EmailJS başlatma
emailjs.init("aq-zHpAOGx4vIhf5o");

document.addEventListener("DOMContentLoaded", () => {
  const feedbackForm = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("submitFeedbackBtn");
  const feedbackStatus = document.getElementById("feedbackStatus");

  if (!feedbackForm || !submitBtn || !feedbackStatus) {
    console.error("Hata: Form, buton veya status elementi bulunamadı!");
    return;
  }

  // Global dil ve translations al (ana script'ten)
  let currentLang = window.currentLang || localStorage.getItem("language") || "tr";
  const translations = window.translations || {};  // Fallback: Boş obje, hata vermez

  // Dil değişimini dinle (ana script event'i)
  window.addEventListener("languageUpdated", (e) => {
    currentLang = e.detail || "tr";
    console.log("Dil güncellendi (feedback):", currentLang);  // Debug log
  });

  // Validation fonksiyonu
  function validateForm() {
    const name = document.getElementById("feedbackTitle").value.trim();
    const message = document.getElementById("feedbackMessage").value.trim();
    if (!name || !message) {
      feedbackStatus.textContent = translations[currentLang]?.pleaseFillTitleAndMessage || "Lütfen başlık ve mesajı doldurun.";
      feedbackStatus.className = "feedback-error";
      feedbackStatus.style.display = "block";
      setTimeout(() => {
        feedbackStatus.style.display = "none";
      }, 5000);
      return false;
    }
    return true;
  }

  // Buton click event'i
  submitBtn.addEventListener("click", (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const name = document.getElementById("feedbackTitle").value.trim();
    const message = document.getElementById("feedbackMessage").value.trim();
    const time = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    const templateParams = {
      name: name || (translations[currentLang]?.anonymous || "İsimsiz"),
      message: message || (translations[currentLang]?.noMessage || "Mesaj yok"),
      time: time,
    };

    // Loading state
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = translations[currentLang]?.sending || "Gönderiliyor...";

    emailjs.send("service_l8clapn", "template_kqibszq", templateParams)
      .then((response) => {
        console.log("Başarılı:", response.status, response.text);
        feedbackStatus.textContent = translations[currentLang]?.feedbackSentSuccessfully || "Geri bildirim başarıyla gönderildi!";
        feedbackStatus.className = "feedback-success";
        feedbackStatus.style.display = "block";
        feedbackForm.reset();

        setTimeout(() => {
          feedbackStatus.style.display = "none";
        }, 5000);
      })
      .catch((error) => {
        console.error("EmailJS Hatası:", error);
        feedbackStatus.textContent = translations[currentLang]?.feedbackSendError || "Geri bildirim gönderilirken hata oluştu. Lütfen tekrar deneyin.";
        feedbackStatus.className = "feedback-error";
        feedbackStatus.style.display = "block";

        setTimeout(() => {
          feedbackStatus.style.display = "none";
        }, 5000);
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = translations[currentLang]?.submitFeedback || "Geri Bildirim Gönder";
      });
  });
});
