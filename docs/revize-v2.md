# Revize wiki podle zadání V2

Revize vychází z commitu `f838fff` a zachovává Astro, Starlight, Markdown a statické nasazení. Byla zvolena etapa A a B: tematické menu a konsolidace obsahu bez fyzického přesouvání souborů. Všechny původní veřejné adresy fungují přímo, bez klientského přesměrování.

## Implementované změny

- Redakční průchod všech 62 obsahových stránek i 404, metadat a českého rozhraní. Opravené formulace, návaznosti vět, tykání, popisy rolí a názvy činností; oficiální anglické názvy zůstávají.
- Encyklopedie nadále obsahuje všech 148 základních statových hesel a šest dalších názvů. Výklady rodových bonusů a obnovy zdrojů uvádějí konkrétní cíl či zdroj místo izolovaného slova.
- Jediné tematické umístění každého článku v devíti skupinách. Slovník a katalog jsou společnou vrstvou nad všemi tématy. Encyklopedie, Stagger, ekonomika i výrobní systémy mají místo podle tématu, nezávisle na adresáři.
- Úvod nabízí pět rychlých cest. Osm rozbalitelných tematických přehledů přebírá názvy článků z metadat a používá stejný seznam jako menu.
- Katalog má 545 položek včetně průvodců a statových článků mimo `reference/`. Názvy sloupců a sekcí vysvětlují kontext tabulkových řádků; číslo v receptu se neukazuje bez popisu.
- Katalog používá statický JSON bez duplicitního vyhledávacího textu a vykresluje dávky po 60 výsledcích. URL uchovává `q`, `category`, `kind`, ostatní parametry i fragment. Funguje obnovení, reset, aliasy, diakritika, hledání ID kotev a bezpečné zvýraznění přes textové uzly.
- Fulltext Pagefind a katalog jsou jasně rozlišené. Tlačítko z katalogu otevře fulltext a předá dotaz. Nezdařené načtení indexu má opakování a odkazy na články; bez JavaScriptu zůstává slovník, témata a první dávka odkazů.
- Osm tříd má jednotnou osnovu a výslovné upozornění, pokud u komunitní sestavy není doložené číslo patche. Sedm dungeonových příruček má stručný tahák z již uvedených mechanik; historická Ludra zůstává označená.
- Střídmé callouty jsou zachované. Neověřené riziko run používá `caution`, nikoli tvrzení o doloženém kritickém následku. Kontrast drobného šedého textu ve světlém režimu je zvýšený.
- Výchozí canonical doména je `https://aion2.tarot-club.cz/`. Build kontroluje canonical, sitemap, české HTML, jediný H1, jedinečná ID, všechny interní odkazy, katalogové odkazy a původní kotvy. Robots používá nastavenou doménu/base.
- CI ověřuje root i projektový režim a spouští Playwright. Samostatná týdenní kontrola externích zdrojů má informativní výsledek a neblokuje nasazení.

## Vlastníci informací

| Informace | Hlavní stránka | Ostatní použití |
| --- | --- | --- |
| Denní/týdenní počítadla, sdílení, UTC a český čas resetu | `pruvodce/daily-weekly.md` | Přehled aktivit a Nightmare odkazují na limity. |
| Odyle, cena vyzvednutí, nevyzvednuté truhly a Guaranteed Reward | `pruvodce/dungeony-odyle.md` | GS, daily, Market a aktivity odkazují na pravidla. |
| Týdenní čas Abyssu | `pruvodce/abyss.md` | Denní/týdenní plán odkazuje na příděl. |
| Pet Insight, Genus, souls, Analyze a uzamykání | `reference/pets.md` | CP vysvětluje priority, bez druhé kopie nákladů 5/25/75. |
| Wings a tituly | `reference/wings.md`, `reference/tituly-kolekce.md` | CP uvádí význam pro výběr a odkazy. |
| Transfer a nepřenášené vlastnosti | `pruvodce/vylepsovani-vybavy.md` | Kameny vysvětlují sloty, zdroje a výběr. Upcraft zůstává samostatnou výrobní operací. |
| Ceny a limity obchodů | `reference/obchody.md` | Abyss, Nightmare a runy odkazují na ceny; runový průvodce vlastní obsah truhly. |
| Příspěvek barev kamenových řádků do GS | `pruvodce/gs-progrese.md` | Kameny odkazují na hodnoty. |
| Limity statů | `staty/limity.md` | Proc průvodce vysvětluje rozpor a odkazuje na konkrétní hodnoty. |
| Kvalita a úrovně Arcana | `pruvodce/arcana.md` | Vstupní GS milníky vlastní GS průvodce. |

