<!--
  Markala PR şablonu — her PR bu başlıkları doldurmalı.
  Kurallar: main'e doğrudan push yok · PR < ~300 LOC · Conventional Commits · CI yeşil.
  Ayrıntı: ../CONTRIBUTING.md
-->

## Sorun
<!-- 1-2 cümle: bu PR hangi problemi/eksiği çözüyor? -->

## Çözüm
<!-- Madde madde ne yaptın. "Ne" değil, kritik kararların "niye"si. -->
-

## Test
<!-- Geçerli olanları işaretle, geçmeyenleri sil. -->
- [ ] `pnpm type-check` temiz
- [ ] `pnpm lint` temiz
- [ ] İlgili `pnpm --filter <paket> test` geçiyor (n/n)
- [ ] Manuel/smoke senaryo denendi (nasıl: ...)

## Risk
<!-- low / med / high + tek cümle gerekçe. -->

## Etki Alanı
- [ ] Yalnızca kendi alanım (başka ajanın domain'ine girmedim)
- [ ] Yeni/değişen tip `@markala/types` üzerinden tek kaynaktan geliyor
- [ ] KVKK aydınlatma / hassas veri akışı etkilenmiyor (etkileniyorsa açıkla)
- [ ] Public yüzeyde rakip ismi / kurmaca müşteri-şube ismi yok

## Ekran (UI değişikliği varsa)
<!-- before / after görsel -->

## Rollback Planı
<!-- Tek satır: nasıl geri alınır? Migration varsa rollback adımı şart. -->
