const gorevInput = document.getElementById("gorevInput");
const oncelikSecici = document.getElementById("oncelikSecici");
const tarihSecici = document.getElementById("tarihSecici");
const ekleBtn = document.getElementById("ekleBtn");
const gorevListesi = document.getElementById("gorevListesi");

const ilerlemeMetni = document.getElementById("ilerlemeMetni");
const ilerlemeYuzde = document.getElementById("ilerlemeYuzde");
const ilerlemeCubugu = document.getElementById("ilerlemeCubugu");

const filtreButonlari = document.querySelectorAll(".filtre-btn");
const kalanSayac = document.getElementById("kalanSayac");
const tumunuTemizleBtn = document.getElementById("tumunuTemizleBtn");

const aramaInput = document.getElementById("aramaInput");
const pdfIndirBtn = document.getElementById("pdfIndirBtn");

const API_URL = "/api/gorevler";

let gorevler = [];
let aktifFiltre = "tumu";
let aramaMetni = "";
let suruklenenGorev = null;

// Web Audio API ile onay sesi üretir
function onaySesiCal() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
        // Ses engellenirse sessizce devam et
    }
}

function ikonBul(metin) {
    const kucukMetin = metin.toLowerCase();
    const kurallar = [
        { kelimeler: ["ekmek", "süt", "market", "al", "yumurta", "su", "meyve"], ikon: "🛒" },
        { kelimeler: ["kod", "ders", "sınav", "proje", "github", "çalış", "ödev"], ikon: "💻" },
        { kelimeler: ["spor", "yürüyüş", "koşu", "su iç", "ilaç", "doktor"], ikon: "💪" },
        { kelimeler: ["fatura", "kira", "öde", "banka", "para", "yatır"], ikon: "💳" },
        { kelimeler: ["ara", "mesaj", "mail", "toplantı", "görüş"], ikon: "📞" },
        { kelimeler: ["temizlik", "çamaşır", "bulaşık", "topla", "yıka"], ikon: "🧹" }
    ];

    for (let kural of kurallar) {
        if (kural.kelimeler.some(kelime => kucukMetin.includes(kelime))) {
            return kural.ikon;
        }
    }
    return "📌";
}

