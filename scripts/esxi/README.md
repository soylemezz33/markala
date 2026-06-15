# ESXi VM Provisioning — markala-prod

govc CLI ile ESXi (185.121.126.18) üzerinde `markala-prod` VM'ini provision eder.

## Akış

```
1) markala-vm-create.ps1   → VM oluştur + Ubuntu ISO mount + power-on
2) (Opsiyonel) markala-cidata-build.ps1 → Cloud-init seed ISO ekle, autoinstall et
3) İlk SSH bağlantısı       → setup-server.sh çalıştır
```

## 1) Hızlı yol — manuel install

```powershell
# PowerShell 7 (pwsh) açık olmalı
$env:GOVC_PASSWORD = "esxi-root-sifresi"
cd C:\Users\Hasan\Projects\baskisitesi\scripts\esxi
.\markala-vm-create.ps1
```

- govc otomatik kurulur: `$env:USERPROFILE\bin\govc.exe`
- VM specs: 4 vCPU / 8 GB RAM / 80 GB thin / vmxnet3 / EFI
- ISO yolu **`[datastore1] ISO/ubuntu-24.04.3-live-server-amd64.iso`** olarak varsayılıyor. Datastore'da farklı klasördeyse `markala-vm-create.ps1` içindeki `$ISO_PATH` satırını düzelt.
- Script bitince ESXi Web UI'da VM'e Console ile bağlan, Ubuntu kurulumunu adım adım yap.

## 2) Önerilen yol — zero-touch autoinstall

`markala-cidata-build.ps1` cloud-init seed ISO üretir → Ubuntu kendi kendine kurulur (statik IP + SSH key + user hazır).

### Önce doldur
`markala-cidata-build.ps1` AYARLAR bölümünde:
- `$STATIC_IP` — Turhost'tan boşta olan public IP (örn `185.121.126.42/24`)
- `$GATEWAY` — Turhost'tan teyit (genelde `.1` veya `.254`)
- `$SSH_PUB_KEY` — kendi `~/.ssh/id_ed25519.pub` içeriği
- `$PASSWORD_HASH` — `mkpasswd -m sha-512` ile üret (veya SSH-only bırak)

### SSH key yoksa üret

```powershell
ssh-keygen -t ed25519 -C "hasan@markala" -f "$env:USERPROFILE\.ssh\id_ed25519"
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

### ISO üretici gereksinim
Script şu sırayla dener:
1. **oscdimg** — Windows ADK ile gelir (önerilen)
2. **mkisofs / xorriso** — Git Bash veya WSL üzerinden

ADK indirme: https://learn.microsoft.com/windows-hardware/get-started/adk-install

### Çalıştır

```powershell
.\markala-vm-create.ps1            # önce VM oluştur (ISO mount olmasın diye -on=false yapabilirsin)
.\markala-cidata-build.ps1         # cidata.iso üret + mount + power-on
```

10-15 dk sonra:
```powershell
ssh markala@185.121.126.XX
```

## 3) Sunucu bootstrap

VM hazır olunca:
```bash
curl -fsSL https://raw.githubusercontent.com/soylemezz33/markala/main/scripts/setup-server.sh | sudo bash
```

## Sorun giderme

| Hata | Sebep | Çözüm |
|------|-------|-------|
| `ESXi baglantisi BASARISIZ` | URL/password yanlış | `$env:GOVC_PASSWORD` yeniden set et |
| `ISO mount edilemedi` | `$ISO_PATH` yanlış | `govc datastore.ls -ds=datastore1 ISO/` ile gerçek yolu gör |
| `Network not found` | Port grubu adı farklı | `govc host.portgroup.info` çıktısından doğru adı al, `$NETWORK` güncelle |
| `oscdimg/mkisofs yok` | ISO üretici eksik | Windows ADK kur veya `wsl -- mkisofs ...` ile manuel üret |

## govc cheat-sheet

```powershell
# Tüm VM'leri listele
govc ls /ha-datacenter/vm

# VM bilgisi
govc vm.info -vm markala-prod

# Snapshot al
govc snapshot.create -vm markala-prod -m "before-deploy" pre-deploy

# Snapshot'a dön
govc snapshot.revert -vm markala-prod pre-deploy

# VM'i kapat
govc vm.power -off markala-prod

# VM'i sil (DİKKAT)
govc vm.destroy markala-prod
```
