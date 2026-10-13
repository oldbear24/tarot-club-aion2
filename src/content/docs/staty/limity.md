---
title: Limity a sporné hodnoty
description: Co říkají tooltipy Global a které limity nebo vzorce vyžadují ověření.
edition: global-launch
reviewedAt: '2026-10-12'
referenceCategory: staty
evidence: community
sources:
  - title: Aion 2 Maps — Accuracy and Crit, srovnání Global a TW
    url: https://aion2maps.com/guides/accuracy-and-crit/
    scope: global
  - title: Aion 2 Maps — Stats explained
    url: https://aion2maps.com/guides/stats-explained/
    scope: global
  - title: Wikily — Recovery, cena MP
    url: https://wikily.gg/aion-2/stats/recovery
    scope: unspecified
  - title: Wikily — Basic Stats, tooltip Critical Hit, Evasion a Move Speed
    url: https://wikily.gg/aion-2/stats/basic
    scope: unspecified
  - title: Wikily — Other, tooltip Cooldown
    url: https://wikily.gg/aion-2/stats/other
    scope: unspecified
  - title: Global Database — Clash Rune a neověřená failure penalty, 2.0.6.0
    url: https://aion2.gaming.tools/items/310900001
    scope: global
  - title: Aion 2 Maps — varování pro speciální sloty Global
    url: https://aion2maps.com/guides/special-slots/
    scope: global
  - title: Aion 2 Maps — research následků neúspěchu, KR disclosure
    url: https://aion2maps.com/guides/research/gear/special-enhancement-odds/
    scope: asian
---

## Tooltip není měření serveru

Komunitní přepisy tooltipů uvádějí tyto limity. Aion 2 Maps čte text přímo z klientu Global; Wikily region ani patch svých přepisů neuvádí.

| Stat | Uváděný limit | Původ a poznámka |
| --- | --- | --- |
| **Critical Hit Rate** | 50 % | Tooltip Global (Maps, Wikily). V asijské verzi komunitní měření ukazují kritickou šanci kolem 80 %; serverový limit Global zde není změřen. |
| **Evasion Rate** | 30 % | Tooltip Global (Maps, Wikily); stejný text mají i varianty Evasion. |
| **Cooldown Reduction** | 60 % | Tooltip (Maps, Wikily): maximální zkrácení cooldownu. |
| **MP Cost Reduction** | 60 % | Tooltip (Maps, Wikily): maximální snížení ceny MP. |
| **Move Speed** | 150 % | Tooltip (Maps, Wikily): rychlost nepřekročí 150 %, nejde automaticky o +150 % navíc. |

Podle Maps je text tooltipu jediné místo v klientu Global, kde se limit kritické šance a Evasion objevuje; žádná datová tabulka klientu takový strop neukládá. Proto ho nelze brát jako potvrzený serverový limit.

:::caution[Pozor: nezaměňuj KR/TW a Global]
Asijská měření kritické šance se rozcházejí s globálním textem tooltipu. **80% crit cap ani univerzální počet bodů Accuracy/Crit zde nejsou ověřeným cílem pro Global.**
:::

## Co zatím vyžaduje kontrolu

- Přesná převodní křivka mezi Critical Hit body a kritickou šancí.
- Resisty jednotlivých bossů Global a z nich odvozené cílové staty.
- Skrytá základní šance Multi-hit a poškození jeho dodatečných zásahů. Maps uvádí z dat klientu 20 % základní šance; přínos dodatečného zásahu se podle Maps ve zdrojích rozchází.
- Pořadí serverových výpočtů a společná aktivace Critical, Perfect a Double. Pro příchozí zásah uvádí Maps podle tvůrce Grobs pořadí Evasion → Block/Parry → Endurance → Regeneration; Global měření chybí.
- Přesné váhy statů pro jednotlivé třídy a vybavení.

## Následek neúspěšného upgradu runy

Riziko při upgradu runy není limit statu. Podklady, rozpor mezi Global průvodci a databází i doporučený postup drží [runový průvodce](../../pruvodce/runy-specialni-sloty/).

## Jak dodat použitelný test

Doporučení Tarot Clubu: ulož datum, region, patch, třídu, úroveň, výbavu, buffy, schopnost i cíl. Změň pouze jeden zdroj statu a opakuj stejné podmínky. Při testu náhodné aktivace zaznamenej také velikost vzorku; několik zásahů nestačí pro spolehlivý limit.

Ve wiki se takový závěr označí jako **měření Global**, až budou dostupné podklady. Datum rešerše samo o sobě tuto úroveň důkazu neznamená.
