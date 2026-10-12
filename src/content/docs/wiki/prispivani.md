---
title: Jak přispívat do wiki
description: Úpravy Markdownu, přidání článku a dokládání informací pro Global.
sidebar:
  order: 3
edition: global-launch
reviewedAt: '2026-10-12'
evidence: editorial
---

## Obsah žije v Markdownu

Všechny články jsou v `src/content/docs/`. Nemusíš upravovat komponenty ani přidávat obsah do databáze. Změnu navrhni přes pull request nebo uprav soubor v editoru GitHubu.

## Nový článek

Vytvoř například `src/content/docs/pruvodce/priprava-na-party.md`. Povinné údaje ve frontmatteru:

```yaml
---
title: Příprava na party
description: Krátký popis tématu.
edition: global-launch
reviewedAt: '2026-10-12'
evidence: editorial
sources: []
---
```

Pod metadata napiš český text. Začni nadpisem `##`; hlavní nadpis stránky vytvoří web z `title`. Soubory v `pruvodce/` a `wiki/` se objeví v navigaci automaticky. Novou stránku v `staty/` přidej také do konfigurace sidebaru.

## Přidání zdroje

```yaml
evidence: mixed
sources:
  - title: Konkrétní oficiální oznámení
    url: https://aion2.plaync.com/en-us/
    scope: global
```

Nahraď příklad konkrétní URL oznámení. Pro zdroje jsou povoleny regiony `global`, `asian`, `unspecified` a technický typ `technical`. Pro článek jsou povoleny podklady `official`, `community`, `editorial` a `mixed`.

## Podmínky pro herní tvrzení

- Anglický název statu zachovej a význam vysvětli česky.
- U čísel přilož podklad pro Global, datum a patch; u měření také podmínky testu.
- KR/TW podklady označ regionem a neprezentuj jejich hodnoty jako změřené pro Global.
- U vlastní rady řekni, že jde o doporučení.
- Při opravě rozporu zachovej poznámku, proč byl původní údaj změněn.

## Odkazy a sestavení

Mezi články používej relativní odkazy s koncovým lomítkem. Ze stránky `staty/utok/` například `../procy/` nebo `../../pruvodce/lepsi-damage/`. Zachováš tak funkčnost i v podadresáři GitHub Pages.

```bash
npm ci
npm run verify
```

Kontrola sestaví celý web a ověří lokální odkazy, české HTML a dostupnost vyhledávacího indexu. Úspěšný build sám o sobě nepotvrzuje správnost herní informace.
