import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  createBotOpsJob,
  type BotOpsCapability,
  type BotOpsJob,
  type BotOpsJobRequest,
  type BotOpsJobStatus,
  type BotOpsTarget,
} from "../botops/contract.js";
import type {
  BotOpsEventRecord,
  BotOpsJobRecord,
  BotOpsWorkerHeartbeatRecord,
  Project,
  Session,
  SessionStatus,
} from "./types.js";

let db: Database.Database;

function ensureColumn(tableName: string, columnName: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

export function initDatabase(): void {
  const configuredPath = process.env.DISCORD_DATABASE_PATH ?? ".discord-bot-state/bridge.sqlite";
  const dbPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      channel_id TEXT PRIMARY KEY,
      project_path TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      auto_approve INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      channel_id TEXT REFERENCES projects(channel_id) ON DELETE CASCADE,
      session_id TEXT,
      status TEXT DEFAULT 'offline',
      last_activity TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS botops_jobs (
      job_id TEXT PRIMARY KEY,
      requested_by TEXT NOT NULL,
      target TEXT NOT NULL,
      capability TEXT NOT NULL,
      status TEXT NOT NULL,
      approval_state TEXT NOT NULL,
      approved_by TEXT,
      approval_expires_at TEXT,
      summary TEXT NOT NULL,
      lease_owner TEXT,
      lease_expires_at TEXT,
      heartbeat_at TEXT,
      logs TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS botops_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS botops_worker_heartbeats (
      worker_id TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      host TEXT NOT NULL,
      capabilities TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT NOT NULL,
      heartbeat_at TEXT NOT NULL
    );
  `);

  ensureColumn("botops_jobs", "approved_by", "TEXT");
  ensureColumn("botops_jobs", "approval_expires_at", "TEXT");
}

export function recordBotOpsEvent(
  jobId: string,
  eventType: string,
  actor: string,
  detail: string,
  now = new Date(),
): void {
  db.prepare(`
    INSERT INTO botops_events (job_id, event_type, actor, detail, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    jobId,
    eventType.slice(0, 80),
    actor.slice(0, 80),
    detail.slice(0, 300),
    now.toISOString(),
  );
}

export function listBotOpsJobEvents(jobId: string, limit = 10): BotOpsEventRecord[] {
  return db.prepare(`
    SELECT *
    FROM botops_events
    WHERE job_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(jobId, Math.max(1, Math.min(25, limit))) as BotOpsEventRecord[];
}

export function recordBotOpsWorkerHeartbeat(input: {
  worker_id: string;
  target: BotOpsTarget;
  host: string;
  capabilities: readonly BotOpsCapability[];
  status: string;
  detail: string;
  now?: Date;
}): void {
  const timestamp = (input.now ?? new Date()).toISOString();
  db.prepare(`
    INSERT INTO botops_worker_heartbeats (
      worker_id,
      target,
      host,
      capabilities,
      status,
      detail,
      heartbeat_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(worker_id) DO UPDATE SET
      target = excluded.target,
      host = excluded.host,
      capabilities = excluded.capabilities,
      status = excluded.status,
      detail = excluded.detail,
      heartbeat_at = excluded.heartbeat_at
  `).run(
    input.worker_id.slice(0, 120),
    input.target,
    input.host.slice(0, 120),
    [...new Set(input.capabilities)].join(", "),
    input.status.slice(0, 80),
    input.detail.slice(0, 300),
    timestamp,
  );
}

export function listBotOpsWorkerHeartbeats(target?: BotOpsTarget): BotOpsWorkerHeartbeatRecord[] {
  if (target) {
    return db.prepare(`
      SELECT *
      FROM botops_worker_heartbeats
      WHERE target = ?
      ORDER BY heartbeat_at DESC
    `).all(target) as BotOpsWorkerHeartbeatRecord[];
  }

  return db.prepare(`
    SELECT *
    FROM botops_worker_heartbeats
    ORDER BY heartbeat_at DESC
  `).all() as BotOpsWorkerHeartbeatRecord[];
}

export function getDb(): Database.Database {
  return db;
}

// Project queries
export function registerProject(
  channelId: string,
  projectPath: string,
  guildId: string,
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO projects (channel_id, project_path, guild_id)
    VALUES (?, ?, ?)
  `);
  stmt.run(channelId, projectPath, guildId);
}

export function unregisterProject(channelId: string): void {
  db.prepare("DELETE FROM sessions WHERE channel_id = ?").run(channelId);
  db.prepare("DELETE FROM projects WHERE channel_id = ?").run(channelId);
}

export function getProject(channelId: string): Project | undefined {
  return db
    .prepare("SELECT * FROM projects WHERE channel_id = ?")
    .get(channelId) as Project | undefined;
}

export function getAllProjects(guildId: string): Project[] {
  return db
    .prepare("SELECT * FROM projects WHERE guild_id = ?")
    .all(guildId) as Project[];
}

export function getProjectsByPath(guildId: string, projectPath: string): Project[] {
  return db
    .prepare("SELECT * FROM projects WHERE guild_id = ? AND project_path = ?")
    .all(guildId, projectPath) as Project[];
}

export function setAutoApprove(
  channelId: string,
  autoApprove: boolean,
): void {
  db.prepare("UPDATE projects SET auto_approve = ? WHERE channel_id = ?").run(
    autoApprove ? 1 : 0,
    channelId,
  );
}

// Session queries
export function upsertSession(
  id: string,
  channelId: string,
  sessionId: string | null,
  status: SessionStatus,
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO sessions (id, channel_id, session_id, status, last_activity)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(id, channelId, sessionId, status);
}

export function getSession(channelId: string): Session | undefined {
  return db
    .prepare(
      "SELECT * FROM sessions WHERE channel_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(channelId) as Session | undefined;
}

export function updateSessionStatus(
  channelId: string,
  status: SessionStatus,
): void {
  db.prepare(
    "UPDATE sessions SET status = ?, last_activity = datetime('now') WHERE channel_id = ?",
  ).run(status, channelId);
}

export function getAllSessions(guildId: string): (Session & { project_path: string })[] {
  return db
    .prepare(`
      SELECT s.*, p.project_path FROM sessions s
      JOIN projects p ON s.channel_id = p.channel_id
      WHERE p.guild_id = ?
    `)
    .all(guildId) as (Session & { project_path: string })[];
}

function botOpsJobFromRecord(record: BotOpsJobRecord): BotOpsJob {
  return {
    job_id: record.job_id,
    requested_by: record.requested_by,
    target: record.target as BotOpsJob["target"],
    capability: record.capability as BotOpsJob["capability"],
    status: record.status as BotOpsJob["status"],
    approval_state: record.approval_state as BotOpsJob["approval_state"],
    approved_by: record.approved_by,
    approval_expires_at: record.approval_expires_at,
    summary: record.summary,
    lease_owner: record.lease_owner,
    lease_expires_at: record.lease_expires_at,
    heartbeat_at: record.heartbeat_at,
    logs: record.logs,
    result: record.result,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function createOrGetBotOpsJob(request: BotOpsJobRequest): {
  job: BotOpsJob;
  created: boolean;
} {
  const job = createBotOpsJob(request);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO botops_jobs (
      job_id,
      requested_by,
      target,
      capability,
      status,
      approval_state,
      approved_by,
      approval_expires_at,
      summary,
      lease_owner,
      lease_expires_at,
      heartbeat_at,
      logs,
      result,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    job.job_id,
    job.requested_by,
    job.target,
    job.capability,
    job.status,
    job.approval_state,
    job.approved_by,
    job.approval_expires_at,
    job.summary,
    job.lease_owner,
    job.lease_expires_at,
    job.heartbeat_at,
    job.logs,
    job.result,
    job.created_at,
    job.updated_at,
  );
  if (result.changes === 1) {
    recordBotOpsEvent(
      job.job_id,
      "job.created",
      job.requested_by,
      `${job.target}/${job.capability}`,
      new Date(job.created_at),
    );
  }
  return {
    job: getBotOpsJob(job.job_id) ?? job,
    created: result.changes === 1,
  };
}

export function getBotOpsJob(jobId: string): BotOpsJob | undefined {
  const record = db
    .prepare("SELECT * FROM botops_jobs WHERE job_id = ?")
    .get(jobId) as BotOpsJobRecord | undefined;
  return record ? botOpsJobFromRecord(record) : undefined;
}

export function listBotOpsJobs(limit = 10): BotOpsJob[] {
  const records = db
    .prepare("SELECT * FROM botops_jobs ORDER BY created_at DESC LIMIT ?")
    .all(Math.max(1, Math.min(25, limit))) as BotOpsJobRecord[];
  return records.map(botOpsJobFromRecord);
}

export function updateBotOpsJobStatus(
  jobId: string,
  status: BotOpsJobStatus,
  result = "",
): boolean {
  const updated = new Date().toISOString();
  const changed = db.prepare(`
    UPDATE botops_jobs
    SET status = ?, result = ?, updated_at = ?
    WHERE job_id = ?
  `).run(status, result, updated, jobId);
  if (changed.changes === 1) {
    recordBotOpsEvent(jobId, `status.${status}`, "system", result || status, nowFromIso(updated));
  }
  return changed.changes === 1;
}

function nowFromIso(value: string): Date {
  return new Date(value);
}

export function approveBotOpsJob(
  jobId: string,
  approvedBy: string,
  now = new Date(),
  ttlMs = 15 * 60_000,
): BotOpsJob | undefined {
  const job = getBotOpsJob(jobId);
  if (!job) return undefined;
  if (job.approval_state !== "required") return job;

  const updated = now.toISOString();
  const expiresAt = new Date(now.getTime() + Math.max(1_000, ttlMs)).toISOString();
  const changed = db.prepare(`
    UPDATE botops_jobs
    SET approval_state = 'approved',
      status = 'Requested',
      approved_by = ?,
      approval_expires_at = ?,
      logs = ?,
      updated_at = ?
    WHERE job_id = ?
  `).run(approvedBy, expiresAt, `approved by ${approvedBy}`, updated, jobId);
  if (changed.changes === 1) {
    recordBotOpsEvent(jobId, "approval.approved", approvedBy, `expires ${expiresAt}`, now);
  }
  return getBotOpsJob(jobId);
}

export function markExpiredBotOpsApprovals(now = new Date()): number {
  const timestamp = now.toISOString();
  const expiredJobs = db.prepare(`
    SELECT job_id
    FROM botops_jobs
    WHERE approval_state = 'approved'
      AND status = 'Requested'
      AND approval_expires_at IS NOT NULL
      AND approval_expires_at <= ?
  `).all(timestamp) as { job_id: string }[];

  const changed = db.prepare(`
    UPDATE botops_jobs
    SET approval_state = 'stale',
      status = 'WaitingApproval',
      result = 'approval expired',
      updated_at = ?
    WHERE approval_state = 'approved'
      AND status = 'Requested'
      AND approval_expires_at IS NOT NULL
      AND approval_expires_at <= ?
  `).run(timestamp, timestamp);
  for (const job of expiredJobs) {
    recordBotOpsEvent(job.job_id, "approval.stale", "system", "approval expired", now);
  }
  return changed.changes;
}

export function acquireNextBotOpsJob(
  workerId: string,
  target: BotOpsTarget,
  capabilities: readonly BotOpsCapability[],
  leaseMs: number,
  now = new Date(),
): BotOpsJob | undefined {
  const uniqueCapabilities = [...new Set(capabilities)];
  if (uniqueCapabilities.length === 0) return undefined;
  markExpiredBotOpsApprovals(now);

  const placeholders = uniqueCapabilities.map(() => "?").join(", ");
  const record = db.prepare(`
    SELECT *
    FROM botops_jobs
    WHERE status = 'Requested'
      AND target = ?
      AND approval_state IN ('not_required', 'approved')
      AND capability IN (${placeholders})
    ORDER BY created_at ASC
    LIMIT 1
  `).get(target, ...uniqueCapabilities) as BotOpsJobRecord | undefined;

  if (!record) return undefined;

  const leaseExpiresAt = new Date(now.getTime() + Math.max(1_000, leaseMs)).toISOString();
  const updated = now.toISOString();
  const changed = db.prepare(`
    UPDATE botops_jobs
    SET status = 'Running',
      lease_owner = ?,
      lease_expires_at = ?,
      heartbeat_at = ?,
      updated_at = ?
    WHERE job_id = ?
      AND status = 'Requested'
  `).run(workerId, leaseExpiresAt, updated, updated, record.job_id);

  if (changed.changes !== 1) return undefined;
  recordBotOpsEvent(record.job_id, "worker.acquired", workerId, `lease expires ${leaseExpiresAt}`, now);
  return getBotOpsJob(record.job_id);
}

export function recordBotOpsHeartbeat(
  jobId: string,
  workerId: string,
  now = new Date(),
): boolean {
  const timestamp = now.toISOString();
  const changed = db.prepare(`
    UPDATE botops_jobs
    SET heartbeat_at = ?,
      updated_at = ?
    WHERE job_id = ?
      AND lease_owner = ?
      AND status = 'Running'
  `).run(timestamp, timestamp, jobId, workerId);
  return changed.changes === 1;
}

export function completeBotOpsJob(
  jobId: string,
  workerId: string,
  status: Extract<BotOpsJobStatus, "Completed" | "Failed" | "WaitingWorker">,
  result: string,
  now = new Date(),
): boolean {
  const updated = now.toISOString();
  const changed = db.prepare(`
    UPDATE botops_jobs
    SET status = ?,
      result = ?,
      lease_owner = NULL,
      lease_expires_at = NULL,
      updated_at = ?
    WHERE job_id = ?
      AND lease_owner = ?
      AND status = 'Running'
  `).run(status, result, updated, jobId, workerId);
  if (changed.changes === 1) {
    recordBotOpsEvent(jobId, `worker.${status}`, workerId, result, now);
  }
  return changed.changes === 1;
}
