# Musahhih - Development Notice & Architecture Overview

Bu belge, "Musahhih" (PDF Tashih ve Kartoteks Sistemi) projesinin geliştirme süreçlerini, mimari kararlarını ve gelecekteki geliştirmeler için dikkat edilmesi gereken kritik noktaları (Knowledge Item) özetlemek amacıyla oluşturulmuştur.

## 1. Proje Mimarisi ve Teknoloji Yığını

*   **Frontend Framework:** React 18 (Vite tabanlı)
*   **Desktop Engine:** Tauri v2 (Rust tabanlı)
*   **State Management:** Zustand (`store.js`)
*   **PDF Rendering:** `react-pdf` (Mozilla PDF.js)
*   **UI / Styling:** Pure CSS (`index.css`) + Lucide React İkonları
*   **İşletim Sistemi Hedefleri:** Windows, Linux (ARM/AMD64), potansiyel macOS.

## 2. Temel Modüller ve İş Akışları

Sistem, `App.jsx` üzerinden yönetilen ve `store.js`'deki `appMode` state'ine bağlı çalışan iki farklı ana moda sahiptir:

### A. Tashih Modu (`appMode === 'tashih'`)
*   **Amacı:** PDF üzerinde dizgisel/editoryal hata tespiti (Sil, Ekle, Değiştir, Birleştir, Boşluk).
*   **Bileşenler:** `Workspace.jsx` ve `Sidebar.jsx`.
*   **Çalışma Mantığı:** Kullanıcı, PDF üzerindeki koordinatlara pin (işaretçi) bırakır. `react-pdf`'in DOM yapısı (`react-pdf__Page`) dinlenerek farenin `(x, y)` koordinatları, sayfa ölçeğiyle (scale) oranlanarak state'e kaydedilir.
*   **Veri Yapısı:** Her hata bir obje olarak `corrections` array'inde tutulur.

### B. Kartoteks Modu (`appMode === 'kartoteks'`)
*   **Amacı:** Akademik okuma, metin alıntıları ve not alma.
*   **Bileşenler:** `KartoteksWorkspace.jsx` ve `KartoteksSidebar.jsx`.
*   **Çalışma Mantığı:** Kullanıcı PDF'ten yerleşik (native) tarayıcı seçimi ile metin seçer (`window.getSelection()`). Seçim bitince (mouse up) metnin koordinatları hesaplanıp "Kartotekse Ekle" popover'ı (veya sağ tık bağlam menüsü) belirir.
*   **Veri Yapısı:** Her not, `cards` array'inde tutulur. Yazar, Kitap (otomatik dosya adı), Konu, Bilgi, Sayfa verilerini içerir.

## 3. Kritik Kararlar ve Tauri İzinleri

Proje, Tauri v2'nin sıkı güvenlik modelini (Capabilities) kullanmaktadır. Geliştirme sürecinde dosya (FS) okuma/yazma işlemleri sırasında "InvalidPDFException" veya "permissions denied" hataları yaşanmaması için `src-tauri/capabilities/default.json` dosyasına şu yetkiler tanımlanmıştır:
*   `fs:allow-read-file`
*   `fs:allow-read-text-file`
*   `fs:allow-write-text-file`

Ayrıca `@tauri-apps/plugin-dialog` ve `@tauri-apps/plugin-fs` pluginleri ile tarayıcıların standart `input type="file"` yerine native işletim sistemi dosya pencereleri kullanılmaktadır.

## 4. Güvenlik ve Veri Eşleştirme (Stamp Mekanizması)
Tashih veya Kartoteks verileri JSON olarak dışa aktarılırken, JSON içerisine otomatik olarak o anki PDF'in dosya adı (örnek: `akif_mektuplar.pdf`) `pdfName` key'i ile damgalanır. İçeri aktarma sırasında, eğer sistemdeki PDF adıyla JSON'daki damga eşleşmiyorsa işlem durdurulur ve olası veri karmaşaları önlenir.

## 5. Gelecek Geliştiriciler İçin Notlar
1.  **State Yönetimi:** Zustand, localStorage vs. kullanılmadan (persist edilmeden) RAM'de çalışmaktadır. İleri sürümlerde çökme senaryolarına karşı auto-save (IndexedDB veya Tauri FS) mantığı eklenebilir.
2.  **PDF Ölçeklendirme:** Koordinatlar her zaman PDF'in `scale=1.0` olduğu temel formata göre oranlanır `(x / scale, y / scale)`. Çözünürlük veya pencere boyutu değiştiğinde işaretçilerin kaymaması buna bağlıdır.
3.  **UI:** TailwindCSS bilerek kullanılmamış, daha esnek olan "Vanilla CSS" tercih edilmiştir. Geliştirmeler sırasında `index.css` içindeki "glassmorphism" yapısına sadık kalınmalıdır.
4.  **Worker Sorunu:** `react-pdf` worker dosyası Vite'in `?url` suffix'i ile içe aktarılmıştır. Güncelleme yapılırken worker yollarının Tauri statik assetleri arasında bozulmamasına dikkat edilmelidir.

---
**Tarih:** Ekim 2026
**Proje Durumu:** Stable (V1 - Çift Modlu Mimarinin Tamamlanması)
