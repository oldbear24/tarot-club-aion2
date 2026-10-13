# Tarot Club — AION 2

Česká statická příručka pro AION 2 Global launch na [aion2.tarot-club.cz](https://aion2.tarot-club.cz/). Obsah a jeho zdroje zůstávají v Markdownu; Astro + Starlight vytváří statické stránky pro GitHub Pages.

## Obsah a orientace

- 69 stránek včetně Tarot AI: rozvoj GS/CP, staty, osm tříd, výbava, výroba, ekonomika, aktivity, PvP, servery a přesun postav, pravidla NC a dungeonové mechaniky.
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

V navigaci zvol **Zeptat se AI**. AI je volitelná; běžné články nenačítají její JavaScript ani model. Na AI stránce se runtime a worker načtou až při odeslání první otázky, a to jen pokud retrieval ve wiki najde podklady. Poprvé se chat v dialogu zeptá, zda smí stáhnout model (cca 2,8 GB). Souhlas se uloží do `localStorage` (`tarot-ai-download-consent`, hodnota podle modelu, takže po změně modelu se zeptá znovu) a další otázky už model načítají bez ptaní. Odmítnutí se neukládá. Najednou běží vždy jen jeden dotaz: během stahování a odpovědi je odeslání zablokované a tlačítko **Zastavit** dotaz ukončí. Stav i průběh stahování se ukazují přímo v bublině odpovědi. Chat nemá účet, API klíč, serverovou inferenci ani cloudový fallback.

### Runtime a model

- Jediný runtime: `@mlc-ai/web-llm` **0.2.86**, kvantizovaný model **Gemma 4 E2B** (instrukční varianta `gemma-4-E2B-it`). Pokud GPU adapter nabízí `shader-f16`, použije se **`gemma-4-E2B-it-q4f16_1-MLC`**, jinak **`gemma-4-E2B-it-q4f32_1-MLC`**. Identifikátory, adresy modelů i kompatibilní WASM pocházejí z `prebuiltAppConfig` této přesně připnuté verze. Test kontroluje přítomnost obou variant v této konfiguraci.
- Licence původního modelu: **Apache 2.0**. [Model card](https://huggingface.co/google/gemma-4-E2B-it), MLC distribuce [f16](https://huggingface.co/mlc-ai/gemma-4-E2B-it-q4f16_1-MLC) a [f32](https://huggingface.co/mlc-ai/gemma-4-E2B-it-q4f32_1-MLC). Model byl vybrán srovnáním s Qwen3 1.7B, Qwen3 4B, Qwen3.5 2B a Qwen3.5 4B na sedmi českých otázkách se stejným promptem a pasážemi (llama.cpp, Q4_K_M, CPU). Jako jediný se držel podkladů, správně citoval a na otázky, na které wiki neodpovídá, vrátil `NEVÍM`. Čeština je místy strohá. Kvalitu kvantizace MLC na konkrétním zařízení je potřeba ověřit ručně.
- Orientačně **2,8 GB při prvním zapnutí**: váhy modelu mají podle `tensor-cache.json` přibližně 2,8 GB, navíc se načte WASM a JavaScript runtime. Jde o odhad, nikoli pevný síťový limit. Konfigurace WebLLM uvádí přibližně **3 390 MB VRAM** (f16) nebo **3 860 MB VRAM** (f32), další paměť potřebuje prohlížeč. Na mobilu a slabších noteboocích nemusí model běžet. Skutečné nároky i rychlost závisí na zařízení.
- Vyžaduje **HTTPS / secure context, WebGPU, dostupný GPU adapter a Web Worker**. Pro první ověření použij aktuální desktopový Chrome nebo Edge s podporovanou grafickou kartou. Jiné prohlížeče i mobily se řídí detekcí schopností; žádné zařízení není automaticky zaručené.
- Inferenci provádí WebLLM ve vlastním workeru. Model má kontext 4 096 tokenů. Pasáže mají společný limit 3 500 znaků, otázka 800 znaků a předchozí otázka 400 znaků.
- Odpověď vzniká jedním voláním modelu (nejvýše 400 tokenů, `temperature` 0,3, `top_p` 0,8, `presence_penalty` 0,5). Aplikace neposílá `enable_thinking`: WebLLM by pak do odpovědi vložil prázdný blok `<think>` určený pro Qwen. Gemma přemýšlí jen na výslovný pokyn v systémovém promptu.
- Modelové soubory se ukládají přes Cache API. Prohlížeč je může smazat nebo odmítnout uložit; další návštěva může vyžadovat nové stažení. Pro ruční smazání vymaž data webu v nastavení prohlížeče. **Vypnout AI** ukončí worker a uvolní výpočetní paměť, ale nemaže cache ani dosavadní zprávy. **Nový chat** smaže zprávy a předchozí otázku.

### Odpovědi a dohledatelné zdroje

Chat odpovídá **krátkým vlastním textem modelu, podloženým jen nalezenými pasážemi**. Nejprve lokálně najde až šest podkladů s českými tvary slov a aliasy GS, CP, runy, daily, weekly apod. Běžná slova z konverzace („bys“, „kvůli“, „doporučil“…) se při hledání ignorují. Navazující otázka („A jaké…“, „kvůli tomu“) se hledá společně s předchozí otázkou; když spolu nic nenajdou, hledá se samostatně. Model je dostane očíslované (`[1]`…`[6]`) bez URL a napíše nejvýše čtyři věty s odkazy `[n]` za tvrzeními. Pokud podklady na otázku neodpovídají, vrátí `NEVÍM` a chat nabídne vyhledávání. Malý model se v češtině může splést nebo pasáž zkreslit, proto je každé tvrzení odkázané na pasáž wiki a dialog souhlasu na to upozorňuje.

Index se při `npm run build` vytvoří automaticky z hotového HTML článků, které vzniklo z Markdownu/MDX. Obsah se neudržuje podruhé. Obsahuje text odstavců, celé upozorňující boxy a tabulkové řádky s názvy sloupců. Zdrojová metadata pocházejí z frontmatter; skutečné kotvy jsou přečtené z publikovaných nadpisů a referenčních řádků. Bez kotvy se použije URL článku. Bloky nad 1 500 znaků se bezpečně vynechají, místo aby se uřízl důležitý dovětek; celý článek zůstává ve fulltextu Pagefind.

Text modelu se vykresluje jen jako prostý text (bez HTML a Markdownu). Odkazem se stane jen číslo, které odpovídá nabídnuté pasáži; neznámá čísla se zahodí a nedopsaná citace se během streamování nezobrazí. Aplikace citace přečísluje podle prvního použití a pod odpovědí ukáže kompaktní řádek **Zdroje** s odkazy na konkrétní sekce wiki (typ důkazů a datum rešerše jsou v popisku odkazu). Když model odpoví bez platné citace, chat místo zdrojů nabídne nalezené články s upozorněním „AI neuvedla zdroj“. URL nikdy nepocházejí z modelu. Testy kontrolují všechny cíle indexu proti hotovým stránkám i při GitHub Pages `base`.


Odpověď bez relevantních podkladů nabízí běžné Pagefind hledání. Otázky ani odpovědi se neposílají do analytiky, logů či externí AI. Historie existuje jen v paměti stránky; pro návaznost se předává poslední otázka. Stažení modelu ovšem kontaktuje `huggingface.co` (včetně jeho CDN přesměrování) a `raw.githubusercontent.com`, kde jsou MLC WASM knihovny. Externí odkazy se otevřou teprve kliknutím uživatele a používají `noopener noreferrer`.

Projekt nepřidává CSP hlavičky (GitHub Pages je v této konfiguraci nenastavuje). Pokud doménu později chrání vlastní proxy s CSP, povol pouze skutečně potřebné originy modelových souborů a jejich pozorované CDN přesměrování v `connect-src`, vlastní bundlované skripty a worker a WebAssembly kompilaci (`'wasm-unsafe-eval'`). Nepřidávej plošné `connect-src *` ani `'unsafe-eval'`. Ověř CORS a chování konkrétní proxy.

### Ověření a omezení

```bash
npm run verify
npx playwright install chromium
npm run test:ui
```

Pro běh s vlastní doménou nebo podadresářem nastav `SITE_URL` a `BASE_PATH` stejně jako u buildu výše. `test:ui` spustí vlastní dočasný statický server nad hotovým `dist`; `BASE_PATH` musí odpovídat buildu. Volitelné `CHROMIUM_PATH` určuje již nainstalovaný Chromium. CI pro pull requesty kontroluje také prohlížečové scénáře pod projektovým `base`.

Automatické testy pokrývají skutečné kotvy, bezpečnost URL, neznámé a nedopsané citace, odpověď bez citace, `NEVÍM`, nenalezené téma, české aliasy, běžnou wiki bez AI downloadu, aktivaci, chyby adapteru/paměti, zrušení inicializace, Pagefind fallback, klávesnici, reset historie a mobilní světlé/tmavé rozložení. **Browser testy používají testovací náhradu modelu**; ověřují UI a tok dat, nikoli GPU inferenci nebo jazykovou kvalitu skutečného modelu. Typová kontrola a build navíc ověřují skutečný import WebLLM i worker bundle. Varování o velikosti lazy AI chunků je očekávané; tyto soubory nejsou součástí běžných článků.

Před sloučením/publikováním zbývá ruční test na zařízení se skutečným WebGPU: první download a jeho přerušení, opětovné načtení z cache, první spuštění offline, skutečná konverzace, kvalita české odpovědi a přesnost citací pro GS, CP, runy a Precision, selhání síťového hostingu a nároky na RAM/VRAM. Automatické testy tyto fyzické a síťové scénáře nepotvrzují. Tlačítko **Zastavit** ukončí celý worker a rozepsanou odpověď označí jako neúplnou.

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

Workflow pro publikování musí být v `main`, aby fungoval trigger `workflow_run`. Důvěryhodný workflow **Vyžádání nasazení wiki a náhledů** po úspěšném náhledovém buildu, commitu do `main` nebo zavření PR požádá přes `workflow_dispatch` o Pages nasazení z `main`; samotný deployment tak odpovídá pravidlům prostředí `github-pages`. Nové workflow se následně spustí při dalším commitu do již otevřeného PR. **Settings → Pages → Source** zůstává **GitHub Actions**; náhledy nevyžadují nový hosting, účet ani token uložený v secrets.

Neoficiální fanouškovský projekt. AION 2 a související značky patří NCSOFT. Repozitář neobsahuje převzaté herní obrázky ani plné kopie cizích průvodců.
