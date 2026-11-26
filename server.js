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
    const veri = fs.readFileSync(VERI_DOSYASI, "utf-8");
    return JSON.parse(veri);
}

function gorevleriKaydet(gorevler) {
    fs.writeFileSync(VERI_DOSYASI, JSON.stringify(gorevler, null, 2));
}

// 1. GET: Tüm görevleri getir
app.get("/api/gorevler", (req, res) => {
    const gorevler = gorevleriOku();
    res.json(gorevler);
});

// 2. POST: Yeni görev ekle
app.post("/api/gorevler", (req, res) => {
    const gorevler = gorevleriOku();
    const yeniGorev = {
        id: Date.now().toString(),
        metin: req.body.metin,
        tamamlandi: false,
        oncelik: req.body.oncelik || "normal",
        sonTarih: req.body.sonTarih || null
    };

    gorevler.push(yeniGorev);
    gorevleriKaydet(gorevler);
    res.status(201).json(yeniGorev);
});

// 3. PUT: Tek bir görevi güncelle (Tamamlandı durumu veya metin düzenleme)
app.put("/api/gorevler/:id", (req, res) => {
    const gorevler = gorevleriOku();
    const gorevIndex = gorevler.findIndex(g => g.id === req.params.id);

    if (gorevIndex === -1) {
        return res.status(404).json({ hata: "Görev bulunamadı" });
    }

    gorevler[gorevIndex] = { ...gorevler[gorevIndex], ...req.body };
    gorevleriKaydet(gorevler);
    res.json(gorevler[gorevIndex]);
});

// 4. PUT: Sürükle-bırak sonrası listenin yeni sırasını kaydet
app.put("/api/gorevler", (req, res) => {
    if (Array.isArray(req.body)) {
        gorevleriKaydet(req.body);
        return res.json({ mesaj: "Sıralama güncellendi" });
    }
    res.status(400).json({ hata: "Geçersiz veri formatı" });
});

// 5. DELETE: Tek bir görevi sil
app.delete("/api/gorevler/:id", (req, res) => {
    let gorevler = gorevleriOku();
    gorevler = gorevler.filter(g => g.id !== req.params.id);
    gorevleriKaydet(gorevler);
    res.json({ mesaj: "Görev silindi" });
});

// 6. DELETE: Tüm görevleri temizle
app.delete("/api/gorevler", (req, res) => {
    gorevleriKaydet([]);
    res.json({ mesaj: "Tüm görevler temizlendi" });
});

app.listen(PORT, () => {
    console.log(`🚀 Sunucu aktif: http://localhost:${PORT}`);
});