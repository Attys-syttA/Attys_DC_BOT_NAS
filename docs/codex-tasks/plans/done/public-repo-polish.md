Status: done / public repo polish implemented

## Kapcsolodo jelenlegi helyzet

- A referencia repo public-facing csomagja tartalmaz issue template-eket, public setup asseteket es end-user dokumentaciot.
- A mi repo Windows-first, ezert a public polish a Windows launcher/tray/update/security support vonalat erositi, nem cross-platform marketinget.

## Elkeszult reszek

- Bug report es feature request GitHub issue template keszult public-safe mezokkel.
- Pull request template keszult validacios es secret-hygiene checklisttel.
- `docs/RELEASE_CHECKLIST.md` bekerult Windows smoke, tray smoke, secret scan es safe update release gate-ekkel.
- `docs/PUBLIC_SUPPORT.md` bekerult public-safe issue/support iranyelvekkel.
- README es SETUP hivatkozik a public support/release checklist dokumentumokra.

## Nyitott reszek

- Tovabbi real screenshot csak scrubbed vagy synthetic formaban kerulhet be.
- Cross-platform public docs csak akkor indokoltak, ha a projekt mar nem Windows-first.
