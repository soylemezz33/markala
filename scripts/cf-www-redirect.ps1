# cf-www-redirect.ps1 — www.markala.com.tr -> markala.com.tr 301 (Cloudflare Single Redirect)
#
# Kullanım:
#   $env:CLOUDFLARE_API_TOKEN = "<token>"          # Zone > Dynamic URL Redirects: Edit + Zone: Read (yalnız markala.com.tr)
#   pwsh scripts/cf-www-redirect.ps1               # kuralı oluşturur (varsa dokunmaz) + canlı doğrular
#   pwsh scripts/cf-www-redirect.ps1 -VerifyOnly   # yalnız canlı doğrulama (token gerekmez)
#
# Token oluşturma (60 sn): dash.cloudflare.com -> My Profile -> API Tokens -> Create Token ->
#   Custom: Zone.Zone:Read + Zone.Dynamic URL Redirects:Edit, Zone Resources = markala.com.tr
#
# Not: Origin nginx'te aynı 301 zaten var; bu kural yönlendirmeyi CF edge'e taşır
# (origin çökse bile çalışır, http+https tek hop'a iner, origin'e www isteği gitmez).

param([switch]$VerifyOnly)

$ErrorActionPreference = 'Stop'
$ZoneId   = 'fe161f965fbeb9edeb6160a3a71eeaaa'   # markala.com.tr
$Apex     = 'markala.com.tr'
$WwwHost  = "www.$Apex"
$RuleDesc = 'www -> apex 301 (cf-www-redirect.ps1)'
$Api      = "https://api.cloudflare.com/client/v4/zones/$ZoneId/rulesets"
$Phase    = 'http_request_dynamic_redirect'

function Test-Redirect {
    Write-Host "`n== Canlı doğrulama ==" -ForegroundColor Cyan
    $cases = @(
        @{ url = "https://$WwwHost/urunler/kartvizit?a=1&b=2"; expect = "https://$Apex/urunler/kartvizit?a=1&b=2" },
        @{ url = "http://$WwwHost/sepet";                      expect = "https://$Apex/sepet" },
        @{ url = "https://$WwwHost/";                          expect = "https://$Apex/" }
    )
    $fail = 0
    foreach ($c in $cases) {
        # Yönlendirme zincirini elle izle (maks 3 hop)
        $cur = $c.url; $hops = @()
        for ($i = 0; $i -lt 3; $i++) {
            # -MaximumRedirection 0: 3xx'te non-terminating hata yazar ama yanıtı yine döndürür (PS7);
            # EAP=Stop bunu terminating yapmasın diye per-call SilentlyContinue.
            $r = Invoke-WebRequest -Uri $cur -Method Head -MaximumRedirection 0 -SkipHttpErrorCheck -TimeoutSec 15 -ErrorAction SilentlyContinue
            if (-not $r) { break }
            if ($r.StatusCode -in 301, 302, 307, 308) { $cur = [string]$r.Headers.Location; $hops += "$($r.StatusCode)->$cur" }
            else { break }
        }
        $ok = ($cur -eq $c.expect)
        if (-not $ok) { $fail++ }
        $mark = $ok ? '✓' : '✗'
        Write-Host ("{0} {1}`n    zincir: {2}`n    varış : {3} (beklenen {4}, {5} hop)" -f $mark, $c.url, ($hops -join ' | '), $cur, $c.expect, $hops.Count)
    }
    if ($fail -gt 0) { Write-Host "`n$fail senaryo BAŞARISIZ" -ForegroundColor Red; exit 1 }
    Write-Host "`nTüm senaryolar geçti." -ForegroundColor Green
}

if ($VerifyOnly) { Test-Redirect; exit 0 }

if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "CLOUDFLARE_API_TOKEN tanımlı değil. Başa dönüp token oluştur (dosya başındaki 60 sn adımı)." -ForegroundColor Red
    exit 1
}
$H = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN"; 'Content-Type' = 'application/json' }

$rule = @{
    action      = 'redirect'
    description = $RuleDesc
    expression  = "(http.host eq `"$WwwHost`")"
    action_parameters = @{
        from_value = @{
            status_code           = 301
            preserve_query_string = $true
            target_url            = @{ expression = "concat(`"https://$Apex`", http.request.uri.path)" }
        }
    }
}

# Entrypoint ruleset var mı?
$entry = $null
try { $entry = (Invoke-RestMethod -Uri "$Api/phases/$Phase/entrypoint" -Headers $H -Method Get).result }
catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
}

if ($entry -and ($entry.rules | Where-Object { $_.description -eq $RuleDesc -or $_.expression -like "*$WwwHost*" })) {
    Write-Host "Kural zaten mevcut (ruleset $($entry.id)) — dokunulmadı." -ForegroundColor Yellow
}
elseif ($entry) {
    $null = Invoke-RestMethod -Uri "$Api/$($entry.id)/rules" -Headers $H -Method Post -Body ($rule | ConvertTo-Json -Depth 8)
    Write-Host "Kural mevcut ruleset'e eklendi." -ForegroundColor Green
}
else {
    $body = @{ name = 'Single Redirects'; kind = 'zone'; phase = $Phase; rules = @($rule) } | ConvertTo-Json -Depth 8
    $null = Invoke-RestMethod -Uri $Api -Headers $H -Method Post -Body $body
    Write-Host "Entrypoint ruleset oluşturuldu, kural eklendi." -ForegroundColor Green
}

Start-Sleep -Seconds 5   # edge yayılımı
Test-Redirect
