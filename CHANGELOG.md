## [yayınlandı] - 2024-12-21 - v.1.0.21
### Değiştirilenler
- **Test Modülü Geçişi**: Projenin test modülü Jest'ten Vitest'e geçirildi.
  - Jest bağımlılıkları kaldırıldı ve Vitest eklendi.
  - Test dosyaları Vitest ile uyumlu olacak şekilde güncellendi.
  - Jest ile yazılmış testler Vitest ile uyumlu hale getirildi.
  - Test ortamı, Vitest tarafından sağlanan özelliklerle optimize edildi.
  - Jest'e özgü bazı test fonksiyonları ve özellikleri Vitest karşılıkları ile değiştirildi.

### Kaldırılanlar
- Jest bağımlılıkları ve yapılandırmaları projeden kaldırıldı.

---

## [yayınlandı] - 2024-12-21 - v.1.0.22
### Düzeltmeler
- **Tarayıcıda Boş Seçim Dosya Sıfırlama Sorunu**:
  - Dosya seçimi ekranı kapatıldığında seçim yapılmadan dosyanın sıfırlanması sorununa çözüm getirildi.
