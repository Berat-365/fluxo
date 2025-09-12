document.addEventListener("DOMContentLoaded", () => {
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackStatus = document.getElementById("feedbackStatus");


  if (!feedbackForm) {
    console.error("Hata: feedbackForm elementi bulunamadı!");
    return;
  }

  // Form gönderimi
  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("feedbackTitle").value.trim();
    const message = document.getElementById("feedbackMessage").value.trim();
    const time = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    const templateParams = {
      name: name || "İsimsiz",
      message: message || "Mesaj yok",
      time: time,
    };

    emailjs.send("service_42haimb", "template_fe3yqwq", templateParams)
      .then(() => {
        feedbackStatus.textContent = "Geri bildirim başarıyla gönderildi!";
        feedbackStatus.classList.add("success");
        feedbackStatus.style.display = "block";
        feedbackForm.reset();
      })
      .catch((error) => {
        feedbackStatus.textContent = "Geri bildirim gönderilirken hata oluştu.";
        feedbackStatus.classList.remove("success");
        feedbackStatus.style.display = "block";
        console.error("EmailJS Hatası:", error);
      });
  });
});
