# Musahhih

Musahhih, profesyonel bir PDF tashih ve akademik okuma (kartoteks) uygulamasıdır. Klasik PDF okuyucularının ötesinde, yayıncılık dünyası ve akademisyenler için özel olarak tasarlanmış çift modlu bir iş akışı sunar.

Tauri (v2) ve React mimarisi üzerine kurulan Musahhih, hem masaüstü (Windows, Linux, macOS) platformlarında native hızında çalışır hem de modern ve estetik bir "Glassmorphism" arayüze sahiptir.

## 🚀 Özellikler

Uygulama iki temel modda çalışır: **Tashih Modu** ve **Kartoteks Modu**.

### 1. Tashih Modu (Proofreading)
Yayıncılık ve editöryal süreçler için tasarlanmıştır. Dizgiciler ile editörler arasında köprü kurar.
- **Dinamik Düzeltme İşaretleri:** Silme (Delete), Ekleme (Insert), Değiştirme (Replace), Boşluk Bırakma (Space) ve Birleştirme (Join) ikonlarını doğrudan PDF üzerinde istediğiniz koordinata bırakabilirsiniz.
- **Hassas Konumlandırma:** İşaretlenen hataların PDF üzerindeki `(x,y)` koordinatları ve sayfa numaraları milimetrik olarak kaydedilir.
- **İçe/Dışa Aktarma (JSON):** Düzeltme listesi `.json` formatında dışa aktarılabilir. Dizgici bu dosyayı kendi bilgisayarında açtığında, tüm düzeltmeler PDF'in üzerinde orijinal konumlarında belirir.
- **Güvenlik Damgası (Stamp):** Karışıklığı önlemek için JSON dosyaları üretilirken PDF'in ismini damgalar. Yanlış bir kitabın hata listesi, başka bir kitaba yüklenmek istendiğinde sistem güvenliği sağlayarak işlemi engeller.

### 2. Kartoteks Modu (Akademik Not Alma)
Akademisyenler, araştırmacılar ve okurlar için geliştirilmiştir.
- **Hızlı Fiş Oluşturma:** PDF üzerinden herhangi bir metni fareyle seçtiğiniz an beliren akıllı menüden veya **sağ tıklayarak** "Kartotekse Ekle" diyerek saniyeler içinde okuma fişi oluşturabilirsiniz.
- **Detaylı Sınıflandırma:** Her fişte *Yazar, Kitap Künyesi, Konu, Sayfa Numarası ve Alıntı/Bilgi* alanları bulunur. (Kitap adı otomatik çekilir).
- **Akordeon Arayüz:** Yüzlerce fiş bile eklense, sol panelde sadece konu başlıkları derli toplu listelenir.
- **Tek Tıkla Referans Kopyalama:** Seçilen fiş `"Alıntı Metni" - Yazar, Kitap, Konu, s. X` formatında otomatik kopyalanır ve makalelerde kullanılmaya hazır hale gelir.
- **Kartoteks Dışa Aktarma:** Notlarınız PDF'ten bağımsız olarak JSON şeklinde dışa aktarılıp yedeklenebilir.

## 🛠️ Teknolojiler
- **Core:** HTML, CSS, JavaScript (React.js)
- **State Management:** Zustand
- **Desktop Framework:** Tauri v2 (Rust tabanlı)
- **PDF Render:** `react-pdf` (Mozilla PDF.js tabanlı)
- **UI Icons:** Lucide React

## 📦 Kurulum ve Çalıştırma

Geliştirme ortamını bilgisayarınıza kurmak için aşağıdaki adımları izleyebilirsiniz. (Sisteminizde Node.js ve Rust yüklü olmalıdır).

1. Repoyu klonlayın:
   ```bash
   git clone <REPO_URL>
   cd musahhih
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run tauri dev
   ```

4. Üretime (Production) hazır, kurulabilir (.exe, .deb, .AppImage) dosyalar oluşturmak için:
   ```bash
   npm run tauri build
   ```

## 🔒 İzinler ve Dosya Sistemi (Tauri)
Musahhih tamamen yerel dosya sisteminizde çalışır. Sunucuya veri göndermez. `src-tauri/capabilities/default.json` dosyası üzerinden sadece uygulamanın ihtiyaç duyduğu belirli dosya ve dizinlere (`read-file`, `write-text-file`) güvenlik çerçevesinde erişim yetkisi verilmiştir.

---
*Bu proje modern web teknolojilerinin gücünü yerel masaüstü deneyimiyle birleştirerek kitap inceleme ve akademik okuma süreçlerini hızlandırmayı amaçlamaktadır.*
