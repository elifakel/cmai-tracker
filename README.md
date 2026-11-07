# CMAI Tracker (PWA)

Demans/Alzheimer bakımında ajitasyon davranışlarını **CMAI** (Cohen-Mansfield Agitation Inventory) ölçeğine göre kaydetmek için yapılmış bir Progressive Web App. Android, iPhone, tablet ve bilgisayarda çalışır. Kurulabilir, internet olmadan çalışır ve **veriler sadece cihazda kalır**, hiçbir sunucuya gönderilmez.

## Özellikler
- Bakıcı hesapları ve PIN girişi (PIN düz metin tutulmaz, PBKDF2-SHA256 + salt ile saklanır)
- Hasta listesi: her hastanın kendi 14 günlük periyotları, mini grafik, CMAI toplamı
- **Record:** 29 CMAI davranışı, 4 grup, arama, "en çok kaydedilenler", kayıttan sonra *Undo* ve *Time* (saati değiştirme)
- **Score:** toplam skor (29–203), grup skorları, her madde için 1–7 puan. Puan olaylardan otomatik hesaplanır, istenirse elle değiştirilebilir.
- **Report:** 14 günlük ve saatlik grafikler, en yoğun gün/saat, davranış dağılımı
- **History:** gün filtresi, saat düzeltme, silme (geri alınabilir)
- **Settings:** isim ve PIN değiştirme, yazı boyutu (3 seviye), açık/koyu tema
- **Veri dışa aktarma:** olaylar CSV, skorlar CSV, tam yedek JSON ve yedekten geri yükleme

## Dosya yapısı
```
index.html            uygulama kabuğu
manifest.webmanifest  kurulum bilgileri (isim, ikon, renk)
sw.js                 service worker (offline çalışma)
css/styles.css        tasarım
js/app.js             ekranlar ve etkileşimler
js/db.js              IndexedDB, PIN hash'leme, periyot hesapları, yedekleme
js/cmai.js            29 madde, gruplar, puanlama kuralı
icons/                uygulama ikonları
```
Build aşaması yok: framework veya `npm install` gerekmez. Düz HTML/CSS/JS (ES modules).

## Bilgisayarda çalıştırma
Service worker `file://` üzerinden çalışmadığı için küçük bir sunucu açman gerekir:
```bash
cd cmai-pwa
python -m http.server 8000
```
Sonra tarayıcıda `http://localhost:8000` adresini aç. Telefon görünümü için Chrome DevTools → Device toolbar.

## GitHub Pages'te yayınlama (ücretsiz)
1. GitHub'da yeni bir repo aç (ör. `cmai-tracker`) ve bu klasörün içeriğini yükle.
2. Repo → **Settings → Pages** → *Source: Deploy from a branch* → `main` / `(root)` → Save.
3. Bir iki dakika sonra uygulama `https://elifakel.github.io/cmai-tracker/` adresinde yayında olur.
4. Telefonda bu linki aç:
   - **Android (Chrome):** menü → *Uygulamayı yükle / Ana ekrana ekle*
   - **iPhone (Safari):** Paylaş → *Ana Ekrana Ekle*

> Bütün yollar göreli (`./`) yazıldığı için alt klasörde yayınlansa da sorunsuz çalışır.

## Güncelleme yayınlarken
Bir dosyayı değiştirdiğinde `sw.js` içindeki `VERSION` değerini de artır (ör. `cmai-v1.0.1`). Böylece telefonlar yeni sürümü indirir ve uygulamada "A new version is ready · Reload" bildirimi çıkar.

## Veri güvenliği: önemli
- Veriler tarayıcının IndexedDB deposunda tutulur. Tarayıcı verileri temizlenirse kayıtlar silinir.
- Uygulamayı **ana ekrana ekle** ve Settings'teki **Protect my data** butonuna bas (kalıcı depolama izni).
- **Düzenli olarak "Download full backup" ile yedek al.** Yedek başka bir cihaza "Restore from backup" ile yüklenebilir.
- Hasta için gerçek isim değil çalışma kodu (P001 gibi) kullan.
- Verinin nerede ve nasıl tutulduğunu IRB protokolünüzle karşılaştır.

## Puanlama kuralı
`js/cmai.js` içindeki `ratingFromCount` fonksiyonu, 14 günlük periyottaki olay sayısını 1–7 puana çevirir:

| Olay sayısı (14 gün) | Puan |
|---|---|
| 0 | 1 – Never |
| 1 | 2 – Less than once a week |
| 2–4 | 3 – Once or twice a week |
| 5–13 | 4 – Several times a week |
| 14–28 | 5 – Once or twice a day |
| 29–223 | 6 – Several times a day |
| 224+ | 7 – Several times an hour |

Android uygulaması farklı bir kural kullanıyorsa sadece bu fonksiyonu değiştirmen yeterli. Madde–grup eşleşmesi de aynı dosyada (`ITEMS`).
