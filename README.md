# Tarot Club — AION 2

Česká statická wiki pro globální launch AION 2. Obsah žije v Markdownu, vzhled a navigaci poskytuje Astro + Starlight. Výsledkem jsou statické soubory určené pro GitHub Pages.

## Stav prvního vydání

- 14 českých obsahových stránek: úvod, šest průvodců staty, tři praktické průvodce a čtyři stránky o wiki.
- Vlastní tarotový motiv, české UI, mobilní navigace, světlý/tmavý režim.
- Fulltextové vyhledávání Pagefind bez backendu.
- Každý článek má cílovou edici, datum rešerše, typ podkladů a zdroje.
- Workflow pro ověření pull requestů a nasazení na GitHub Pages.

**Vzdálený GitHub repozitář a živý web nejsou tímto README deklarovány jako založené.** Místní projekt je připraven k nahrání a prvotnímu nasazení.

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

1. Vytvoř repozitář `tarot-club-aion2` a nahraj projekt na větev `main`.
2. Otevři **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Spusť workflow **Nasazení na GitHub Pages** nebo odešli další commit na `main`.
4. Počkej na úspěšný build a deploy. Skutečná URL bude ve výsledku jobu `deploy`.

Při běžném projektovém hostingu pod účtem `oldbear24` je očekávaná adresa `https://oldbear24.github.io/tarot-club-aion2/`; není to potvrzení dokončeného nasazení.

Pro GitHub Free použij veřejný repozitář. Soukromé repozitáře s Pages vyžadují podporovaný placený plán. Veřejnou viditelnost zdrojů zvol vědomě při zakládání.

Pokud používáš autentizovaný GitHub CLI a místní Git repozitář:

```bash
gh repo create tarot-club-aion2 --public --source=. --remote=origin --push
```

Pokud jsi rozbalil ZIP zdrojů, nejprve inicializuj Git a vytvoř commit. ZIP nemusí obsahovat adresář `.git`.

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
