# Přispívání

Články ukládej do `src/content/docs/` jako `.md` v UTF-8. Oficiální herní názvy (staty, schopnosti, bossové, předměty) zachovej anglicky, popisné výrazy a vysvětlení napiš česky. Používej nadpisy od `##` a relativní odkazy s koncovým lomítkem.

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

Použij skutečné datum a konkrétní zdroj. Redakční stránka bez externích herních tvrzení může mít `sources: []`. `reviewedAt` je datum kontroly zdrojů, nikoli tvrzení o měření v klientu. Přípustné `evidence`: `official`, `community`, `editorial`, `mixed`. Přípustné `scope`: `global`, `asian`, `technical`, `unspecified`.

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
| `:::danger[Riziko: …]` | Červená | Doložené nevratné rozhodnutí nebo fatální mechanika. |

Box uzavři samostatným `:::`:

```md
:::tip[Priorita: doplň prázdné sloty]
Než utratíš materiály, zkontroluj dostupné odměny a neobsazené sloty.
:::
```

Krátkou klíčovou frázi lze výjimečně označit `<mark class="focus">důležitý krok</mark>`. Použij ji nejvýše jednou či dvakrát v článku a neopakuj stejné sdělení i v boxu. Běžné `**tučné názvy**` zůstávají neutrální. Box musí mít srozumitelný český nadpis, aby jeho význam nezávisel jen na barvě.

## Pull request

- Popiš změněné tvrzení, zdroj a cílový patch.
- Spusť `npm ci` a `npm run verify`.
- Každý článek přidej právě jednou do tematické skupiny v `src/lib/navigation.mjs`. Jeho název se z metadat převezme i do úvodního přehledu.
- Po sloučení na `main` se spustí nasazení Pages, pokud je vzdálený hosting povolen.

## Referenční hesla

U referenčních článků nastav `referenceCategory` podle schématu v `src/content.config.ts`. `aliases` přidává alternativní názvy článku; `lookupAliases` váže synonymum ke konkrétnímu heslu (položky `term` a `aliases`).

Hesla pro vyhledávací rozcestník zapisuj do tabulky. První buňka musí mít stabilní a v článku jedinečný identifikátor, například `<span id="ref-kina">**Kina**</span>`. Další buňky obsahují význam a praktický kontext. Identifikátory neměň při stylistických úpravách, protože na ně vedou přímé odkazy. Nový článek propojuj ze souvisejících průvodců; úvodní přehled používá stejný seznam jako menu.

## Čeština a vlastnictví informací

Hráče oslovuj v jednotném čísle a tykej mu. Oficiální názvy ponech anglicky; popisné názvy mechanik a běžné činnosti piš česky. Rozlišuj vstup, pokus, dokončení a vyzvednutí odměny, postavový a serverový limit i denní a týdenní reset. Datum jazykové úpravy nepoužívej jako nové datum věcné rešerše.

Každá mechanika má jednu hlavní stránku. Přehled nebo průvodce prioritami ji krátce vysvětlí a odkáže na podrobnosti; nekopíruj ceny a patchově citlivé limity. Mapa vlastníků je v `docs/revize-v2.md`.

Veřejné adresy a kotvy zachovej i při přejmenování nadpisů. Původní odkaz můžeš podržet prázdným `<span id="stara-kotva" class="legacy-anchor"></span>` před novým nadpisem. Inventář z commitu `f838fff` je v `scripts/public-links.json`; uprav jej pouze při záměrné migraci s otestovanou kompatibilitou. `scripts/evidence-baseline.json` chrání původní edici, datum rešerše, typ podkladů, aliasy a region zdrojů. Věcnou aktualizaci těchto údajů v PR výslovně vysvětli.

Katalog čte explicitní `referenceCategory` bez ohledu na adresář. Nad referenční tabulkou napiš konkrétní nadpis a jasné názvy sloupců; katalog je používá k vysvětlení řádku. Vyhledávací hub a stránky s `pagefind: false` se do katalogu nepřidávají.

Pro změny interakcí spusť také `npx playwright install chromium` a `npm run test:e2e`. CI ověřuje vlastní doménu i projektový `BASE_PATH`, desktop, mobil, obě témata a klávesnici. `npm run check:sources` je informativní kontrola dostupnosti externích zdrojů; změna HTTP odpovědi sama nepotvrzuje správnost ani nesprávnost herních údajů.
