Status: done / Windows desktop lifecycle implemented

## Kapcsolodo jelenlegi helyzet

- A Windows-first minimum parity csomag kesz: `win-start.bat`, `tray/CodexBotTray.cs`, usage panel, README/SETUP es public-safe illusztracio bekerult.
- A `chadingTV/codex-discord` referenciahoz kepest a core Discord `src/` oldal nalunk nem lemaradas, hanem bovebb: plusz operator parancsok, safety gate-ek, tesztek, preflight es plan-check van.
- A desktop lifecycle szelet implementalva es validalva van a tray panelben.

## Elkeszult reszek

- Windows launcher/status smoke validalt: `Stopped -> start -> Running -> stop -> Stopped`.
- Windows tray/control panel buildelheto es mukodik alapszintu operatori vezerlesre.
- Public docs jelzik, hogy az auto-update es cross-platform parity kulon future-work.
- A tray panel megjeleniti a package verziot, local commitot, upstream commitot, clean/dirty/ahead/behind allapotot.
- A `Check Updates` csak `git fetch --prune origin` muveletet vegez, es nem modositja a working tree-t.
- A panel tud Windows login startup shortcutot letrehozni es torolni a user Startup folderben.
- A README es SETUP frissult a lifecycle panel mukodesevel.

## Nyitott reszek

- Tenyleges auto-update flow kulon `safe auto-update` tervben.
- Cross-platform launcher/tray parity csak akkor, ha a projekt mar nem Windows-first.
- A terv lezart, `done` ala kerul.

# Windows desktop lifecycle / update-readiness closeout

## Cel

Egy nagy, onalloan vegrehajthato Windows-first fejlesztesi szelet keszuljon, amely a tray/control panelt operatori lifecycle kozpontta boviti, de meg nem vegez automatikus update-et. Ez nem vegleges tiltast jelent, hanem lepcsozetes bevezetesi sorrendet: elobb legyen stabil read-only allapotkep, utana johet kulon `safe auto-update` szelet.

A vegrehajtas kozben csak akkor kell megallni, ha:

- GitHub/origin elerese nem mukodik es emiatt nem dontheto el az update-readiness viselkedes;
- Windows autostart bejegyzes letrehozasa/torlese jogosultsagi hibat ad, amit nem lehet user nelkul megoldani;
- a user a mostani read-only update-readiness szelet helyett azonnal teljes auto-update-et ker;
- vagy minden implementacio, validacio es dokumentacio kesz.

## Szakasz 1: lifecycle adatmodell es git/origin ellenorzes

Cel: a tray panel olyan adatokat kapjon, amelyekbol egy nem programozo operator is latja, mennyire friss es mennyire biztonsagos a lokalis checkout.

Implementalando viselkedes:

- A tray panel olvassa ki a lokalis app verziot a `package.json` `version` mezojebol.
- A tray panel jelenitse meg a lokalis `HEAD` rovid commit hash-t.
- A tray panel probalja meghatarozni az upstream agat:
  - elsodleges: `git rev-parse --abbrev-ref --symbolic-full-name @{u}`;
  - ha nincs upstream: `origin/main` fallback csak read-only osszeveteshez.
- A tray panel futtasson read-only git ellenorzeseket:
  - `git status --short --branch`;
  - `git rev-list --left-right --count <upstream>...HEAD`;
  - `git rev-parse --short HEAD`;
  - `git rev-parse --short <upstream>`.
- A panel kulon jelezze:
  - `Clean and synced`;
  - `Local changes present`;
  - `Ahead of origin`;
  - `Behind origin`;
  - `Diverged`;
  - `No upstream configured`;
  - `Git unavailable`.
- A status szovegek ne tartalmazzanak tokeneket, lokalis privat pathokat vagy raw remote credential URL-t.
- A git parancsok timeouttal fussanak, hogy a tray ne fagyjon be.

Elfogadas:

- Clean repo eseten a panel `Clean and synced` vagy ezzel egyenerteku allapotot mutat.
- Lokalis modositott fajl eseten a panel nem ajanl update-et automatikusan, hanem `Local changes present` allapotot mutat.
- Behind origin esetben a panel jelzi, hogy elerheto frissebb kod, de ebben a szeletben meg nem futtat `pull`, `reset`, `stash` vagy `npm install` muveletet.

## Szakasz 2: read-only update-readiness UI

Cel: a referencia repo auto-update kepessegebol csak a biztonsagos operatori dontest tamogato resz keruljon at.

Implementalando UI elemek a `tray/CodexBotTray.cs` panelen:

- `Version` sor:
  - package version;
  - local commit;
  - upstream commit, ha elerheto.
- `Repository` sor:
  - clean/dirty;
  - ahead/behind/diverged;
  - upstream nev.
- `Check for Updates` gomb:
  - git fetch-et vegezhet, mert read-only remote metadata frissites;
  - nem modosit working tree-t;
  - utana frissiti az ahead/behind allapotot.
- `Open GitHub` gomb:
  - `https://github.com/Attys-syttA/Attys_DC_BOT`
- `Open Releases` gomb:
  - `https://github.com/Attys-syttA/Attys_DC_BOT/releases`
- `Open Setup` gomb:
  - GitHub README/SETUP oldal vagy lokalis `SETUP.md` megnyitasa; default: lokalis `SETUP.md`, mert offline is mukodik.

