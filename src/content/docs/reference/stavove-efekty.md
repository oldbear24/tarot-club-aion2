---
title: Stavové efekty a reakce v boji
description: Root, Knockdown, Fear, Bleed, buffy, cleanse a podmínky opakované aplikace.
sidebar:
  order: 5
edition: global-launch
reviewedAt: '2026-10-12'
evidence: community
referenceCategory: boj
aliases:
- status effects
- buff
- debuff
- CC
- stun
- root
- fear
- airborne
- knockdown
- bleed
- blind
- silence
- cleanse
- dispel
sources:
- title: Global Database — debuff katalog 2.0.6.0
  url: https://aion2.gaming.tools/status-effects/debuffs
  scope: global
- title: Global Database — Root 2.0.6.0
  url: https://aion2.gaming.tools/status-effects/100000201
  scope: global
- title: Global Database — Knockdown 2.0.6.0
  url: https://aion2.gaming.tools/status-effects/100000321
  scope: global
- title: Global Database — Fear 2.0.6.0
  url: https://aion2.gaming.tools/status-effects/162100001
  scope: global
- title: Global Database — konkrétní Bleed, 2.0.5.0
  url: https://aion2.gaming.tools/status-effects/140500001
  scope: global
- title: Global Database — Battlefield Banner 2.0.6.0
  url: https://aion2.gaming.tools/status-effects/124500001
  scope: global
---

**Rozsah:** Global launch / Season 1, rešerše 12. října 2026. Komunitní přepis dat nebo návod není naše vlastní měření serveru. U cen, dostupnosti a sdílení má přednost aktuální tooltip či panel klientu.

## Název nestačí: rozhoduje konkrétní efekt

Stejná rodina může mít různé hodnoty nebo pravidla obnovy. Níže rozlišujeme obecný význam od vlastností konkrétního databázového záznamu.

| Efekt / rodina | Co poznat | Co zkontrolovat |
| --- | --- | --- |
| <span id="ref-root-immobilized">**Root / Immobilized**</span> | Omezení pohybu. | Zda dovoluje útok, úhyb nebo zrušení konkrétní schopností. |
| <span id="ref-knockdown">**Knockdown**</span> | Sražení postavy. | Způsob uvolnění a navazující podmíněné útoky protivníka. |
| <span id="ref-airborne">**Airborne**</span> | Omezení spojené s vynesením do vzduchu. | Dostupný CC break; neplést se svobodným létáním. |
| <span id="ref-fear">**Fear**</span> | Strach; vlastní debuff rodina. | Délku, chování a zrušení v daném tooltipu. Citovaný záznam není zobrazován na HUD. |
| <span id="ref-slow">**Slow**</span> | Zpomalení z konkrétního efektu. | Jestli mění pohyb, provedení schopnosti nebo jinou rychlost. |
| <span id="ref-bleed">**Bleed**</span> | Průběžné poškození. | Konkrétní záznam 140500001 uvádí i −60 % Incoming Heal; to neplatí automaticky pro každý bleed. |
| <span id="ref-blind">**Blind**</span> | Oslepení; samostatná rodina. | Konkrétní postih a možnost odstranění; samotný název neurčuje přesnou šanci zásahu. |
| <span id="ref-seal-silence">**Seal / Silence**</span> | Omezení akcí podle přesného tooltipu. | Které schopnosti jsou blokované; různé názvy nelze automaticky sloučit. |
| <span id="ref-knock-back-pulled">**Knock Back / Pulled**</span> | Nucený přesun. | Směr a pozici vůči okraji, trhlině nebo osobní mechanice. |
| <span id="ref-buff-passive-gear-effect">**Buff / Passive / Gear Effect**</span> | Odlišné zdroje pozitivních či průběžných účinků. | Příjemce, trvání, stackování a možnost přepsání. |

## Obnova efektu a stackování

Databáze rozlišuje nahrazení při nové aplikaci a podmínku vyšší priority. **Battlefield Banner** má uvedeno nahrazení běžící aplikace; **Root** přijímá jen aplikaci s vyšší prioritou. Neodvozuj z dvojího seslání automaticky dvojnásobný bonus.

## Doporučená reakce Tarot Clubu

Nejdřív určuj, zda musíš změnit pozici, odstranit efekt, nebo vyčkat na mechaniku. Ověř, které typy debuffů tvoje cleanse opravdu odstraňuje. U bosse odděl běžné CC od [stagger checku](../stagger/). Po smrti nebo resetu boje zkontroluj znovu aktivní buffy a jejich příjemce.
