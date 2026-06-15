# Markala — Manuel Ubuntu Kurulum (Plan B)

**Kullanım**: Eğer autoinstall fail olursa bu adımlarla manuel kur. Toplam süre: ~3-5 dakika.

## 1. ESXi Web Console aç

[https://185.121.126.18/ui](https://185.121.126.18/ui) → Virtual Machines → **markala-prod** → **Console** (Open browser console)

Eğer VM hala live installer'da takılıysa: zaten ekrandasın. Eğer fresh boot lazımsa: Actions → Reset.

## 2. Ubuntu installer adımları (sırayla)

| # | Ekran | Cevap |
|---|-------|-------|
| 1 | GRUB boot menu | **Try or Install Ubuntu Server** (default, ENTER) |
| 2 | Language | **English** |
| 3 | Installer update | **Continue without updating** |
| 4 | Keyboard | Layout: **Turkish**, Variant: **Turkish (F)** |
| 5 | Type of install | **Ubuntu Server** (Minimized değil) |
| 6 | Network connections | **Edit ens160** (aşağıda detay) |
| 7 | Proxy | (boş bırak) — **Done** |
| 8 | Mirror | default — **Done** |
| 9 | Storage | **Use an entire disk** (LVM tikini bırak) — **Done** |
| 10 | Storage confirm | **Continue** |
| 11 | Profile setup | aşağıda detay |
| 12 | SSH setup | aşağıda detay |
| 13 | Featured server snaps | **hiçbiri seçme** — Done |
| 14 | Install kuruluyor | bekle (~5 dk) |
| 15 | Update kuruluyor | bekle (~3 dk) |
| 16 | "Install complete" | **Reboot Now** |

### 6. Network — ens160 manual

- **IPv4 Method**: Manual
- **Subnet**: `185.121.126.16/29`
- **Address**: `185.121.126.20`
- **Gateway**: `185.121.126.17`
- **Name servers**: `1.1.1.1,8.8.8.8`
- **Search domains**: (boş)
- **Save** → **Done**

### 11. Profile

| Alan | Değer |
|------|-------|
| Your name | `Hasan Söylemez` |
| Your server's name | `markala-prod` |
| Pick a username | `markala` |
| Choose a password | (güçlü parola, sonra SSH-only) |

### 12. SSH

- **Install OpenSSH server**: ✓
- **Import SSH identity**: **No**
- **Allow password authentication over SSH**: ✓ (geçici, sonra Claude kapatacak)

## 3. Reboot sonrası — Claude'a haber ver

Reboot olunca VM kalıcı sisteme açılır. Login: konsol/SSH `markala@185.121.126.20`.

**Bana de "kuruldu, devam et"** — kalan adımları SSH ile çalıştırırım:
- SSH key import + setup-server.sh
- Cloudflare DNS A records
- Repo clone + .env.production
- Docker stack deploy
