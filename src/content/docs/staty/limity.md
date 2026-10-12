---
title: Limity a sporné hodnoty
description: Co říkají tooltipy Global a které limity nebo vzorce vyžadují ověření.
edition: global-launch
reviewedAt: '2026-10-12'
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

Komunitní extrakce globálního klientu uvádí tyto limity:

| Stat | Uváděný limit | Jak informaci používat |
| --- | --- | --- |
| **Critical Hit Rate** | 50 % | Text tooltipu Global; skutečný serverový limit zde není změřen. |
| **Evasion Rate** | 30 % | Text tooltipu Global. |
| **Cooldown Reduction** | 60 % | Uváděná maximální redukce. |
| **MP Cost Reduction** | 60 % | Uváděná maximální redukce. |
| **Move Speed** | 150 % | Uváděná horní hodnota rychlosti, nikoli automaticky +150 % navíc. |

:::caution[Nezaměňuj KR/TW a Global]
Asijská měření kritické šance se rozcházejí s globálním textem tooltipu. **80% crit cap ani univerzální počet bodů Accuracy/Crit zde nejsou ověřeným cílem pro Global.**
:::

## Co zatím vyžaduje kontrolu

- Přesná převodní křivka mezi Critical Hit body a kritickou šancí.
- Resisty jednotlivých bossů Global a z nich odvozené cílové staty.
- Skrytá základní šance Multi-hit a poškození jeho dodatečných zásahů.
- Pořadí serverových výpočtů a společná aktivace Critical, Perfect a Double.
- Přesné váhy statů pro jednotlivé třídy a vybavení.

## Následek neúspěšného upgradu runy

Global průvodci varují před zničením runy od +2. Global Database přitom u failure penalty výslovně uvádí neověřené chování. Detailní research tabulka Maps vychází z KR disclosure. Nejde tedy o vlastní potvrzení serverového chování Global. Praktická rada zůstává **+1 pro první progresi a kontrola varování v klientu**; [runový průvodce](../../pruvodce/runy-specialni-sloty/) vysvětluje kontext.

## Jak dodat použitelný test

Doporučení Tarot Clubu: ulož datum, region, patch, třídu, úroveň, výbavu, buffy, schopnost i cíl. Změň pouze jeden zdroj statu a opakuj stejné podmínky. Při testu náhodné aktivace zaznamenej také velikost vzorku; několik zásahů nestačí pro spolehlivý limit.

Ve wiki se takový závěr označí jako **měření Global**, až budou dostupné podklady. Datum rešerše samo o sobě tuto úroveň důkazu neznamená.
