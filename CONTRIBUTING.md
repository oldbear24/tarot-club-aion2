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

## Střídmé zvýrazňování

Používej nanejvýš jeden až dva boxy na běžný článek. Vyber nejdůležitější krok nebo snadno přehlédnutelnou chybu; dlouhé tabulky a celé seznamy nech v běžném textu. Barva není hodnocení ověřenosti zdroje.

| Markdown | Barva | Kdy jej použít |
| --- | --- | --- |
| `:::tip[Priorita: …]` | Zelená | Doporučený první krok nebo praktický tip. |
| `:::note[Důležité: …]` | Modrá | Vysvětlení podstatného rozdílu. |
| `:::caution[Pozor: …]` | Oranžová | Častá chyba, limit nebo zbytečná investice. |
| `:::danger[Riziko: …]` | Červená | Možná ztráta nebo zničení předmětu. |

Box uzavři samostatným `:::`:

```md
:::tip[Priorita: doplň prázdné sloty]
Než utratíš materiály, zkontroluj dostupné odměny a neobsazené sloty.
:::
```

Krátkou klíčovou frázi lze výjimečně označit `<mark class="focus">důležitý krok</mark>`. Použij ji nejvýše jednou či dvakrát v článku a neopakuj stejné sdělení i v boxu. Běžné `**tučné názvy**` zůstávají neutrální. Box musí mít srozumitelný český titul, aby jeho význam nezávisel jen na barvě.

## Pull request

- Popiš změněné tvrzení, zdroj a cílový patch.
- Spusť `npm ci` a `npm run verify`.
- Soubory v `pruvodce/`, `wiki/`, `reference/`, `tridy/` a `dungeony/` mají automatickou navigaci. Nový statový článek přidej do `astro.config.mjs`.
- Po sloučení na `main` se spustí nasazení Pages, pokud je vzdálený hosting povolen.

## Referenční hesla

U referenčních článků nastav `referenceCategory` podle schématu v `src/content.config.ts`. `aliases` přidává alternativní názvy článku; `lookupAliases` váže synonymum ke konkrétnímu heslu (položky `term` a `aliases`).

Hesla pro vyhledávací rozcestník zapisuj do tabulky. První buňka musí mít stabilní a v článku jedinečný identifikátor, například `<span id="ref-kina">**Kina**</span>`. Další buňky obsahují význam a praktický kontext. Identifikátory neměň při stylistických úpravách, protože na ně vedou přímé odkazy. Nový článek propojuj také z úvodní stránky a souvisejících průvodců.
