# Tarot Club — AION 2

Česká statická příručka pro AION 2 Global launch na [aion2.tarot-club.cz](https://aion2.tarot-club.cz/). Obsah a jeho zdroje zůstávají v Markdownu; Astro + Starlight vytváří statické stránky pro GitHub Pages.

## Obsah a orientace

- 63 stránek včetně Tarot AI: rozvoj GS/CP, staty, osm tříd, výbava, výroba, ekonomika, aktivity a dungeonové mechaniky.
- Jedno tematické menu; původní veřejné adresy zůstávají funkční. Adresář `reference/` popisuje umístění zdrojových souborů, nikoli další paralelní obsahovou sekci.
- Kompaktní úvod s pěti rychlými cestami a tematickým přehledem odvozeným ze stejného seznamu jako menu.
- **Hledat ve wiki** prohledává celé články přes Pagefind. **Katalog hesel a článků** filtruje názvy, aliasy, témata a krátké popisy; stav lze sdílet v URL.
- Katalog 148 statů a šesti dalších názvů zachovává všechny původní odkazy `#ref-*`. Tabulková hesla mají kontext podle názvů sloupců a sekcí.
- České UI, světlý/tmavý režim, mobilní menu, klávesnice a střídmé významové callouty.

Herní údaje vycházejí z uvedených podkladů. Datum rešerše nepotvrzuje vlastní měření serveru. KR/TW hodnoty, historické mechaniky a neotevřený obsah mají v článcích označenou platnost nebo nejistotu. Jazyková úprava nemění datum věcné rešerše.

## Lokální práce

Použij Node.js 24 (minimum 22.12) a npm:

```bash
npm ci
npm run dev
```

Produkční kontrola článků, metadat, indexu a hotových odkazů:

```bash
npm run verify
npm run preview
```

Bez proměnných používá build canonical doménu `https://aion2.tarot-club.cz/` a cesty v kořeni. Projektový GitHub Pages režim:

```bash
SITE_URL=https://oldbear24.github.io BASE_PATH=/tarot-club-aion2/ npm run verify
```

PowerShell:

```powershell
$env:SITE_URL = 'https://oldbear24.github.io'
$env:BASE_PATH = '/tarot-club-aion2/'
npm run verify
```

Hledání Pagefind se sestavuje pro produkční náhled; v běžném dev režimu nemusí fungovat.

## Testy rozhraní a zdrojů

```bash
npx playwright install chromium
npm run test:e2e
npm run check:sources
```

E2E používá již sestavený `dist/`; před změnou domény nebo `BASE_PATH` znovu spusť `verify` se stejnými proměnnými. Testy pokrývají URL filtry, aliasy, fulltext, přímé odkazy, chybu načítání, obnovu, klávesnici, desktop, mobil a obě témata. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` umožňuje použít vlastní lokální Chromium.

Dostupnost zdrojů je informativní kontrola. Běží samostatně i každý týden a neblokuje produkční nasazení při externím výpadku.

## Tarot AI

V navigaci zvol **Zeptat se AI**. AI je volitelná; běžné články nenačítají její JavaScript ani model. Na AI stránce se runtime a worker načtou až po kliknutí **Zapnout lokální AI**. Chat nemá účet, API klíč, serverovou inferenci ani cloudový fallback.

### Runtime a model

- Jediný runtime: `@mlc-ai/web-llm` **0.2.86**, kvantizovaný instruction model **`Qwen3-0.6B-q4f32_1-MLC`** (0,6B parametrů). Identifikátor, adresa modelu i kompatibilní WASM pocházejí z `prebuiltAppConfig` této přesně připnuté verze. Test kontroluje přítomnost modelu v této konfiguraci.
- Licence původního modelu: **Apache 2.0**. [Model card](https://huggingface.co/Qwen/Qwen3-0.6B), [MLC distribuce](https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f32_1-MLC), [oficiální seznam jazyků včetně češtiny](https://qwenlm.github.io/blog/qwen3/). Čeština je deklarovaná autorem; kvalita odpovědí na konkrétním zařízení vyžaduje vlastní ověření.
- Orientačně **400 MB při prvním zapnutí**: MLC repozitář modelu uvádí přibližně 352 MB, navíc se načte WASM a JavaScript runtime. Jde o odhad, nikoli pevný síťový limit. Konfigurace WebLLM uvádí přibližně **1 925 MB VRAM**, další paměť potřebuje prohlížeč. Skutečné nároky i rychlost závisí na zařízení.
- Vyžaduje **HTTPS / secure context, WebGPU, dostupný GPU adapter a Web Worker**. Pro první ověření použij aktuální desktopový Chrome nebo Edge s podporovanou grafickou kartou. Jiné prohlížeče i mobily se řídí detekcí schopností; žádné zařízení není automaticky zaručené.
- Inferenci provádí WebLLM ve vlastním workeru. Model má kontext 4 096 tokenů, vypnutý thinking režim a strukturovaný JSON výstup. Pasáže mají společný limit 3 500 znaků, otázka 800 znaků a předchozí otázka 400 znaků.
- Modelové soubory se ukládají přes Cache API. Prohlížeč je může smazat nebo odmítnout uložit; další návštěva může vyžadovat nové stažení. Pro ruční smazání vymaž data webu v nastavení prohlížeče. **Vypnout AI** ukončí worker a uvolní výpočetní paměť, ale nemaže cache ani dosavadní zprávy. **Nový chat** smaže zprávy a předchozí otázku.

### Odpovědi a dohledatelné zdroje

MVP používá **výběr celých českých pasáží**, nikoli volnou generaci herních tvrzení. Nejprve lokálně najde až šest podkladů s českými tvary slov a aliasy GS, CP, runy, daily, weekly apod. Model potom vybere nejvýše tři ID pasáží, které odpovídají na otázku. Aplikace zobrazí původní text z indexu; nepřebírá volný text, HTML, URL ani čísla citací od modelu. Toto omezení brání nepodloženým výpočtům a zachovává negace i upozornění z článků. Model stále může vybrat méně vhodnou pasáž; odkaz umožňuje ověřit celý kontext.

Index se při `npm run build` vytvoří automaticky z hotového HTML článků, které vzniklo z Markdownu/MDX. Obsah se neudržuje podruhé. Obsahuje text odstavců, celé upozorňující boxy a tabulkové řádky s názvy sloupců. Zdrojová metadata pocházejí z frontmatter; skutečné kotvy jsou přečtené z publikovaných nadpisů a referenčních řádků. Bez kotvy se použije URL článku. Bloky nad 1 500 znaků se bezpečně vynechají, místo aby se uřízl důležitý dovětek; celý článek zůstává ve fulltextu Pagefind.

Při streamování se zobrazují jen dokončená, známá ID. Každá zobrazená pasáž má aplikací přidělenou citaci `[1]` a přehled **Kde se dozvědět více → Na wiki**. Neznámé ID nebo neplatný finální JSON skončí přiznáním chybějícího podkladu. Retrievalem nabídnuté, ale nevybrané pasáže se mezi použitými zdroji neobjeví. Numerace a URL nikdy nepocházejí z modelu. Testy kontrolují všechny cíle indexu proti hotovým stránkám i při GitHub Pages `base`.

**Původní podklady** ukazují omezený výběr externích zdrojů použitých článků, s názvem a regionem z `sources`. Jsou výslovně označené jako podklady celého článku, ne důkaz konkrétní věty: frontmatter dnes nemá spolehlivé přiřazení jednotlivých tvrzení k externím zdrojům. `Global`, `KR/TW` nebo `neurčeno` označuje scope zdroje, nikoli potvrzení každého tvrzení pro Global. Chat také uvádí datum rešerše a typ důkazů; komunitní přepis se nevydává za naše měření v klientu.

Odpověď bez relevantních podkladů nabízí běžné Pagefind hledání. Otázky ani odpovědi se neposílají do analytiky, logů či externí AI. Historie existuje jen v paměti stránky; pro návaznost se předává poslední otázka. Stažení modelu ovšem kontaktuje `huggingface.co` (včetně jeho CDN přesměrování) a `raw.githubusercontent.com`, kde jsou MLC WASM knihovny. Externí odkazy se otevřou teprve kliknutím uživatele a používají `noopener noreferrer`.

Projekt nepřidává CSP hlavičky (GitHub Pages je v této konfiguraci nenastavuje). Pokud doménu později chrání vlastní proxy s CSP, povol pouze skutečně potřebné originy modelových souborů a jejich pozorované CDN přesměrování v `connect-src`, vlastní bundlované skripty a worker a WebAssembly kompilaci (`'wasm-unsafe-eval'`). Nepřidávej plošné `connect-src *` ani `'unsafe-eval'`. Ověř CORS a chování konkrétní proxy.

### Ověření a omezení

```bash
npm run verify
npx playwright install chromium
npm run test:ui
```

Pro běh s vlastní doménou nebo podadresářem nastav `SITE_URL` a `BASE_PATH` stejně jako u buildu výše. `test:ui` spustí vlastní dočasný statický server nad hotovým `dist`; `BASE_PATH` musí odpovídat buildu. Volitelné `CHROMIUM_PATH` určuje již nainstalovaný Chromium. CI pro pull requesty kontroluje také prohlížečové scénáře pod projektovým `base`.

Automatické testy pokrývají skutečné kotvy, bezpečnost URL, neznámé citace, nenalezené téma, české aliasy, běžnou wiki bez AI downloadu, aktivaci, chyby adapteru/paměti, zrušení inicializace, Pagefind fallback, klávesnici, reset historie a mobilní světlé/tmavé rozložení. **Browser testy používají testovací náhradu modelu**; ověřují UI a tok dat, nikoli GPU inferenci nebo jazykovou kvalitu skutečného modelu. Typová kontrola a build navíc ověřují skutečný import WebLLM i worker bundle. Varování o velikosti lazy AI chunků je očekávané; tyto soubory nejsou součástí běžných článků.

Před sloučením/publikováním zbývá ruční test na zařízení se skutečným WebGPU: první download a jeho přerušení, opětovné načtení z cache, první spuštění offline, skutečná konverzace a relevance vybraných pasáží pro GS, CP, runy a Precision, selhání síťového hostingu a nároky na RAM/VRAM. Automatické testy tyto fyzické a síťové scénáře nepotvrzují. UI záměrně nenabízí samostatný příkaz Stop pro generování; vypnutí AI ukončí celý worker a případný výsledek označí jako neúplný.

## Struktura a publikování

| Cesta | Účel |
| --- | --- |
| `src/content/docs/` | Markdown a metadata článků. |
| `src/content.config.ts` | Schéma článků a zdrojů. |
| `src/lib/navigation.mjs` | Tematické skupiny, které sdílejí menu a úvod. |
| `src/lib/reference.ts` | Katalog, kontext tabulek, filtry a bezpečné zvýraznění. |
| `src/pages/reference-index.json.ts` | Statický index bez duplicitního vyhledávacího textu. |
| `src/pages/robots.txt.ts` | Sitemap podle domény a base. |
| `src/components/`, `src/styles/wiki.css` | Rozhraní a vzhled. |
| `scripts/`, `tests/` | Kontroly obsahu, kompatibility a rozhraní. |
| `docs/revize-v2.md` | Vlastníci informací, výsledky revize a zbývající úkoly. |
| `.github/workflows/` | CI pro oba režimy, GitHub Pages a kontrola zdrojů. |

V **Settings → Pages → Source** nastav **GitHub Actions**. Workflow Pages používá skutečnou doménu a base z `actions/configure-pages`; vlastní doména musí být nastavená v Pages. Po sloučení na `main` se spustí ověření a nasazení.

Repozitář: [oldbear24/tarot-club-aion2](https://github.com/oldbear24/tarot-club-aion2). Pravidla úprav: [CONTRIBUTING.md](CONTRIBUTING.md).

## Automatické náhledy PR

Otevření, opětovné otevření a každý nový commit do PR z větve tohoto repozitáře spustí **Náhled pull requestu**. Platí i pro draft PR. Workflow ověří a sestaví web se správným Pages base, například `/pr-preview/pr-2/`. Po úspěšném buildu důvěryhodný Pages workflow zveřejní produkci z aktuálního `main` společně s posledními úspěšnými náhledy otevřených PR.

Na vlastní doméně je náhled PR #2 na `https://aion2.tarot-club.cz/pr-preview/pr-2/`; při projektovém hostingu se automaticky přidá `/tarot-club-aion2/`. Odkaz se objeví v **Deployments** příslušného PR a ve výsledku Actions. Přehled je na `/pr-preview/`. Zavření nebo sloučení PR vyvolá nové nasazení bez jeho náhledu. Běžné nasazení `main` ostatní otevřené náhledy zachová.

Kód PR se sestavuje pouze s oprávněními pro čtení a bez sdílené zapisovatelné cache. Publisher vždy používá skripty z `main`, ověřuje původ artefaktů a rozbaluje statická data do vyhrazených podadresářů; nespouští kód náhledu. Náhledy z forků se automaticky nepublikují. HTML náhledů má `noindex,nofollow` a produkční robots.txt zakazuje jejich indexování.

Artefakty se uchovávají 90 dní, případně kratší dobu podle pravidel repozitáře. Pokud starý PR zůstane bez nového buildu a artefakt vyprší nebo ho někdo smaže, po příštím nasazení nebude jeho náhled dostupný; znovu spusť workflow nebo odešli další commit do PR. Při neúspěšném novém buildu zůstává poslední úspěšný náhled, dokud jeho artefakt existuje; přehled uvádí jeho commit.

Workflow pro publikování musí být v `main`, aby fungoval trigger `workflow_run`. Nové workflow se následně spustí při dalším commitu do již otevřeného PR. **Settings → Pages → Source** zůstává **GitHub Actions**; náhledy nevyžadují nový hosting, účet ani token uložený v secrets.

Neoficiální fanouškovský projekt. AION 2 a související značky patří NCSOFT. Repozitář neobsahuje převzaté herní obrázky ani plné kopie cizích průvodců.