function tarihiFormatla(tarihStr) {
    const tarih = new Date(tarihStr);
    return tarih.toLocaleString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function varsayilanTarihiAyarla() {
    if (!tarihSecici) return;
    const simdi = new Date();
    simdi.setHours(simdi.getHours() + 1);
    const yerelZaman = new Date(simdi.getTime() - simdi.getTimezoneOffset() * 60000);
    tarihSecici.value = yerelZaman.toISOString().slice(0, 16);
}

// 1. GET: Sunucudan tüm görevleri çek ve ekranı çiz
async function gorevleriGetir() {
    try {
        const yanit = await fetch(API_URL);
        gorevler = await yanit.json();
        ekraniCiz();
    } catch (hata) {
        console.error("Görevler sunucudan alınamadı:", hata);
    }
}

// Satır içi görev metni düzenleme (PUT /api/gorevler/:id)
function duzenlemeyiBaslat(icerikDiv, yaziSpan, gorev) {
    const mevcutMetin = gorev.metin;
    const input = document.createElement("input");
    input.type = "text";
    input.value = mevcutMetin;
    input.className = "duzenle-input";

    input.addEventListener("click", (e) => e.stopPropagation());
    icerikDiv.replaceChild(input, yaziSpan);
    input.focus();

    let kaydedildi = false;

    async function duzenlemeyiKaydet() {
        if (kaydedildi) return;
        kaydedildi = true;

        const yeniMetin = input.value.trim();
        if (yeniMetin !== "" && yeniMetin !== mevcutMetin) {
            gorev.metin = yeniMetin;
            try {
                await fetch(`${API_URL}/${gorev.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ metin: yeniMetin })
                });
            } catch (hata) {
                console.error("Görev güncellenemedi:", hata);
            }
        }
        ekraniCiz();
    }

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") duzenlemeyiKaydet();
    });

    input.addEventListener("blur", duzenlemeyiKaydet);
}

function ekraniCiz() {
    gorevListesi.innerHTML = "";

    const suzulenGorevler = gorevler.filter(gorev => {
        const sekmeUygun =
            aktifFiltre === "yapilacak" ? !gorev.tamamlandi :
            aktifFiltre === "tamamlanan" ? gorev.tamamlandi : true;

        const aramaUygun = gorev.metin.toLowerCase().includes(aramaMetni);
        return sekmeUygun && aramaUygun;
    });

    const oncelikEtiketleri = {
        acil: "Acil",
        normal: "Normal",
        dusuk: "Düşük"
    };

    const simdi = new Date();

    suzulenGorevler.forEach(gorev => {
        const oncelik = gorev.oncelik || "normal";
        const yeniGorev = document.createElement("li");
        yeniGorev.draggable = true;
        yeniGorev.classList.add(`oncelik-${oncelik}`);

        if (gorev.tamamlandi) {
            yeniGorev.classList.add("tamamlandi");
        }

        // Sürükle-Bırak Sıralama (PUT /api/gorevler)
        yeniGorev.addEventListener("dragstart", function() {
            suruklenenGorev = gorev;
            yeniGorev.classList.add("surukleniyor");
        });

        yeniGorev.addEventListener("dragend", function() {
            suruklenenGorev = null;
            yeniGorev.classList.remove("surukleniyor");
            document.querySelectorAll("#gorevListesi li").forEach(el => el.classList.remove("ustune-gelindi"));
        });

        yeniGorev.addEventListener("dragover", function(olay) {
            olay.preventDefault();
            if (suruklenenGorev && suruklenenGorev !== gorev) {
                yeniGorev.classList.add("ustune-gelindi");
            }
        });

        yeniGorev.addEventListener("dragleave", function() {
            yeniGorev.classList.remove("ustune-gelindi");
        });

        yeniGorev.addEventListener("drop", async function(olay) {
            olay.preventDefault();
            if (suruklenenGorev && suruklenenGorev !== gorev) {
                const eskiIndex = gorevler.indexOf(suruklenenGorev);
                const yeniIndex = gorevler.indexOf(gorev);
                gorevler.splice(eskiIndex, 1);
                gorevler.splice(yeniIndex, 0, suruklenenGorev);
                ekraniCiz();

                try {
                    await fetch(API_URL, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(gorevler)
                    });
                } catch (hata) {
                    console.error("Sıralama kaydedilemedi:", hata);
                }
            }
        });

        const surukleSpan = document.createElement("span");
        surukleSpan.className = "surukle-ikon";
        surukleSpan.textContent = "⋮⋮";
        surukleSpan.title = "Sıralamak için sürükle";

        const ikonSpan = document.createElement("span");
        ikonSpan.className = "gorev-ikon";
        ikonSpan.textContent = ikonBul(gorev.metin);

        const icerikDiv = document.createElement("div");
        icerikDiv.className = "gorev-icerik";

        const yaziSpan = document.createElement("span");
        yaziSpan.className = "gorev-metin";
        yaziSpan.textContent = gorev.metin;

        yaziSpan.addEventListener("dblclick", function(olay) {
            olay.stopPropagation();
            duzenlemeyiBaslat(icerikDiv, yaziSpan, gorev);
        });

        icerikDiv.appendChild(yaziSpan);

        if (gorev.sonTarih) {
            const tarihSpan = document.createElement("span");
            tarihSpan.className = "gorev-tarih";

            const hedefZaman = new Date(gorev.sonTarih);
            const gecikmisMi = !gorev.tamamlandi && hedefZaman < simdi;

            if (gecikmisMi) {
                tarihSpan.classList.add("gecikmis");
                tarihSpan.textContent = `⚠️ Süresi Geçti (${tarihiFormatla(gorev.sonTarih)})`;
            } else {
                tarihSpan.textContent = `🕒 ${tarihiFormatla(gorev.sonTarih)}`;
            }

            icerikDiv.appendChild(tarihSpan);
        }

        // Tamamlandı Durumu Değiştirme (PUT /api/gorevler/:id)
        yeniGorev.addEventListener("click", async function() {
            gorev.tamamlandi = !gorev.tamamlandi;

            if (gorev.tamamlandi) {
                onaySesiCal();
                const hepsiBittiMi = gorevler.length > 0 && gorevler.every(g => g.tamamlandi);
                if (hepsiBittiMi && typeof confetti === "function") {
                    confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }

            ekraniCiz();

            try {
                await fetch(`${API_URL}/${gorev.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tamamlandi: gorev.tamamlandi })
                });
            } catch (hata) {
                console.error("Durum güncellenemedi:", hata);
            }
        });

        const rozetSpan = document.createElement("span");
        rozetSpan.className = `oncelik-rozet rozet-${oncelik}`;
        rozetSpan.textContent = oncelikEtiketleri[oncelik];

        const duzenleBtn = document.createElement("button");
        duzenleBtn.className = "duzenle-btn";
        duzenleBtn.title = "Görevi Düzenle";
        duzenleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `;

        duzenleBtn.addEventListener("click", function(olay) {
            olay.stopPropagation();
            duzenlemeyiBaslat(icerikDiv, yaziSpan, gorev);
        });

        const silBtn = document.createElement("button");
        silBtn.className = "sil-btn";
        silBtn.title = "Görevi Sil";
        silBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;

        // Tek Görev Silme (DELETE /api/gorevler/:id)
        silBtn.addEventListener("click", async function(olay) {
            olay.stopPropagation();
            gorevler = gorevler.filter(g => g.id !== gorev.id);
            ekraniCiz();

            try {
                await fetch(`${API_URL}/${gorev.id}`, {
                    method: "DELETE"
                });
            } catch (hata) {
                console.error("Görev silinemedi:", hata);
            }
        });

        yeniGorev.appendChild(surukleSpan);
        yeniGorev.appendChild(ikonSpan);
        yeniGorev.appendChild(icerikDiv);
        yeniGorev.appendChild(rozetSpan);
        yeniGorev.appendChild(duzenleBtn);
        yeniGorev.appendChild(silBtn);
        gorevListesi.appendChild(yeniGorev);
    });

    const toplamGorev = gorevler.length;
    const bitenGorev = gorevler.filter(g => g.tamamlandi).length;
    const yuzde = toplamGorev === 0 ? 0 : Math.round((bitenGorev / toplamGorev) * 100);

    ilerlemeMetni.textContent = (toplamGorev > 0 && bitenGorev === toplamGorev)
        ? "🎉 Tüm görevler tamamlandı!"
        : `${bitenGorev} / ${toplamGorev} görev tamamlandı`;

    ilerlemeYuzde.textContent = `%${yuzde}`;
    ilerlemeCubugu.style.width = `${yuzde}%`;

    const kalanGorevSayisi = toplamGorev - bitenGorev;
    if (kalanSayac) kalanSayac.textContent = `${kalanGorevSayisi} aktif görev`;
    if (tumunuTemizleBtn) tumunuTemizleBtn.style.display = toplamGorev === 0 ? "none" : "inline-block";
}

filtreButonlari.forEach(buton => {
    buton.addEventListener("click", function() {
        filtreButonlari.forEach(b => b.classList.remove("aktif"));
        buton.classList.add("aktif");
        aktifFiltre = buton.dataset.filtre;
        ekraniCiz();
    });
});

if (aramaInput) {
    aramaInput.addEventListener("input", function() {
        aramaMetni = aramaInput.value.trim().toLowerCase();
        ekraniCiz();
    });
}

// Yeni Görev Ekleme (POST /api/gorevler)
async function gorevEkle() {
    const metin = gorevInput.value.trim();

    if (metin === "") {
        alert("Lütfen bir görev yaz!");
        return;
    }

    const gonderilecekVeri = {
        metin: metin,
        oncelik: oncelikSecici.value,
        sonTarih: tarihSecici.value || null
    };

    try {
        const yanit = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gonderilecekVeri)
        });

        const eklenenGorev = await yanit.json();
        gorevler.push(eklenenGorev);

        gorevInput.value = "";
        oncelikSecici.value = "normal";
        varsayilanTarihiAyarla();
        ekraniCiz();
    } catch (hata) {
        alert("Sunucuya bağlanılamadı! Terminalin açık olduğundan emin ol.");
    }
}

ekleBtn.addEventListener("click", gorevEkle);

gorevInput.addEventListener("keypress", function(olay) {
    if (olay.key === "Enter") {
        gorevEkle();
    }
});

// Tümünü Temizle (DELETE /api/gorevler)
if (tumunuTemizleBtn) {
    tumunuTemizleBtn.addEventListener("click", async function() {
        if (confirm("Listedeki tüm görevleri sunucudan silmek istediğine emin misin?")) {
            gorevler = [];
            ekraniCiz();

            try {
                await fetch(API_URL, { method: "DELETE" });
            } catch (hata) {
                console.error("Liste temizlenemedi:", hata);
            }
        }
    });
}

// PDF Olarak Rapor İndirme
if (pdfIndirBtn) {
    pdfIndirBtn.addEventListener("click", function() {
        if (gorevler.length === 0) {
            alert("PDF oluşturmak için listede en az bir görev olmalı!");
            return;
        }

        const oncelikIsimleri = { acil: "Acil", normal: "Normal", dusuk: "Düşük" };
        const bitenSayisi = gorevler.filter(g => g.tamamlandi).length;
        const bugun = new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const raporDiv = document.createElement("div");
        raporDiv.style.padding = "24px";
        raporDiv.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        raporDiv.style.color = "#1f2937";
        raporDiv.style.backgroundColor = "#ffffff";

        const satirlarHTML = gorevler.map(g => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold; color: ${g.tamamlandi ? '#16a34a' : '#d97706'};">
                    ${g.tamamlandi ? "✓ Tamamlandı" : "○ Bekliyor"}
                </td>
                <td style="padding: 10px; ${g.tamamlandi ? 'text-decoration: line-through; color: #6b7280;' : ''}">
                    ${g.metin}
                </td>
                <td style="padding: 10px;">
                    ${oncelikIsimleri[g.oncelik || "normal"]}
                </td>
                <td style="padding: 10px; font-size: 12px; color: #4b5563;">
                    ${g.sonTarih ? tarihiFormatla(g.sonTarih) : "-"}
                </td>
            </tr>
        `).join("");

        raporDiv.innerHTML = `
            <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; color: #111827; font-size: 20px;">Yapılacaklar Listesi Raporu</h2>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Oluşturulma Tarihi: ${bugun}</p>
                </div>
                <div style="text-align: right; font-size: 13px; font-weight: bold; color: #16a34a;">
                    Tamamlanan: ${bitenSayisi} / ${gorevler.length}
                </div>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                    <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                        <th style="padding: 10px;">Durum</th>
                        <th style="padding: 10px;">Görev</th>
                        <th style="padding: 10px;">Öncelik</th>
                        <th style="padding: 10px;">Son Tarih</th>
                    </tr>
                </thead>
                <tbody>
                    ${satirlarHTML}
                </tbody>
            </table>
        `;

        const pdfAyarlari = {
            margin: 10,
            filename: "gorev-listem.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };

        html2pdf().set(pdfAyarlari).from(raporDiv).save();
    });
}

setInterval(ekraniCiz, 30000);

// Sayfa açıldığında görevleri sunucudan yükle
gorevleriGetir();
varsayilanTarihiAyarla();

// TEMA VE HAREKETLİ DUVAR KAĞIDI YÖNETİMİ
const temaButonlari = document.querySelectorAll(".tema-btn");

function temayiUygula(temaAdi) {
    document.body.classList.remove("tema-aurora", "tema-gunbatimi", "tema-izgara");

    if (temaAdi !== "koyu") {
        document.body.classList.add(`tema-${temaAdi}`);
    }

    temaButonlari.forEach(btn => {
        btn.classList.toggle("aktif", btn.dataset.tema === temaAdi);
    });

    localStorage.setItem("seciliTema", temaAdi);
}

temaButonlari.forEach(btn => {
    btn.addEventListener("click", () => {
        temayiUygula(btn.dataset.tema);
    });
});

const kayitliTema = localStorage.getItem("seciliTema") || "koyu";
temayiUygula(kayitliTema);