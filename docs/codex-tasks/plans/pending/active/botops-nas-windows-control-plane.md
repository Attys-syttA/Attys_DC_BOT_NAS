# BotOps NAS + Windows Control Plane

Status: active

## Cel

A Discord bot legyen a fo operatori vezerlofelulet, de a NAS es Windows vegrehajtas csak staged, allowlistes, naplozott es explicit approval-gated lepeseken keresztul tortenhet.

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
  - `status.read` es `audit.check` registry
  - dirty worktree preflight
  - bot lock inspection process leallitas nelkul
  - config presence check ertekek kiirasa nelkul
  - `audit.check` csak fix `npm run check` helperrel fut, dirty/missing config mellett blokkol
  - `service.restart` ebben a szeletben tovabbra sem worker capability
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

1. Approval rejection reason rogzites:
   - ha kesobb bekerul explicit reject command vagy UI, az indokot kulon eventkent kell rogziteni
2. Worker lifecycle OS/service supervision:
   - explicit kulon approval nelkul tovabbra sincs service install vagy OS autostart
   - a mostani start/stop/restart helper parancsra indithato, PID/log alapu runtime felugyelet
   - worker loop status/log csak public-safe lehet
3. Production command surface decision:
   - ha az eles Discord bot tovabbra is az `Attys_DC_BOT`, akkor a contractot es parancsokat kontrollaltan at kell venni oda is
   - a NAS repo maradjon producer/control-plane truth, ha kulon NAS service lesz belole
4. Supervised restart decision:
   - `service.restart` kulon szeletet igenyel, mert elo folyamatot erint
5. Live smoke csak kulon approval utan:
   - slash command registration
   - bot restart
   - NAS worker inditas vagy loop supervision
   - Windows helper runtime check

## Fail-Closed Szabalyok

- Unknown capability: reject, nincs shell fallback.
- Missing approval: `WaitingApproval`, nincs vegrehajtas.
- Duplicate `job_id`: a meglevo job jon vissza, nincs uj futas.
- Dirty source worktree: worker oldali iro muvelet blokkol.
- Worker offline: job `WaitingWorker` allapotban marad.
- Lease expired: worker nem folytat vakon; recovery vagy manual review kell.
- Secret scan fail: commit/push/deploy blokkol.

## Kovetkezo Lepes

A kovetkezo implementacios szelet a production command surface atveteli dontes vagy a service.restart kulon supervised worker szelete legyen. Service restart, deploy, commit es push tovabbra is kulon approval.
