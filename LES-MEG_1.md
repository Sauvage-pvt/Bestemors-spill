# Spillebordet

Fem spill for iPhone, uten reklame, uten sporing og uten nettverkskall.
Kabal · Memory · Sudoku · Ordsøk · Fargesortering.

## Filer

```
index.html            hele appen (HTML + CSS + JS i én fil)
manifest.webmanifest  gjør at den kan legges på hjem-skjermen
sw.js                 offline-cache
icon-180.png          hjem-skjerm-ikon (iOS)
icon-192.png
icon-512.png
```

## Legg ut på Cloudflare Pages

Fra GitHub (anbefalt — deployer automatisk ved hver push):

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → **Connect to Git**.
2. Velg repoet, produksjonsgren `main`.
3. Framework preset: **None**. Build command: **la stå tom**.
4. Build output directory: `/` hvis `index.html` ligger i rota, ellers mappenavnet.
5. Save and Deploy.

Uten GitHub: samme meny, men velg **Upload assets** og dra inn mappen.

Ingen build-kommando, ingen framework — det er ren statisk HTML.

## Legg appen på bestemors hjem-skjerm

Gjør dette **én gang** på telefonen hennes, i **Safari** (ikke Chrome — Chrome på iOS
kan ikke legge til apper på hjem-skjermen):

1. Åpne adressen i Safari.
2. Trykk Del-knappen (firkanten med pil opp, nederst).
3. Velg **Legg til på Hjem-skjerm**.
4. Trykk **Legg til**.

Nå ligger den som et ikon sammen med de andre appene, åpner i fullskjerm uten
nettleserlinje, og virker uten dekning etter første gangs åpning.

## Endre noe senere

All koden ligger i `index.html`. Push til `main`, så deployer Cloudflare Pages
automatisk, og telefonen henter den nye utgaven neste gang appen åpnes.
Du trenger ikke røre `sw.js`.

Slik virker offline-cachen: `index.html` hentes fra nett først, med tre sekunders
tålmodighet. Svarer ikke nettet innen da, serveres siste lagrede utgave. Ikoner og
manifest kommer fra cachen og oppdateres stille i bakgrunnen.

Det ene tilfellet der du må øke `CACHE`-navnet i `sw.js` (`spillebordet-v2` → `v3`)
er hvis du bytter ut ikonfilene og vil ha de nye fram med én gang.

## Hvor ting ligger i koden

| Del | Søk etter |
|---|---|
| Farger og typografi | `:root{` øverst i `<style>` |
| Menyen og spillisten | `var GAMES=[` |
| Kabal | `START.kabal` |
| Memory (motiver, nivåer) | `START.memory` — `POOL` og `SIZES` |
| Sudoku (vanskelighetsgrad) | `START.sudoku` — `LV` |
| Ordsøk (ordlister) | `START.ord` — `CATS` |
| Ordsøk (rutestørrelse, bokstavstørrelse) | `START.ord` — `LV` |
| Fargesortering | `START.farge` — `LV` og `COL` |

Ordsøk har tre brettstørrelser i `LV`: `n` = ruter per rad, `k` = antall ord,
`f` = bokstavstørrelse i piksler, `d` = tillatte retninger.
Det letteste nivået (7×7) har bare vannrett og loddrett — ingen skrå ord.

Vil du legge til flere ord i `CATS`, husk at ord må være korte nok til å få plass
på det minste brettet de brukes på — ord lengre enn `n` bokstaver hoppes over
automatisk, så hver kategori bør ha minst 5 ord på 7 bokstaver eller mindre.
