# BotOps NAS + Windows Control Plane

Status: superseded/reference

## Cel

A Discord bot legyen a fo operatori vezerlofelulet, de a NAS es Windows vegrehajtas csak staged, allowlistes, naplozott es explicit approval-gated lepeseken keresztul tortenhet.

2026-08-18 korrekcio: a source-of-truth nem ez a repo, hanem az `Attys_DC_BOT`. Ez a terv a korabbi NAS repo kiserlet referenciaja; uj runtime fejlesztest nem innen kell folytatni.

## Elkeszult reszek

- A repo scope-ja NAS BotOps control-plane iranyra valtott.
- Letrejott a canonical BotOps contract:
  - capability allowlist
  - job status lifecycle
  - approval state
  - target lista
  - lease expiry helper
  - exact job/target/capability approval match
- Letrejott a SQLite `botops_jobs` tabla es az idempotens `job_id` alapu job letrehozas.
- Bekerult a staged Discord command alap:
  - `/ops status|jobs|approve|cancel|logs`
  - `/nas status|worker-status`
  - `/windows status|helper-run`
- A parancsok nem futtatnak arbitrary shellt, nem inditanak restartot, deployt, commitot vagy pusht.
- Celzott tesztek vedik a capability allowlistet, approval match-et, lease expiry-t, idempotens job letrehozast es cancellation audit trailt.
- Bekerult az elso NAS worker vegrehajtasi szelet:
  - `Requested` NAS job lease alapu atvetele
  - heartbeat iras
  - fix `nas.worker.check` executor
  - public-safe result iras
  - `worker:nas:status`, `worker:nas:once`, `worker:nas:loop` npm script
- Bekerult az elso Windows fixed helper worker szelet:
  - `status.read`, `audit.check` es approval-koteles `service.restart` registry
  - dirty worktree preflight
  - bot lock inspection process leallitas nelkul
  - config presence check ertekek kiirasa nelkul
  - `audit.check` csak fix `npm run check` helperrel fut, dirty/missing config mellett blokkol
  - `service.restart` csak exact fresh approval utan, fix `cmd /c win-start.bat` helperrel fut, es dirty worktree, missing config, stale/unknown bot lock vagy hianyzo helper mellett fail-closed megall
- Bekerult az explicit Windows target-root bekotes:
  - `BOTOPS_WINDOWS_TARGET_REPO_ROOT` abszolut, letezo celrepo gyokerre iranyitja a worker helper futasait
  - ervenytelen celrepo eseten a worker fail-closed megall
  - `DISCORD_DATABASE_PATH` csak a BotOps DB-t valasztja, nem potolja a bot runtime configot
- Live `service.restart` smoke zold lett:
  - synthetic approved BotOps job: `job-d61e9ed3-85d2-4c60-9f90-d2c6cc7e0d01`
  - worker futas: NAS repo kod, live bot DB, live bot target root
  - eredmeny: `Completed`, live bot status `Running`, PID `44748` -> `10440`, `bot.err.log` ures
- Bekerult az approval expiry hardening:
  - approval rogziti az `approved_by` es `approval_expires_at` mezoket
  - default TTL 15 perc
  - worker pickup elott a lejart approval `stale` lesz
  - stale approval nem indit vegrehajtast
- Bekerult a BotOps event audit trail:
  - kulon `botops_events` tabla rogziti a job, approval, status es worker lifecycle esemenyeket
  - `/ops logs` a job reszletek mellett a legutobbi public-safe esemenyeket is mutatja
  - az event trail nem indit vegrehajtast es nem ad uj capabilityt
- Bekerult a worker heartbeat lathatosag:
  - kulon `botops_worker_heartbeats` tabla tarolja a legutobbi worker jelentest worker id szerint
  - a NAS es Windows worker status/once utak public-safe heartbeatet irnak
  - `/nas status` es `/windows status` mutatja a legutobbi ismert worker heartbeateket
  - nincs worker loop inditas, service install, hatterfolyamat inditas vagy restart
- Bekerult az elso explicit worker lifecycle supervision szelet:
  - kozos PID/log alapu supervisor modul
  - `worker:nas:start|stop|restart|supervisor-status`
  - `worker:windows:start|stop|restart|supervisor-status`
  - Windows worker `--loop` mod
  - duplikalt start blokkolasa
  - stale PID explicit stop alatti kezelese
  - restart fail-closed, ha a korabbi PID nem allt le
  - nincs service install, OS autostart, source write, approval adas, commit, push, deploy vagy cleanup automatizmus

## Nyitott reszek

1. A hasznos worker/supervisor szeletek atvetele az `Attys_DC_BOT` repoba.
2. A NAS repo tovabbi runtime fejlesztesenek lezarasa vagy archiv jellegu karbantartasa.
3. Barmilyen uj NAS-side write/deploy/rebuild irany csak az `Attys_DC_BOT` terven es approval gate-en keresztul indulhat.

## Fail-Closed Szabalyok

- Unknown capability: reject, nincs shell fallback.
- Missing approval: `WaitingApproval`, nincs vegrehajtas.
- Duplicate `job_id`: a meglevo job jon vissza, nincs uj futas.
- Dirty source worktree: worker oldali iro muvelet blokkol.
- Worker offline: job `WaitingWorker` allapotban marad.
- Lease expired: worker nem folytat vakon; recovery vagy manual review kell.
- Secret scan fail: commit/push/deploy blokkol.

## Kovetkezo Lepes

Az aktualis kovetkezo lepes az `Attys_DC_BOT` oldali konszolidacio validalasa. Ez a repo nem indit uj worker loopt, service restartot, deployt, commitot vagy pusht automatikusan.
