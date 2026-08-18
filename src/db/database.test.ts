import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock better-sqlite3 to always use :memory:
vi.mock("better-sqlite3", async () => {
  const actual = await vi.importActual("better-sqlite3") as any;
  const RealDatabase = actual.default;
  return {
    default: function MemoryDatabase(_path: string, options?: object) {
      return new RealDatabase(":memory:", options);
    },
  };
});

import {
  initDatabase,
  registerProject,
  unregisterProject,
  getProject,
  getAllProjects,
  getProjectsByPath,
  setAutoApprove,
  upsertSession,
  getSession,
  updateSessionStatus,
  getAllSessions,
  createOrGetBotOpsJob,
  getBotOpsJob,
  listBotOpsJobEvents,
  listBotOpsJobs,
  approveBotOpsJob,
  updateBotOpsJobStatus,
  acquireNextBotOpsJob,
  recordBotOpsHeartbeat,
  recordBotOpsWorkerHeartbeat,
  listBotOpsWorkerHeartbeats,
  completeBotOpsJob,
  markExpiredBotOpsApprovals,
} from "./database.js";

describe("database", () => {
  beforeEach(() => {
    initDatabase();
  });

  // ─── Project CRUD ───

  describe("project CRUD", () => {
    it("registerProject + getProject", () => {
      registerProject("ch1", "/path/to/project", "guild1");
      const project = getProject("ch1");
      expect(project).toBeDefined();
      expect(project!.project_path).toBe("/path/to/project");
      expect(project!.guild_id).toBe("guild1");
      expect(project!.auto_approve).toBe(0);
    });

    it("registerProject with same channelId replaces existing", () => {
      registerProject("ch1", "/old/path", "guild1");
      registerProject("ch1", "/new/path", "guild1");
      const project = getProject("ch1");
      expect(project!.project_path).toBe("/new/path");
    });

    it("getProject returns undefined for non-existent channel", () => {
      expect(getProject("nonexistent")).toBeUndefined();
    });

    it("getAllProjects filters by guild", () => {
      registerProject("ch1", "/p1", "guild1");
      registerProject("ch2", "/p2", "guild1");
      registerProject("ch3", "/p3", "guild2");
      expect(getAllProjects("guild1")).toHaveLength(2);
      expect(getAllProjects("guild2")).toHaveLength(1);
      expect(getAllProjects("guild3")).toHaveLength(0);
    });

    it("getProjectsByPath finds duplicate channel mappings for one project", () => {
      registerProject("ch1", "/p1", "guild1");
      registerProject("ch2", "/p1", "guild1");
      registerProject("ch3", "/p1", "guild2");
      registerProject("ch4", "/p2", "guild1");

      const projects = getProjectsByPath("guild1", "/p1");
      expect(projects.map((project) => project.channel_id).sort()).toEqual(["ch1", "ch2"]);
    });

    it("unregisterProject removes project and cascades to sessions", () => {
      registerProject("ch1", "/p1", "guild1");
      upsertSession("s1", "ch1", null, "online");
      unregisterProject("ch1");
      expect(getProject("ch1")).toBeUndefined();
      expect(getSession("ch1")).toBeUndefined();
    });

    it("setAutoApprove toggles auto_approve flag", () => {
      registerProject("ch1", "/p1", "guild1");
      expect(getProject("ch1")!.auto_approve).toBe(0);

      setAutoApprove("ch1", true);
      expect(getProject("ch1")!.auto_approve).toBe(1);

      setAutoApprove("ch1", false);
      expect(getProject("ch1")!.auto_approve).toBe(0);
    });
  });

  // ─── Session CRUD ───

  describe("session CRUD", () => {
    beforeEach(() => {
      registerProject("ch1", "/p1", "guild1");
    });

    it("upsertSession + getSession", () => {
      upsertSession("s1", "ch1", "sdk-session-1", "online");
      const session = getSession("ch1");
      expect(session).toBeDefined();
      expect(session!.session_id).toBe("sdk-session-1");
      expect(session!.status).toBe("online");
    });

    it("upsertSession replaces existing session with same id", () => {
      upsertSession("s1", "ch1", null, "online");
      upsertSession("s1", "ch1", "sdk-1", "idle");
      const session = getSession("ch1");
      expect(session!.session_id).toBe("sdk-1");
      expect(session!.status).toBe("idle");
    });

    it("upsertSession with null sessionId", () => {
      upsertSession("s1", "ch1", null, "online");
      const session = getSession("ch1");
      expect(session!.session_id).toBeNull();
    });

    it("updateSessionStatus changes status", () => {
      upsertSession("s1", "ch1", null, "online");
      updateSessionStatus("ch1", "waiting");
      expect(getSession("ch1")!.status).toBe("waiting");
    });

    it("getAllSessions joins with projects", () => {
      registerProject("ch2", "/p2", "guild1");
      upsertSession("s1", "ch1", null, "online");
      upsertSession("s2", "ch2", null, "idle");
      const sessions = getAllSessions("guild1");
      expect(sessions).toHaveLength(2);
      expect(sessions[0].project_path).toBeDefined();
    });

    it("getAllSessions returns empty for guild with no sessions", () => {
      registerProject("ch2", "/p2", "guild2");
      expect(getAllSessions("guild2")).toHaveLength(0);
    });
  });

  describe("BotOps jobs", () => {
    it("creates BotOps jobs idempotently by job id", () => {
      const first = createOrGetBotOpsJob({
        job_id: "job-1",
        requested_by: "operator",
        target: "nas",
        capability: "nas.worker.check",
        summary: "worker check",
      });
      const second = createOrGetBotOpsJob({
        job_id: "job-1",
        requested_by: "operator",
        target: "nas",
        capability: "nas.worker.check",
        summary: "worker check",
      });

      expect(first.created).toBe(true);
      expect(second.created).toBe(false);
      expect(listBotOpsJobs()).toHaveLength(1);
      expect(getBotOpsJob("job-1")?.status).toBe("Requested");
      expect(listBotOpsJobEvents("job-1")).toMatchObject([
        {
          event_type: "job.created",
          actor: "operator",
          detail: "nas/nas.worker.check",
        },
      ]);
    });

    it("requires approval before approved jobs become requested", () => {
      createOrGetBotOpsJob({
        job_id: "restart-1",
        requested_by: "operator",
        target: "windows",
        capability: "service.restart",
        summary: "restart",
      });

      expect(getBotOpsJob("restart-1")?.status).toBe("WaitingApproval");
      const approved = approveBotOpsJob("restart-1", "operator", new Date("2026-08-18T10:00:00.000Z"));
      expect(approved?.approval_state).toBe("approved");
      expect(approved?.approved_by).toBe("operator");
      expect(approved?.approval_expires_at).toBe("2026-08-18T10:15:00.000Z");
      expect(getBotOpsJob("restart-1")?.status).toBe("Requested");
      expect(listBotOpsJobEvents("restart-1")[0]).toMatchObject({
        event_type: "approval.approved",
        actor: "operator",
        detail: "expires 2026-08-18T10:15:00.000Z",
      });
    });

    it("can cancel a queued job without deleting its audit trail", () => {
      createOrGetBotOpsJob({
        job_id: "check-1",
        requested_by: "operator",
        target: "repo",
        capability: "audit.check",
        summary: "check",
      });

      expect(updateBotOpsJobStatus("check-1", "Cancelled", "cancelled by test")).toBe(true);
      expect(getBotOpsJob("check-1")?.status).toBe("Cancelled");
      expect(getBotOpsJob("check-1")?.result).toBe("cancelled by test");
      expect(listBotOpsJobEvents("check-1")[0]).toMatchObject({
        event_type: "status.Cancelled",
        actor: "system",
        detail: "cancelled by test",
      });
    });

    it("acquires only requested jobs matching target and capability", () => {
      createOrGetBotOpsJob({
        job_id: "windows-1",
        requested_by: "operator",
        target: "windows",
        capability: "status.read",
        summary: "windows status",
      });
      createOrGetBotOpsJob({
        job_id: "nas-1",
        requested_by: "operator",
        target: "nas",
        capability: "nas.worker.check",
        summary: "worker check",
      });

      const job = acquireNextBotOpsJob(
        "nas-worker-1",
        "nas",
        ["nas.worker.check"],
        30_000,
        new Date("2026-08-18T10:00:00.000Z"),
      );

      expect(job?.job_id).toBe("nas-1");
      expect(job?.status).toBe("Running");
      expect(job?.lease_owner).toBe("nas-worker-1");
      expect(getBotOpsJob("windows-1")?.status).toBe("Requested");
    });

    it("does not acquire approval-gated jobs before approval", () => {
      createOrGetBotOpsJob({
        job_id: "deploy-1",
        requested_by: "operator",
        target: "nas",
        capability: "nas.deploy.verify",
        summary: "deploy verify",
      });

      expect(acquireNextBotOpsJob("nas-worker-1", "nas", ["nas.deploy.verify"], 30_000)).toBeUndefined();
      expect(getBotOpsJob("deploy-1")?.status).toBe("WaitingApproval");
    });

    it("marks expired approvals stale before worker pickup", () => {
      createOrGetBotOpsJob({
        job_id: "deploy-2",
        requested_by: "operator",
        target: "nas",
        capability: "nas.deploy.verify",
        summary: "deploy verify",
      });
      approveBotOpsJob("deploy-2", "operator", new Date("2026-08-18T10:00:00.000Z"), 1_000);

      expect(acquireNextBotOpsJob(
        "nas-worker-1",
        "nas",
        ["nas.deploy.verify"],
        30_000,
        new Date("2026-08-18T10:00:02.000Z"),
      )).toBeUndefined();

      const job = getBotOpsJob("deploy-2");
      expect(job?.approval_state).toBe("stale");
      expect(job?.status).toBe("WaitingApproval");
      expect(job?.result).toBe("approval expired");
      expect(listBotOpsJobEvents("deploy-2")[0]).toMatchObject({
        event_type: "approval.stale",
        actor: "system",
        detail: "approval expired",
      });
    });

    it("keeps fresh approvals available for worker pickup", () => {
      createOrGetBotOpsJob({
        job_id: "deploy-3",
        requested_by: "operator",
        target: "nas",
        capability: "nas.deploy.verify",
        summary: "deploy verify",
      });
      approveBotOpsJob("deploy-3", "operator", new Date("2026-08-18T10:00:00.000Z"), 60_000);

      const job = acquireNextBotOpsJob(
        "nas-worker-1",
        "nas",
        ["nas.deploy.verify"],
        30_000,
        new Date("2026-08-18T10:00:30.000Z"),
      );

      expect(job?.job_id).toBe("deploy-3");
      expect(job?.status).toBe("Running");
    });

    it("can mark expired approvals in a maintenance pass", () => {
      createOrGetBotOpsJob({
        job_id: "push-1",
        requested_by: "operator",
        target: "repo",
        capability: "git.push",
        summary: "push",
      });
      approveBotOpsJob("push-1", "operator", new Date("2026-08-18T10:00:00.000Z"), 1_000);

      expect(markExpiredBotOpsApprovals(new Date("2026-08-18T10:00:02.000Z"))).toBe(1);
      expect(getBotOpsJob("push-1")?.approval_state).toBe("stale");
    });

    it("records heartbeat and completion only for the lease owner", () => {
      createOrGetBotOpsJob({
        job_id: "nas-2",
        requested_by: "operator",
        target: "nas",
        capability: "nas.worker.check",
        summary: "worker check",
      });
      acquireNextBotOpsJob("nas-worker-1", "nas", ["nas.worker.check"], 30_000);

      expect(recordBotOpsHeartbeat("nas-2", "other-worker")).toBe(false);
      expect(recordBotOpsHeartbeat("nas-2", "nas-worker-1", new Date("2026-08-18T10:00:01.000Z"))).toBe(true);
      expect(completeBotOpsJob("nas-2", "other-worker", "Completed", "wrong owner")).toBe(false);
      expect(completeBotOpsJob("nas-2", "nas-worker-1", "Completed", "ok")).toBe(true);
      expect(getBotOpsJob("nas-2")?.status).toBe("Completed");
      expect(getBotOpsJob("nas-2")?.lease_owner).toBeNull();
      expect(listBotOpsJobEvents("nas-2").map((event) => event.event_type)).toEqual([
        "worker.Completed",
        "worker.acquired",
        "job.created",
      ]);
    });

    it("records worker heartbeat snapshots by worker id", () => {
      recordBotOpsWorkerHeartbeat({
        worker_id: "nas-worker-1",
        target: "nas",
        host: "host-a",
        capabilities: ["nas.worker.check"],
        status: "status",
        detail: "first",
        now: new Date("2026-08-18T10:00:00.000Z"),
      });
      recordBotOpsWorkerHeartbeat({
        worker_id: "nas-worker-1",
        target: "nas",
        host: "host-a",
        capabilities: ["nas.worker.check"],
        status: "idle",
        detail: "second",
        now: new Date("2026-08-18T10:01:00.000Z"),
      });

      expect(listBotOpsWorkerHeartbeats("windows")).toHaveLength(0);
      expect(listBotOpsWorkerHeartbeats("nas")).toMatchObject([
        {
          worker_id: "nas-worker-1",
          target: "nas",
          host: "host-a",
          capabilities: "nas.worker.check",
          status: "idle",
          detail: "second",
          heartbeat_at: "2026-08-18T10:01:00.000Z",
        },
      ]);
    });
  });
});
