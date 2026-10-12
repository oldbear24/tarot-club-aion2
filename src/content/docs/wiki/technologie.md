---
title: Technologie a hosting
description: Proč Astro se Starlightem a jak wiki funguje na GitHub Pages.
sidebar:
  order: 4
edition: global-launch
reviewedAt: '2026-10-12'
evidence: editorial
sources:
  - title: Astro Starlight — funkce a podporované formáty
    url: https://starlight.astro.build/
    scope: technical
  - title: Starlight — statické vyhledávání Pagefind
    url: https://starlight.astro.build/guides/site-search/
    scope: technical
  - title: VitePress — oficiální dokumentace
    url: https://vitepress.dev/
    scope: technical
  - title: MkDocs — oficiální dokumentace
    url: https://www.mkdocs.org/
    scope: technical
  - title: GitHub Pages — vlastní workflow
    url: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
    scope: technical
---

## Výsledek průzkumu

Pro Tarot Club jsme zvolili **Astro + Starlight**. Články zůstávají v `.md`, při sestavení vznikají statické stránky a hosting obstará **GitHub Pages**. Herní obsah nevyžaduje běžící server ani databázi.

## Porovnané možnosti

Následující hodnocení je naše rozhodnutí pro tuto wiki, nikoli obecný žebříček frameworků.

| Technologie | Co poskytuje | Hodnocení pro Tarot Club |
| --- | --- | --- |
| **Astro + Starlight** | Markdown, navigace, lokalizace, světlý/tmavý režim a rozšiřitelné komponenty. | Vybráno: hotový základ dokumentace a prostor pro vlastní herní vzhled. |
| **VitePress** | Statický generátor nad Vite/Vue, Markdown a možnost Vue komponent. | Dobrá alternativa, zvlášť pro tým používající Vue. |
| **MkDocs** | Markdown a YAML konfigurace, statický výstup, výběr témat. | Dobrá alternativa pro Python workflow; pro tento projekt chceme komponenty Astro. |

## Co dostane čtenář

- České rozhraní a anglické názvy statů ze hry.
- Navigaci mezi tématy a obsah aktuálního článku.
- Výběr světlého nebo tmavého režimu.
- Fulltextové vyhledávání **Pagefind** nad sestavenými stránkami, bez vyhledávacího serveru.
- Zdrojové odkazy a datum rešerše každého článku.

Vyhledávání se generuje při produkčním buildu. Pro jeho lokální kontrolu použij `npm run build` a `npm run preview`; v běžném dev režimu nemusí být dostupné.

## Cesta od editace k webu

1. Autor upraví `.md` soubor a odešle změnu.
2. Pull request spustí kontrolu sestavení.
3. Změna na `main` spustí workflow GitHub Pages.
4. Workflow sestaví HTML, CSS, JavaScript a vyhledávací index.
5. GitHub zveřejní hotové soubory.

Workflow je připravené v repozitáři `oldbear24/tarot-club-aion2`. Hosting musí mít v **Settings → Pages → Source** zvolenou možnost **GitHub Actions**. Živý web vznikne po prvním úspěšném nasazení.

## Provoz a rozšíření

Zdrojový obsah je verzovaný v Gitu. Přispívat lze přes pull requesty a Markdown lze číst i samostatně na GitHubu. Vlastní doména je pozdější volba; výchozí konfigurace míří na projektový podadresář Pages.

Pokud přibude kalkulačka nebo filtr statů, může běžet jako klientská komponenta. Sdílené uživatelské účty a databáze představují další projektový požadavek; v této statické verzi nejsou potřeba.
