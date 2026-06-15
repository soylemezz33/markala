# markala-cidata-build.ps1
# Ubuntu 24.04 autoinstall icin cloud-init seed ISO uretir,
# ESXi datastore'a yukler ve markala-prod VM'ine ikinci CDROM olarak baglar.
#
# Sonuc: VM'i acinca Ubuntu kendi kendine kurulur, SSH key + user hazir gelir.
#
# Kullanim:
#   1) Asagidaki AYARLAR bolumunde STATIK_IP / GATEWAY / DNS / SSH_PUB_KEY doldur
#   2) $env:GOVC_PASSWORD = "..."
#   3) .\markala-cidata-build.ps1
#
# Gereksinim: mkisofs/genisoimage VEYA xorriso. Yoksa script PowerShell'in
# kendi ISO uretim metodunu (Windows uzerinde oscdimg) dener.

$ErrorActionPreference = "Stop"

# ---------- AYARLAR ----------
$VM_NAME       = "markala-prod"
$DATASTORE     = "datastore1"
$CIDATA_REMOTE = "ISO/markala-cidata.iso"   # datastore icindeki hedef

$HOSTNAME      = "markala-prod"
$USERNAME      = "markala"
# Asagidaki sifre cloud-init icin gecici; ilk login sonrasi degis veya SSH-only birak.
$PASSWORD_HASH = '$6$rounds=4096$salt$3xampleHashReplaceThisOrLeaveSSHOnly0000000000000000000000000000000000000000000000000000000'

# Statik IP konfigu — Hasan dolduracak
$INTERFACE     = "ens160"                   # ESXi vmxnet3 genelde ens160 / ens192
$STATIC_IP     = "185.121.126.XX/24"        # !!! BOSTAKI IP'yi yaz
$GATEWAY       = "185.121.126.1"            # !!! Turhost'tan teyit
$DNS_PRIMARY   = "1.1.1.1"
$DNS_SECONDARY = "8.8.8.8"

# SSH public key — kendi ~/.ssh/id_ed25519.pub icerigini yapistir
$SSH_PUB_KEY   = "ssh-ed25519 AAAA...REPLACE_ME hasan@markala"

# ---------- GOVC ----------
$GOVC_EXE = "$env:USERPROFILE\bin\govc.exe"
if (-not (Test-Path $GOVC_EXE)) { throw "govc bulunamadi. Once markala-vm-create.ps1 calistir." }
$env:Path = "$env:USERPROFILE\bin;$env:Path"
$env:GOVC_URL      = "root@185.121.126.18"
$env:GOVC_INSECURE = "true"
if (-not $env:GOVC_USERNAME) { $env:GOVC_USERNAME = "root" }
if (-not $env:GOVC_PASSWORD) {
  $secure = Read-Host "ESXi root sifresi" -AsSecureString
  $env:GOVC_PASSWORD = [System.Net.NetworkCredential]::new("", $secure).Password
}

# ---------- DOGRULAMA ----------
if ($STATIC_IP -match "XX") { throw "STATIC_IP doldurulmadi. Bostaki public IP'yi yaz." }
if ($SSH_PUB_KEY -match "REPLACE_ME") { throw "SSH_PUB_KEY doldurulmadi. ~/.ssh/id_ed25519.pub icerigini yapistir." }

# ---------- WORK DIR ----------
$work = "$env:TEMP\markala-cidata"
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $work | Out-Null

# ---------- user-data ----------
$userData = @"
#cloud-config
autoinstall:
  version: 1
  locale: tr_TR.UTF-8
  keyboard:
    layout: tr
  identity:
    hostname: $HOSTNAME
    username: $USERNAME
    password: '$PASSWORD_HASH'
  ssh:
    install-server: true
    allow-pw: false
    authorized-keys:
      - $SSH_PUB_KEY
  network:
    version: 2
    ethernets:
      $INTERFACE`:
        dhcp4: false
        addresses: [$STATIC_IP]
        routes:
          - to: default
            via: $GATEWAY
        nameservers:
          addresses: [$DNS_PRIMARY, $DNS_SECONDARY]
  storage:
    layout:
      name: direct
  packages:
    - openssh-server
    - curl
    - ca-certificates
    - ufw
    - fail2ban
  late-commands:
    - curtin in-target --target=/target -- systemctl enable ssh
    - echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /target/etc/sudoers.d/90-markala
  user-data:
    disable_root: true
    timezone: Europe/Istanbul
"@

$metaData = @"
instance-id: markala-prod-001
local-hostname: $HOSTNAME
"@

Set-Content -Path "$work\user-data" -Value $userData -NoNewline -Encoding utf8
Set-Content -Path "$work\meta-data" -Value $metaData -NoNewline -Encoding utf8

# ---------- ISO URET ----------
$isoLocal = "$env:TEMP\markala-cidata.iso"
Remove-Item $isoLocal -ErrorAction SilentlyContinue

$oscdimg = "C:\Program Files (x86)\Windows Kits\10\Assessment and Deployment Kit\Deployment Tools\amd64\Oscdimg\oscdimg.exe"
$mkisofs = Get-Command mkisofs -ErrorAction SilentlyContinue
$xorriso = Get-Command xorriso -ErrorAction SilentlyContinue

if (Test-Path $oscdimg) {
  Write-Host ">> oscdimg ile ISO uretiliyor..." -ForegroundColor Cyan
  & $oscdimg -j2 -lCIDATA $work $isoLocal
} elseif ($mkisofs) {
  Write-Host ">> mkisofs ile ISO uretiliyor..." -ForegroundColor Cyan
  & mkisofs -output $isoLocal -volid CIDATA -joliet -rock $work
} elseif ($xorriso) {
  Write-Host ">> xorriso ile ISO uretiliyor..." -ForegroundColor Cyan
  & xorriso -as mkisofs -output $isoLocal -volid CIDATA -joliet -rock $work
} else {
  throw "ISO uretmek icin oscdimg/mkisofs/xorriso bulunamadi. Windows ADK kur veya WSL'de mkisofs calistir."
}

Write-Host ">> ISO hazir: $isoLocal" -ForegroundColor Green

# ---------- DATASTORE'A UPLOAD ----------
Write-Host ">> Datastore'a yukleniyor..." -ForegroundColor Cyan
& $GOVC_EXE datastore.upload -ds=$DATASTORE $isoLocal $CIDATA_REMOTE
if ($LASTEXITCODE -ne 0) { throw "ISO upload basarisiz." }

# ---------- VM'E IKINCI CDROM EKLE ----------
Write-Host ">> VM kapatiliyor (gerekirse)..." -ForegroundColor Cyan
& $GOVC_EXE vm.power -off -force $VM_NAME 2>$null

Write-Host ">> CIDATA CDROM ekleniyor..." -ForegroundColor Cyan
$cdromOutput = & $GOVC_EXE device.cdrom.add -vm $VM_NAME 2>&1
$cdromDevice = ($cdromOutput | Select-Object -Last 1).Trim()
& $GOVC_EXE device.cdrom.insert -vm $VM_NAME -device $cdromDevice -ds=$DATASTORE $CIDATA_REMOTE

# ---------- BOOT ----------
Write-Host ">> VM aciliyor — autoinstall basliyor..." -ForegroundColor Cyan
& $GOVC_EXE vm.power -on $VM_NAME

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " AUTOINSTALL BASLATILDI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host " Kurulum ~10-15 dk surer. Tamamlaninca:"
Write-Host "   ssh $USERNAME@$($STATIC_IP -replace '/.*','')"
Write-Host ""
Write-Host " Console takip etmek istersen ESXi Web UI > $VM_NAME > Console"
