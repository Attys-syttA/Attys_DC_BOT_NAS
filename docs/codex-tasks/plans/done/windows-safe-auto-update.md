Status: done / guarded Windows safe auto-update implemented

## Kapcsolodo jelenlegi helyzet

- A Windows desktop lifecycle panel mar mutat verziot, local/upstream commitot es clean/dirty/ahead/behind allapotot.
- A user jelezte, hogy a botot es Discord szervert csak o hasznalja, ezert a kenyelmes update flow elfogadhato, ha a lokalis munka nincs veszelyben.

## Elkeszult reszek

- A tray panel `Safe Update` gombot kapott.
- A gomb csak akkor aktiv, ha a repo clean, behind origin, es nem diverged.
- A safe update sorrend:
  - `git fetch --prune origin`;
  - dirty/diverged guard;
  - `git pull --ff-only`;
  - `npm install`, csak ha `package.json` vagy `package-lock.json` valtozott;
  - `npm run build`;
  - `npm run check`;
  - futo bot eseten bot restart.
- A folyamat helyi, ignored `update.log` fajlba ir public-safe statuszt.
- A flow nem futtat `git stash`, `git reset --hard`, history rewrite vagy destruktiv recovery muveletet.
- README, SETUP, STATE es CHANGELOG frissult.

## Nyitott reszek

- Destruktiv recovery mod csak kulon dontessel johet: explicit confirmation kellene `git stash` vagy `git reset --hard` elott.
- Cross-platform update parity csak akkor indokolt, ha a projekt mar nem Windows-first.

# Windows safe auto-update closeout

Ez a szelet a referencia repo desktop update vonalat koveti, de Windows-first es local-safety modon. A cel nem az volt, hogy minden korulmeny kozott magatol frissitsen, hanem hogy clean checkout eseten kenyelmesen tudjon frissiteni, dirty checkout eseten pedig megalljon.
