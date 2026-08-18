export type SessionStatus = "online" | "offline" | "waiting" | "idle";

export interface Project {
  channel_id: string;
  project_path: string;
  guild_id: string;
  auto_approve: number;
  created_at: string;
}

export interface Session {
  id: string;
  channel_id: string;
  session_id: string | null; // Codex thread ID
  status: SessionStatus;
  last_activity: string | null;
  created_at: string;
}

export interface BotOpsJobRecord {
  job_id: string;
  requested_by: string;
  target: string;
  capability: string;
  status: string;
  approval_state: string;
  approved_by: string | null;
  approval_expires_at: string | null;
  summary: string;
  lease_owner: string | null;
  lease_expires_at: string | null;
  heartbeat_at: string | null;
  logs: string;
  result: string;
  created_at: string;
  updated_at: string;
}

export interface BotOpsEventRecord {
  id: number;
  job_id: string;
  event_type: string;
  actor: string;
  detail: string;
  created_at: string;
}

export interface BotOpsWorkerHeartbeatRecord {
  worker_id: string;
  target: string;
  host: string;
  capabilities: string;
  status: string;
  detail: string;
  heartbeat_at: string;
}
