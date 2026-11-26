# Full-Stack Görev Yönetim Uygulaması (To-Do App)

Modern cam efekti (Glassmorphism) arayüzüne sahip, Node.js ve Express tabanlı kalıcı veri depolamalı görev yönetim uygulaması.

## Özellikler

- **Full-Stack Mimari:** Node.js ve Express.js ile yazılmış RESTful API (`/api/gorevler`) ve JSON tabanlı kalıcı veri depolama.
- **Akıllı Görev Yönetimi:** Görev ekleme, tamamlama, çift tıklama veya buton ile satır içi düzenleme ve silme.
- **Sürükle-Bırak Sıralama:** HTML5 Drag & Drop API ile görev öncelik sırasını özgürce değiştirme.
- **Dinamik Öncelik ve Zaman Takibi:** Varsayılan cihaz saati atama, son tarih takibi ve süresi geçen görevler için otomatik uyarı.
- **Anlık Arama ve Filtreleme:** Tümü, Yapılacaklar ve Tamamlananlar sekmeleri ile canlı metin arama.
- **PDF Raporlama:** `html2pdf.js` entegrasyonu ile Türkçe karakter destekli A4 görev raporu indirme.
- **Kişiselleştirme ve Geri Bildirim:** 4 farklı dinamik arka plan teması, Web Audio API ile kodla üretilen onay sesi ve tamamlama konfetisi.

## Kullanılan Teknolojiler

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Fetch API, Drag & Drop API, Web Audio API)
- **Backend:** Node.js, Express.js, File System (`fs`)

## Kurulum ve Çalıştırma

Projeyi bilgisayarınızda çalıştırmak için:

1. Depoyu bilgisayarınıza klonlayın:
   ```bash
   git clone [https://github.com/basak-yoruk/todo-fullstack-app.git](https://github.com/basak-yoruk/todo-fullstack-app.git)
   ```
2. Proje klasörüne girin ve gerekli paketleri yükleyin:
   ```bash
   cd todo-fullstack-app
   npm install
   ```
3. Sunucuyu başlatın:
   ```bash
   node server.js
   ```
4. Tarayıcınızda `http://localhost:3000` adresine gidin.