# Staging Ortamı — test.markala.com.tr

Prod ile **aynı VPS** üzerinde, tamamen **ayrı container + ayrı veritabanı** ile çalışan
test ortamı. `staging` branch'ine push → otomatik staging deploy. Onaylanan değişiklik
`main`'e merge edilince prod'a gider (mevcut prod akışı değişmedi).

```
┌─ VPS ────────────────────────────────────────────────────┐
│  markala-nginx (prod, 80/443)                            │
│    ├─ markala.com.tr        → markala-web:3000    (prod) │
│    ├─ api.markala.com.tr    → markala-api:4000    (prod) │
│    ├─ test.markala.com.tr   → staging-web:3000  (staging)│
│    └─ test-api.markala.com.tr → staging-api:4000(staging)│
│                                                          │
│  markala-staging-postgres  ← ayrı DB (markala_staging)   │
└──────────────────────────────────────────────────────────┘
```

## Güvenlik notları

- Staging vhost'ları `X-Robots-Tag: noindex` döner — Google'a görünmez.
- `nginx/conf.d/staging.conf` **resolver + değişkenli proxy_pass** kullanır:
  staging container'ları kapalıyken bile prod nginx reload/restart **bozulmaz**.
- Staging API'de gerçek entegrasyon anahtarı YOK (iyzico sandbox, SMS/e-posta boş).
- İsteğe bağlı basic auth: `nginx/conf.d/staging.conf` içindeki yorumlu satırlar.

## İlk kurulum (bir kere)

### 1. Cloudflare DNS

İki **A kaydı** ekle (ikisi de Proxied 🟠, prod ile aynı VPS IP'si):

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `test` | `<VPS_IP>` | Proxied |
| A | `test-api` | `<VPS_IP>` | Proxied |

> Alan adları bilerek tek seviyeli (`test.`, `test-api.`) — `*.markala.com.tr`
> origin sertifikası ve Cloudflare universal cert yalnız tek seviyeyi kapsar.

### 2. VPS'te .env.staging

```bash
ssh markala@<VPS_IP>
cd /opt/markala
# Repo'daki örneği temel al (deploy workflow'u compose'u scp'ler ama env'i ASLA):
nano .env.staging     # .env.staging.example içeriğini doldur
```

Zorunlu alanlar: `STAGING_POSTGRES_PASSWORD`, `STAGING_JWT_SECRET`.

### 3. Prod network adını doğrula

```bash
docker network ls | grep markala
# Beklenen: markala_markala
```

Farklıysa `docker-compose.staging.yml` sonundaki `name: markala_markala` satırını düzelt.

### 4. GitHub environment (opsiyonel ama önerilir)

Repo → Settings → Environments → `staging` oluştur (secrets prod'la ortak:
`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` zaten repo secret'ı).

### 5. İlk deploy

```bash
git checkout -b staging <test edilecek branch>
git push -u origin staging
```

Actions → "Deploy to Staging" yeşilse → https://test.markala.com.tr

## Staging DB'ye veri doldurma

Staging boş şemayla açılır (migration'lar otomatik koşar). Ürün/kategori görmek için
proddan kopya al (**dikkat: kişisel veri içerir — sadece test amaçlı, dışarı çıkarma**):

```bash
ssh markala@<VPS_IP>
cd /opt/markala
docker exec markala-postgres pg_dump -U markala markala > /tmp/prod-copy.sql
docker exec -i markala-staging-postgres psql -U markala -d markala_staging < /tmp/prod-copy.sql
rm /tmp/prod-copy.sql
```

Alternatif (temiz test verisi): `docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm staging-api sh -c "cd apps/api && npx prisma db seed"`

## Günlük akış

1. Feature branch'te çalış (`feature/...`).
2. Staging'de görmek için: `git push origin feature/xyz:staging --force`
   (staging branch'i tek kişilik test bandıdır, force push normaldir).
3. https://test.markala.com.tr üzerinde kontrol et.
4. Onay → `main`'e merge → prod deploy otomatik.

## Kapatma / temizlik

```bash
cd /opt/markala
docker compose -f docker-compose.staging.yml --env-file .env.staging down     # container'lar durur
docker compose -f docker-compose.staging.yml --env-file .env.staging down -v  # + staging DB silinir
```

Prod'a hiçbir etkisi yoktur (ayrı compose projesi: `markala-staging`).
