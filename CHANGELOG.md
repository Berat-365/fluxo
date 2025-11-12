# Changelog

Fluxo Zenora için düzenlemeler burada yer alır

---

## Fluxo 4.20.7 - 2025-11-12
### 🚀 Yeni Özellikler
- Wikipedia, Searx, Wolfram, Internet Archive arama motorları eklendi
- Matematiksel arama önerileri eklendi

### 🐛 Düzeltmeler
- aiProvider hataları giderildi artık ayarlardan ai sağlayıcıyı değiştirdiğinizde sizi varsayılana yönlendirmeyecek
- AI araması yapıldığında geçmişte ikon bulunmadığından hata vermesi düzenlendi AI ikonları eklendi
- Bazı kaydedilmeyen ayarlar fixlendi
- settings.js:792  importSettings error: SyntaxError: Unexpected token 'o', "[object File]" is not valid JSON
    at JSON.parse (<anonymous>)
    at importSettings (settings.js:783:27)
    at document.getElementById.onchange (index.html:1036:15) hatası giderildi
- İmport sistemi geliştirildi

---
