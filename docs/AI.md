# Markala — AI/ML PoC Yol Haritası

**Oluşturma:** 2026-06-15  
**Sahip:** AI ML Operator (GalagoAI / 324 Ajans BT)  
**Kapsam:** `apps/api/src/ai/` ve ilgili frontend entegrasyonu

---

## 1. Mevcut PoC Modülleri

| Endpoint | Dosya | Durum |
|---|---|---|
| `POST /ai/search` | `semantic-search.service.ts` | **Canlı katalog (lexical baseline)** — Prisma'dan aktif ürünler, Türkçe-duyarlı alan-ağırlıklı skor; dış AI/maliyet yok |
| `POST /ai/design-check` | `design-quality.service.ts` | PoC stub (sabit değer döner) |
| `POST /ai/chat` | `chatbot.service.ts` | PoC stub (kural tabanlı) |

### Stub → Prod Yükseltme Öncelikleri

1. **Chatbot** — en hızlı değer. Claude Haiku 4.5 + system prompt ile 1 sprint.
2. **Semantic Search** — ✅ lexical baseline canlı kataloğa bağlandı (sabit değer kaldırıldı). Sonraki adım: pgvector cosine similarity; lexical baseline embedding kalitesini A/B karşılaştırmak için ücretsiz referans olarak kalır.
3. **Design Quality** — Sharp/PDF parse bağımlılığı; 3 sprint.

> **Lexical baseline neden önce?** pgvector + embedding pipeline (AI.md §5) kurulana kadar `/ai/search` artık gerçek sonuç döndürür: hiçbir veri yurt dışına çıkmaz (KVKK m.9 riski 0), API maliyeti 0, deterministik (testlenebilir). Embedding'e geçildiğinde bu baseline kaldırılmaz — kalite kıyas referansı olur.

---

## 2. Provider Değerlendirmesi

### 2a. Dil Modeli (LLM)

| Kriter | Anthropic Claude Haiku 4.5 | OpenAI GPT-4o-mini | Cohere Command R |
|---|---|---|---|
| Türkçe kalitesi | Çok iyi | İyi | Orta |
| Latency (p95) | ~1.2s | ~1.5s | ~2.0s |
| Fiyat (1M token, input) | $0.80 | $0.15 | $0.15 |
| Fiyat (1M token, output) | $4.00 | $0.60 | $0.60 |
| Tool use / Function calling | Güçlü | Güçlü | Sınırlı |
| KVKK: veri konumu | ABD (API) | ABD (API) | ABD/EU |
| Önerilen kullanım | Chatbot, analiz | Embedding, sınıflama | — |

**Karar:** Chatbot için **Claude Haiku 4.5** (Türkçe üstünlüğü + tool use). Embedding/semantic search için **OpenAI text-embedding-3-small** (maliyet). Prod geçişte her iki sağlayıcıdan önce KVKK m.9 yurt dışı aktarım mekanizması (SCCs) değerlendirilmeli.

### 2b. Embedding + Vector DB

| Seçenek | Avantaj | Dezavantaj |
|---|---|---|
| pgvector (mevcut Postgres) | Ek altyapı yok | 100K+ ürünlerde yavaş |
| Pinecone | Hızlı, yönetilen | Yurt dışı veri |
| Qdrant (self-hosted) | KVKK uyumlu | Altyapı yükü |

**Karar:** Faz 1 için **pgvector** (mevcut Postgres + `aisantral` schema analogu). 100K üzeri ürün/log hacminde Qdrant self-hosted.

---

## 3. Mimari Hedef (Sprint 2-4)

```
Frontend (Next.js)
  └─ POST /api/ai/chat          ← kullanıcı sorusu
       └─ ChatbotService
            ├─ PII scrub (e-posta, tel maskeleme)
            ├─ Claude Haiku 4.5 API call
            │    system: ürün kataloğu + sipariş SSS
            └─ SemanticSearchService (tool_use ile)
                 └─ pgvector cosine similarity

Frontend (Admin)
  └─ POST /api/ai/design-check  ← R2 URL
       └─ DesignQualityService
            ├─ Sharp: DPI + renk modu
            ├─ PDF: bleed box parse
            └─ uyarı/hata raporu
```

---

## 4. KVKK + Güvenlik Notları

- Tüm AI API çağrılarından önce `services/pii_scrubber` benzeri bir pipe geçirmek zorunlu (telefon, TC kimlik, e-posta maskeleme).
- Kullanıcı mesajları (chatbot) log'a **ham** yazılmaz; sadece session_id + timestamp.
- OpenAI/Anthropic'e dosya (tasarım görseli) gönderilmez; yalnızca metin metadata gönderilir.
- EU AI Act m.50: chatbot konuşmada AI olduğunu açıkça belirtmeli (başlangıç mesajı).
- `POST /ai/chat` rotası şimdilik auth opsiyonel; prod geçişte rate-limit + opsiyonel session auth eklenmeli.

---

## 5. Sprint 2 Backlog (öneri)

| # | Görev | Efor | Bağımlılık |
|---|---|---|---|
| 1 | pgvector extension + `product_embeddings` tablosu migration | S | Prisma schema |
| 2 | Embedding pipeline: ürün oluşturulduğunda otomatik embed | M | Celery analog / BullMQ |
| 3 | Claude Haiku 4.5 chatbot system prompt + tool_use entegrasyonu | M | AI provider account |
| 4 | Design Quality: Sharp + pdf-parse bağımlılığı + gerçek DPI okuma | L | — |
| 5 | Admin panel: `/admin/ai/chat-logs` (session listesi, maskelenmiş) | M | Frontend P-AI-1 |

---

## 6. Test Stratejisi

```bash
# Birim test (stub)
pnpm --filter api test src/ai/

# Integration test (prod API key gerektirir — CI'da skip)
AI_INTEGRATION=1 pnpm --filter api test:e2e ai
```

- Stub testleri CI'da her zaman çalışır (dış bağımlılık yok).
- Integration testleri `.env.test.local` ile sadece yerel/staging'de çalışır.
