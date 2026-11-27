const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const VERI_DOSYASI = path.join(__dirname, "gorevler.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(VERI_DOSYASI)) {
    fs.writeFileSync(VERI_DOSYASI, JSON.stringify([], null, 2));
}

function gorevleriOku() {
    try {
        const veri = fs.readFileSync(VERI_DOSYASI, "utf-8");
        return JSON.parse(veri);
    } catch (e) {
        return [];
    }
}

function gorevleriKaydet(gorevler) {
    fs.writeFileSync(VERI_DOSYASI, JSON.stringify(gorevler, null, 2));
}

function kullaniciIdAl(req) {
    return req.headers["x-user-id"] || "varsayilan";
}

// 1. GET: Yalnızca ilgili kullanıcının görevlerini getir
app.get("/api/gorevler", (req, res) => {
    const userId = kullaniciIdAl(req);
    const gorevler = gorevleriOku().filter(g => g.userId === userId);
    res.json(gorevler);
});

// 2. POST: Kullanıcı kimliğiyle yeni görev ekle
app.post("/api/gorevler", (req, res) => {
    const userId = kullaniciIdAl(req);
    const gorevler = gorevleriOku();

    const yeniGorev = {
        id: Date.now().toString(),
        userId: userId,
        metin: req.body.metin,
        tamamlandi: false,
        oncelik: req.body.oncelik || "normal",
        sonTarih: req.body.sonTarih || null
    };

    gorevler.push(yeniGorev);
    gorevleriKaydet(gorevler);
    res.status(201).json(yeniGorev);
});

// 3. PUT: Tek bir görevi güncelle (Metin, öncelik, tarih veya tamamlandı durumu)
app.put("/api/gorevler/:id", (req, res) => {
    const userId = kullaniciIdAl(req);
    const gorevler = gorevleriOku();
    const gorevIndex = gorevler.findIndex(g => g.id === req.params.id && g.userId === userId);

    if (gorevIndex === -1) {
        return res.status(404).json({ hata: "Görev bulunamadı" });
    }

    const { id, userId: _korunanId, ...guncellenecekAlanlar } = req.body;
    gorevler[gorevIndex] = { ...gorevler[gorevIndex], ...guncellenecekAlanlar };
    gorevleriKaydet(gorevler);
    res.json(gorevler[gorevIndex]);
});

// 4. PUT: Sürükle-bırak sonrası yalnızca ilgili kullanıcının sıralamasını güncelle
app.put("/api/gorevler", (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ hata: "Geçersiz veri formatı" });
    }

    const userId = kullaniciIdAl(req);
    const tumGorevler = gorevleriOku();
    const digerKullaniciGorevleri = tumGorevler.filter(g => g.userId !== userId);
    const guncelKullaniciGorevleri = req.body.map(g => ({ ...g, userId }));

    gorevleriKaydet([...digerKullaniciGorevleri, ...guncelKullaniciGorevleri]);
    res.json({ mesaj: "Sıralama güncellendi" });
});

// 5. DELETE: Tek bir görevi sil
app.delete("/api/gorevler/:id", (req, res) => {
    const userId = kullaniciIdAl(req);
    let gorevler = gorevleriOku();
    gorevler = gorevler.filter(g => !(g.id === req.params.id && g.userId === userId));
    gorevleriKaydet(gorevler);
    res.json({ mesaj: "Görev silindi" });
});

// 6. DELETE: Yalnızca ilgili kullanıcının görevlerini temizle
app.delete("/api/gorevler", (req, res) => {
    const userId = kullaniciIdAl(req);
    const gorevler = gorevleriOku();
    const kalanGorevler = gorevler.filter(g => g.userId !== userId);
    gorevleriKaydet(kalanGorevler);
    res.json({ mesaj: "Tüm görevler temizlendi" });
});

app.listen(PORT, () => {
    console.log(`🚀 Sunucu aktif: http://localhost:${PORT}`);
});