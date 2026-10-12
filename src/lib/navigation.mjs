// Navigation groups describe subjects, never storage directories. Slugs stay public.
export const sidebar = [
  { label: 'Úvod', slug: '' },
  { label: 'Zeptat se AI', slug: 'ai' },
  { label: 'Hledání a slovník', items: [
    { slug: 'reference/prehled' }, { slug: 'reference/slovnik' },
  ] },
  { label: 'Začínáme a rozvoj', items: [
    { slug: 'pruvodce/zacatek' }, { slug: 'pruvodce/gs-progrese' }, { slug: 'pruvodce/cp-postava' },
    { slug: 'pruvodce/daevanion' }, { slug: 'pruvodce/arcana' }, { slug: 'pruvodce/schopnosti-stigma' },
    { slug: 'reference/pets' }, { slug: 'reference/wings' }, { slug: 'reference/tituly-kolekce' },
  ] },
  { label: 'Staty a boj', collapsed: true, items: [
    { slug: 'staty/zakladni' }, { slug: 'staty/utok' }, { slug: 'staty/obrana' },
    { slug: 'staty/procy' }, { slug: 'staty/pantheon' }, { slug: 'reference/staty' },
    { slug: 'staty/limity' }, { slug: 'reference/stagger' }, { slug: 'reference/stavove-efekty' },
    { slug: 'pruvodce/lepsi-damage' },
  ] },
  { label: 'Třídy', collapsed: true, items: [
    { slug: 'tridy/prehled' }, { slug: 'tridy/gladiator' }, { slug: 'tridy/templar' },
    { slug: 'tridy/assassin' }, { slug: 'tridy/ranger' }, { slug: 'tridy/sorcerer' },
    { slug: 'tridy/spiritmaster' }, { slug: 'tridy/cleric' }, { slug: 'tridy/chanter' },
  ] },
  { label: 'Výbava, předměty a výroba', collapsed: true, items: [
    { slug: 'pruvodce/vybava' }, { slug: 'pruvodce/vylepsovani-vybavy' }, { slug: 'pruvodce/runy-specialni-sloty' },
    { slug: 'reference/kameny' }, { slug: 'reference/materialy' }, { slug: 'reference/crafting' }, { slug: 'reference/gathering' },
  ] },
  { label: 'Aktivity a otevřený svět', collapsed: true, items: [
    { slug: 'pruvodce/daily-weekly' }, { slug: 'reference/aktivity' }, { slug: 'pruvodce/otevreny-svet' },
    { slug: 'pruvodce/abyss' }, { slug: 'pruvodce/nightmare' },
  ] },
  { label: 'Dungeony', collapsed: true, items: [
    { slug: 'dungeony/prehled' }, { slug: 'pruvodce/dungeony-odyle' },
    { slug: 'dungeony/krao-cave' }, { slug: 'dungeony/draupnir' }, { slug: 'dungeony/urugugu-canyon' },
    { slug: 'dungeony/vakron-sky-island' }, { slug: 'dungeony/fire-temple' }, { slug: 'dungeony/ferocious-horn-den' },
    { slug: 'dungeony/transcendence' }, { slug: 'dungeony/ludra' },
  ] },
  { label: 'Ekonomika a účet', collapsed: true, items: [
    { slug: 'reference/meny' }, { slug: 'reference/obchody' }, { slug: 'reference/market' },
    { slug: 'reference/inventar' }, { slug: 'reference/legie' },
  ] },
  { label: 'O wiki', collapsed: true, items: [
    { slug: 'wiki/global' }, { slug: 'wiki/zdroje' }, { slug: 'wiki/prispivani' }, { slug: 'wiki/technologie' },
  ] },
];