Inventář aktivit neudržuje druhou tabulku resetů ani cen. Definice ve slovníku a příklady herního rozhodování mohou téma stručně shrnout; samostatný praktický pohled není druhým vlastníkem číselné tabulky.

## Ověření a měření

- `npm ci` a `npm run verify`: 11 testů, Astro check bez chyb, statický build a kontrola 63 HTML stránek.
- `SITE_URL=https://oldbear24.github.io BASE_PATH=/tarot-club-aion2/ npm run verify`: stejná kontrola v projektovém podadresáři.
- Playwright: 8 případů pro každý režim nasazení, desktop a mobil, světlý i tmavý režim, klávesnice, fulltext, filtr a URL, kotvy, návrat, dávkování, reset, chyba indexu a stránka bez JavaScriptu.
- Zachovaných 62 obsahových cest a všech 849 původních HTML kotev. Alias nadpisu zůstává i po jeho jazykovém přejmenování. Nový katalog navíc kontroluje každý svůj cíl.
- Metadata test chrání původní `edition`, `reviewedAt`, `evidence`, aliasy, zdrojové URL a jejich regiony. Při slučování byly zdroje doplněné i u nového vlastníka.
- Ruční kontrola diffu čísel: odstraněné hodnoty byly přesunuté k vlastníkovi nebo zůstaly v jeho existující tabulce; nebyly nahrazené novou domněnkou. Datum věcné rešerše se neměnilo.
- Výchozí katalog: 521 položek, 259 048 B HTML. Nový root katalog: přibližně 61 kB HTML a 151 kB JSON pro 545 položek. Počáteční HTML je asi o 76 % menší a výsledkových karet je nejvýše 60 místo 521. JSON se stahuje jen na stránce katalogu; Pagefind nadále načítá svůj index samostatně.
- Vizuálně zkontrolované snímky článků v obou režimech a při mobilní šířce. Sticky navigace a menu mají automatickou kontrolu.
- `npm run check:sources`: 100 jedinečných zdrojových URL; jedna skončila timeoutem. HTTP dostupnost nenahrazuje věcnou kontrolu článku.

Lokální standardní stahování prohlížeče skončilo chybným ZIPem. E2E proto lokálně skutečně proběhlo přes Chromium 153 z pomocného balíčku mimo repozitář. CI používá standardní instalaci prohlížeče Playwrightu.

## Zbývající položky

| Priorita | Úkol | Důvod |
| --- | --- | --- |
| P1 | Ručně ověřit `https://aion2.gaming.tools/items/110230015` | Při kontrole dostupnosti vypršel timeout; není doloženo, že odkaz nefunguje. |
| P2 | Doložit přesné patche sestav tříd, serverové varianty mechanik a sporné vzorce/limity | Revize zachovává původní důkazní sílu. Bez nových Global podkladů nevytváří přesné rotace ani nepřepisuje herní fakta. |
| P2 | Zvážit fyzické přesuny článků až při konkrétním přínosu | Tematická reorganizace už funguje. Změna slugů by vyžadovala zvláštní migraci a přenos všech fragmentů na GitHub Pages. |
| P3 | Lokální checklist, oblíbené články, hlášení chyby a přehled stáří rešerší | Volitelné funkce byly ponechány mimo tuto revizi; nemají přednost před obsahem a kompatibilitou. |

Tato revize neprovádí nové herní měření ani neoznačuje komunitní údaje za oficiální potvrzení. Hranice Global/KR/TW a historický obsah zůstávají viditelné u odpovídajících tvrzení.
