<!--
  Markala PR şablonu. Boş bırakılan bölüm = eksik PR.
  Başlık formatı: <tip>(<scope>): <özet>   örn: feat(web): sepet kupon alanı
  Conventional Commits zorunlu (feat/fix/docs/chore/test/refactor/ci/perf).
-->

## Sorun / Amaç
<!-- 1-2 cümle: bu PR neyi çözüyor, neden gerekli. Issue varsa bağla: Closes AJA-123 -->

## Çözüm
<!-- Yapılan değişikliklerin madde madde özeti. "Ne" değil "niye" odaklı. -->
-

## Etki Alanı
<!-- Hangi paket/uygulama etkilendi? Yalnızca ilgili kutuları işaretle. -->
- [ ] `apps/web`
- [ ] `apps/admin`
- [ ] `apps/api`
- [ ] `packages/*` (kırıcı değişiklik tüm tüketicileri etkiler — dikkat)

## Test
- [ ] `pnpm type-check` temiz (etkilenen uygulamalar)
- [ ] `pnpm --filter @markala/web test` geçiyor (web değiştiyse)
- [ ] CI yeşil
- [ ] Manuel test senaryoları (aşağıda)

<!-- Manuel doğrulama adımları: -->

## Risk
<!-- low / med / high — kısa gerekçe. Migration / auth / ödeme / KVKK dokunuşu varsa açıkla. -->

## Ekran (UI değişikliği varsa)
<!-- before / after görsel. UI değişmiyorsa "n/a" yaz. -->

## Kontrol Listesi
- [ ] PR < ~300 LOC (büyükse böl, gerekçesini yaz)
- [ ] `main`'e doğrudan push yok — bu bir PR
- [ ] Yeni `any` / `@ts-ignore` eklenmedi (eklendiyse satır içi gerekçe var)
- [ ] Dead code / yorum satırına alınmış kod bırakılmadı
- [ ] Yorumlar **niye**yi açıklıyor (değişken/fonksiyon adı İngilizce, yorum Türkçe)
- [ ] Migration varsa `-- ROLLBACK:` adımı eklendi
- [ ] Secret / API key / `.env` değeri commit'lenmedi