Ebben a szeletben kifejezetten nem resze a megvalositasnak:

- `git reset --hard`;
- `git stash`;
- `git pull`;
- `npm install`;
- `npm rebuild`;
- automatikus tray/bot restart update miatt;
- barmilyen repo history atiras.

Indoklas:

- A botot es a Discord szervert csak a tulajdonos hasznalja, ezert kesobb lehet laza, kenyelmes auto-update policy.
- A mostani szelet megis read-only marad, mert elobb bizonyitani kell, hogy a panel helyesen latja a clean/dirty/ahead/behind allapotot.
- A fenti muveletek nem orokre tiltottak, csak ebben a read-only update-readiness fázisban vannak scope-on kivul.

Elfogadas:

- A panelbol lathato, hogy van-e frissebb origin commit.
- Dirty working tree eseten a panel nem indit update muveletet.
- A gombok hiba eseten emberi nyelvu, rovid hibauzenetet adnak, nem crash-elnek.

## Szakasz 3: Windows autostart toggle

Cel: az operator el tudja donteni, induljon-e a tray/bot Windows login utan.

Implementalando viselkedes:

- A panel kapjon `Launch on Windows login` checkboxot vagy gombot.
- A beallitas a Windows user Startup folderbe kerulo shortcuttal tortenjen, ne registry-vel.
- Shortcut cel:
  - `win-start.bat`
  - working directory: repo root
- A panel tudja:
  - felismerni, hogy az autostart shortcut letezik-e;
  - letrehozni;
  - torolni.
- Ha shortcut letrehozasa nem tamogatott a helyi Windows kornyezetben, fallback:
  - nyissa meg a Startup foldert;
  - jelenitsen meg pontos, de secret-mentes utasitast.

Elfogadas:

- Autostart bekapcsolas utan a Startup folderben megjelenik az `Attys DC BOT` shortcut.
- Kikapcsolas utan eltunik.
- A repo nem trackel `.lnk` fajlt.

## Szakasz 4: docs, safety policy es closeout

Cel: a user es a kesobbi Codex futasok egyertelmuen lassak, mi keszult el es mit nem szabad osszekeverni az auto-update-tel.

Frissitendo dokumentacio:

- `README.md`:
  - lifecycle panel rovid leiras;
  - update-readiness read-only jelleg;
  - autostart toggle.
- `SETUP.md`:
  - Windows login startup beallitas;
  - `Check for Updates` mit csinal es mit nem;
  - dirty working tree eset kezelese.
- `docs/STATE.md`:
  - aktualis lifecycle allapot.
- `docs/CHANGELOG.dev.md`:
  - rovid fejlesztesi bejegyzes.
- Ez a tervfajl:
  - sikeres implementacio utan `done` ala kerul.

Kifejezett future-work pontok:

- tenyleges auto-update flow kulon `safe auto-update` tervben;
- clean repo eseten a kovetkezo szeletben engedheto lehet:
  - `git fetch`;
  - `git pull --ff-only`;
  - `npm install`, ha `package.json` vagy `package-lock.json` valtozott;
  - `npm run build`;
  - `npm run check`;
  - siker eseten bot/tray restart.
- dirty repo eseten a kovetkezo szeletben az alapertelmezett viselkedes:
  - automatikusan megall;
  - kiirja, hogy lokalis modositas van;
  - nem stashel es nem resetel emberi megerosites nelkul.
- `git stash` csak explicit user-confirm utan legyen engedheto.
- `git reset --hard` csak kulon, nagyon lathato megerosites utan legyen engedheto, mert lokalis modositasokat dobhat el.
- minden auto-update probalkozas irjon public-safe helyi logot, amely nem tartalmaz tokeneket vagy privat adatokat.

## Validacio

Minimum fejlesztes kozbeni ellenorzes:

- `cmd /c win-start.bat --stop`
- `cmd /c win-start.bat --status`
- `cmd /c win-start.bat`
- `cmd /c win-start.bat --status`
- tray panel indul es nem ir `tray-error.log` hibakat
- `cmd /c win-start.bat --stop`

Git/lifecycle manual smoke:

- clean repo allapot kijelzes;
- egy ideiglenes, nem trackelt tesztfajl melletti dirty allapot kijelzes;
- upstream ahead/behind parancsok futnak es timeout nelkul visszaternek;
- `Check for Updates` csak fetch-et futtat, working tree-t nem modosit.

Autostart smoke:

- autostart shortcut letrehozas;
- shortcut felismeres;
- shortcut torles;
- `.lnk` nem jelenik meg git statusban.

Teljes repo validacio:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check`
- `npm run plans:check`
- `git diff --check`
- `ggshield secret scan path --recursive --yes --use-gitignore .`

Publikalas:

- commit csak zold validacio utan;
- push csak zold validacio es tiszta staged scope utan;
- push utan `git rev-list --left-right --count origin/main...HEAD` legyen `0 0`.

## Feltetelezesek

- A projekt tovabbra is Windows-first.
- A mostani szelet nem implemental teljes auto-update-et.
- `git fetch` elfogadhato read-only remote metadata frissiteskent.
- A tray C# WinForms marad a Windows desktop felulet.
- Nincs uj npm dependency, ha a C#/.NET standard library eleg a megvalositashoz.
