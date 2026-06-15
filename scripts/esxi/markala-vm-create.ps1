# markala-vm-create.ps1
# ESXi üzerinde markala-prod VM'ini govc ile oluşturur.
#
# Kullanım (PowerShell 7+):
#   1) $env:GOVC_PASSWORD = "your-esxi-root-password"     # tek seferlik, terminale yapıştır
#   2) cd C:\Users\Hasan\Projects\baskisitesi\scripts\esxi
#   3) .\markala-vm-create.ps1
#
# İdempotent: aynı script ikinci kez çalışınca VM zaten varsa atlar.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ---------- AYARLAR ----------
$GOVC_URL      = "root@185.121.126.18"
$GOVC_INSECURE = "true"
$DATASTORE     = "datastore1"
$ISO_PATH      = "ISO/ubuntu-24.04.3-live-server-amd64.iso"   # datastore içindeki yol (varsa düzelt)
$NETWORK       = "VM Network"                                  # ESXi'de port grubu adı

$VM_NAME       = "markala-prod"
$VM_CPU        = 4
$VM_MEM_MB     = 8192
$VM_DISK_GB    = 80
$VM_GUEST_ID   = "ubuntu64Guest"

# govc binary yolu
$GOVC_DIR      = "$env:USERPROFILE\bin"
$GOVC_EXE      = "$GOVC_DIR\govc.exe"
$GOVC_VERSION  = "0.45.0"
$GOVC_ZIP_URL  = "https://github.com/vmware/govmomi/releases/download/v$GOVC_VERSION/govc_Windows_x86_64.zip"

# ---------- GOVC KURULUMU ----------
if (-not (Test-Path $GOVC_EXE)) {
  Write-Host ">> govc bulunamadi, indiriliyor: $GOVC_ZIP_URL" -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $GOVC_DIR | Out-Null
  $tmpZip = "$env:TEMP\govc.zip"
  Invoke-WebRequest -Uri $GOVC_ZIP_URL -OutFile $tmpZip
  Expand-Archive -Path $tmpZip -DestinationPath $GOVC_DIR -Force
  Remove-Item $tmpZip
  Write-Host ">> govc kuruldu: $GOVC_EXE" -ForegroundColor Green
}
$env:Path = "$GOVC_DIR;$env:Path"

# ---------- ENV ----------
$env:GOVC_URL        = $GOVC_URL
$env:GOVC_INSECURE   = $GOVC_INSECURE
if (-not $env:GOVC_USERNAME) { $env:GOVC_USERNAME = "root" }
if (-not $env:GOVC_PASSWORD) {
  $secure = Read-Host "ESXi root sifresi" -AsSecureString
  $env:GOVC_PASSWORD = [System.Net.NetworkCredential]::new("", $secure).Password
}

# ---------- BAGLANTI TESTI ----------
Write-Host ">> ESXi'ye baglaniliyor: $GOVC_URL" -ForegroundColor Cyan
& $GOVC_EXE about | Out-Null
if ($LASTEXITCODE -ne 0) { throw "ESXi baglantisi BASARISIZ. URL/credential kontrol et." }
Write-Host ">> Baglanti OK" -ForegroundColor Green

# ---------- KAYNAK KESFI ----------
Write-Host ">> Datastore'lar:" -ForegroundColor Cyan
& $GOVC_EXE datastore.info -ds=$DATASTORE
Write-Host ">> Networkler:" -ForegroundColor Cyan
& $GOVC_EXE host.portgroup.info

# ---------- VM ZATEN VAR MI ----------
$existing = & $GOVC_EXE vm.info -vm $VM_NAME 2>$null
if ($LASTEXITCODE -eq 0 -and $existing) {
  Write-Host ">> $VM_NAME zaten var. Atlaniyor." -ForegroundColor Yellow
  & $GOVC_EXE vm.info -vm $VM_NAME
  exit 0
}

# ---------- VM OLUSTUR ----------
Write-Host ">> $VM_NAME olusturuluyor..." -ForegroundColor Cyan
& $GOVC_EXE vm.create `
  -name=$VM_NAME `
  -c=$VM_CPU `
  -m=$VM_MEM_MB `
  -g=$VM_GUEST_ID `
  -ds=$DATASTORE `
  -net="$NETWORK" `
  -net.adapter=vmxnet3 `
  -disk=$($VM_DISK_GB)GB `
  -disk.controller=pvscsi `
  -on=false `
  -firmware=efi `
  -version=vmx-19
if ($LASTEXITCODE -ne 0) { throw "VM olusturulamadi." }

# ---------- ISO MOUNT ----------
Write-Host ">> Ubuntu ISO baglaniyor: [$DATASTORE] $ISO_PATH" -ForegroundColor Cyan
# Eklenen CDROM bilgisini al
$cdromOutput = & $GOVC_EXE device.cdrom.add -vm $VM_NAME 2>&1
$cdromDevice = ($cdromOutput | Select-Object -Last 1).Trim()
& $GOVC_EXE device.cdrom.insert -vm $VM_NAME -device $cdromDevice -ds=$DATASTORE $ISO_PATH
if ($LASTEXITCODE -ne 0) { throw "ISO mount edilemedi. ISO_PATH dogru mu? '$ISO_PATH'" }

# ---------- BOOT ORDER: CDROM ONCE ----------
& $GOVC_EXE device.boot -vm $VM_NAME -order=cdrom,disk

# ---------- POWER ON ----------
Write-Host ">> VM aciliyor..." -ForegroundColor Cyan
& $GOVC_EXE vm.power -on $VM_NAME

# ---------- OZET ----------
Write-Host "`n========================================" -ForegroundColor Green
Write-Host " markala-prod HAZIR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
& $GOVC_EXE vm.info -vm $VM_NAME

Write-Host "`n>> SONRAKI ADIM:" -ForegroundColor Yellow
Write-Host "   ESXi Web UI > markala-prod > Console ile baglan, Ubuntu kurulumunu yap."
Write-Host "   VEYA zero-touch autoinstall icin: .\markala-cidata-build.ps1 calistir."
