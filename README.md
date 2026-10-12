# Tarot Club — AION 2

Česká statická příručka pro AION 2 Global launch na [aion2.tarot-club.cz](https://aion2.tarot-club.cz/). Obsah a jeho zdroje zůstávají v Markdownu; Astro + Starlight vytváří statické stránky pro GitHub Pages.

## Obsah a orientace

- 62 obsahových stránek: rozvoj GS/CP, staty, osm tříd, výbava, výroba, ekonomika, aktivity a dungeonové mechaniky.
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
