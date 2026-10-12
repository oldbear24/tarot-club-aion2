# Přispívání

Články ukládej do `src/content/docs/` jako `.md` v UTF-8. Herní názvy zachovej anglicky, vysvětlení napiš česky. Používej nadpisy od `##` a relativní odkazy s koncovým lomítkem.

## Povinná metadata

```yaml
---
title: Název článku
description: Stručný popis pro vyhledávání.
edition: global-launch
reviewedAt: '2026-10-12'
evidence: community
sources:
  - title: Konkrétní zdroj
    url: https://example.com/konkretni-clanek
    scope: unspecified
---
```

Použij skutečné datum a konkrétní zdroj. `reviewedAt` je datum kontroly zdrojů, nikoli tvrzení o měření v klientu. Přípustné `evidence`: `official`, `community`, `editorial`, `mixed`. Přípustné `scope`: `global`, `asian`, `technical`, `unspecified`.

## Ověřování obsahu

1. Ověř, zda tvrzení patří do Global launch nebo pozdějšího patchu.
2. Odděl tooltip od naměřeného výsledku a od vlastní rady.
3. U čísla uveď region, datum, patch a podmínky měření.
4. Neodvozuj limity nebo priority Global pouze z KR/TW.
5. U sporného tvrzení přilož screenshot nebo odkaz na primární podklad.

Nevkládej cizí plné návody, assety bez oprávnění ani soukromé údaje hráčů. Použij vlastní výklad a krátkou citaci pouze tam, kde je potřebná.

## Pull request

- Popiš změněné tvrzení, zdroj a cílový patch.
- Spusť `npm ci` a `npm run verify`.
- Soubory v `pruvodce/` a `wiki/` mají automatickou navigaci. Nový statový článek přidej do `astro.config.mjs`.
- Po sloučení na `main` se spustí nasazení Pages, pokud je vzdálený hosting povolen.
