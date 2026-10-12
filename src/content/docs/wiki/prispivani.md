---
title: Jak přispívat do wiki
description: Úpravy Markdownu, přidání článku a dokládání informací pro Global.
sidebar:
  order: 3
edition: global-launch
reviewedAt: '2026-10-12'
referenceCategory: wiki
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

Pod metadata napiš český text. Začni nadpisem `##`; hlavní nadpis stránky vytvoří web z `title`. Novou stránku přidej do tematické skupiny v `src/lib/navigation.mjs` a nastav `referenceCategory`. Název se do menu i úvodního přehledu převezme z metadat článku.

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

## Jak zvýraznit důležitý krok

V běžném článku stačí jeden až dva barevné boxy: **zelený tip / priorita**, **modré vysvětlení**, **oranžové upozornění**. **Červené riziko** ponech pro doložené nevratné rozhodnutí nebo fatální mechaniku. Neověřené riziko označ oranžovým upozorněním. Barva vyjadřuje účel poznámky, nikoli ověřenost zdroje.

```md
:::tip[Priorita: doplň prázdné sloty]
Než utratíš materiály, zkontroluj dostupné odměny a neobsazené sloty.
:::
```

Místo `tip` můžeš použít `note`, `caution` nebo `danger`. Vždy napiš jasný český titul. Krátkou frázi výjimečně zvýrazni pomocí `<mark class="focus">důležitý krok</mark>`. Neoznačuj celé odstavce ani každý herní název; běžné tučné písmo zůstává hlavní pomůckou pro skenování textu.

## Odkazy a sestavení

Mezi články používej relativní odkazy s koncovým lomítkem. Ze stránky `staty/utok/` například `../procy/` nebo `../../pruvodce/lepsi-damage/`. Zachováš tak funkčnost i v podadresáři GitHub Pages.

```bash
npm ci
npm run verify
```

Kontrola sestaví celý web a ověří lokální odkazy, české HTML a dostupnost vyhledávacího indexu. Úspěšný build sám o sobě nepotvrzuje správnost herní informace.
