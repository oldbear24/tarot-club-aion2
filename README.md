# Tarot Club — AION 2

Česká statická wiki pro globální launch AION 2. Obsah žije v Markdownu, vzhled a navigaci poskytuje Astro + Starlight. Výsledkem jsou statické soubory určené pro GitHub Pages.

## Aktuální obsah

- 62 českých obsahových stránek: úvod, šest průvodců staty, patnáct praktických průvodců, osmnáct referenčních stránek, devět stránek tříd, devět dungeonových stránek a čtyři stránky o wiki.
- Vlastní tarotový motiv, české UI, mobilní navigace, světlý/tmavý režim.
- Fulltextové vyhledávání Pagefind bez backendu.
- Každý článek má cílovou edici, datum rešerše, typ podkladů a zdroje.
- GS a CP progrese, otevřený svět, Abyss, daily/weekly s prioritami, limity a odlišením Global od neotevřeného obsahu.
- Runy/pás/amulet, Enhancement a Transfer, Arcana, Daevanion, Specialty/Stigma, dungeonové odměny a Nightmare; úvod odkazuje na všech 61 tematických článků.
- Referenční hledání podle názvu, významu a aliasu s filtry a odkazy na konkrétní řádky; hesla se při sestavení odvozují přímo z Markdown tabulek.
- Katalog 148 statů, měny, materiály, obchody, aktivity, crafting/gathering, kolekce, storage, Market a legie.
- Osm class příruček a bossové tabulky šesti Expeditions, obou Transcendence dungeonů a historického kontextu Ludry.
- Workflow pro ověření pull requestů a nasazení na GitHub Pages.

Repozitář: [oldbear24/tarot-club-aion2](https://github.com/oldbear24/tarot-club-aion2). Živý web je dostupný až po zapnutí GitHub Pages a úspěšném nasazení.

Herní slovník čerpá z komunitních přepisů tooltipů/dat. Globální serverové vzorce nebyly vlastními testy ověřeny. KR/TW limity, cílové staty bossů a endgame váhy se nevydávají za potvrzená čísla Global. Detaily: `src/content/docs/wiki/global.md` a `src/content/docs/staty/limity.md`.

## Lokální spuštění

Použij Node.js 24 (minimum frameworku 22.12) a npm:

```bash
npm ci
npm run dev
```

Produkční kontrola včetně vyhledávání:

```bash
npm run verify
npm run preview
```

Bez proměnných prostředí funguje lokální web v kořeni `/`. Pro ověření podadresáře Pages:

```bash
SITE_URL=https://oldbear24.github.io BASE_PATH=/tarot-club-aion2/ npm run verify
```

PowerShell:

```powershell
$env:SITE_URL = 'https://oldbear24.github.io'
$env:BASE_PATH = '/tarot-club-aion2/'
npm run verify
npm run preview
```

## První nasazení na GitHub

1. Otevři **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Spusť workflow **Nasazení na GitHub Pages** nebo odešli další commit na `main`.
3. Počkej na úspěšný build a deploy. Skutečná URL bude ve výsledku jobu `deploy`.

Při běžném projektovém hostingu pod účtem `oldbear24` je očekávaná adresa `https://oldbear24.github.io/tarot-club-aion2/`; není to potvrzení dokončeného nasazení.

Pro lokální práci naklonuj zdroje:

```bash
git clone https://github.com/oldbear24/tarot-club-aion2.git
cd tarot-club-aion2
npm ci
npm run dev
```

## Struktura

| Cesta | Účel |
| --- | --- |
| `src/content/docs/` | Veškerý obsah a metadata článků v `.md`. |
| `src/content.config.ts` | Povinné schéma článků a zdrojů. |
| `src/components/` | Úvod, metadata a seznamy zdrojů. |
| `src/styles/wiki.css` | Vzhled a responzivní pravidla. |
| `public/` | Vlastní SVG emblém a favicon. |
| `scripts/verify-build.mjs` | Kontrola hotového HTML a odkazů. |
| `.github/workflows/` | CI a GitHub Pages. |
| `dist/` | Generovaný web, neukládá se do Gitu. |

Technologické porovnání: `src/content/docs/wiki/technologie.md`. Pravidla psaní: [CONTRIBUTING.md](CONTRIBUTING.md).

## Zdroje

- [Starlight](https://starlight.astro.build/)
- [VitePress](https://vitepress.dev/)
- [MkDocs](https://www.mkdocs.org/)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Neoficiální fanouškovský projekt. AION 2 a související značky patří NCSOFT. Repozitář neobsahuje převzaté herní obrázky ani kompletní kopie cizích průvodců.
