export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string }
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (init?.token) headers.set("Authorization", `Bearer ${init.token}`);

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ApiError(
      typeof body === "string" ? body : "Request failed",
      res.status,
      body
    );
  }
  return body as T;
}

export type Zone = { id: number; name: string };
export type ComplaintType = { id: number; key: string; label: string };

export type AuthLoginRequest = { username: string; password: string };
export type AuthLoginResponse = { access: string; refresh: string };
export type MeResponse = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  is_se: boolean;
};

export type StaffDirectoryUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type UserSlim = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type PublicSubmitRequest = {
  name: string;
  email: string;
  phone?: string;
  zone_id: number;
  complaint_type_id: number;
  subject: string;
  description: string;
  location_text: string;
  asset_id_text?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

export type PublicSubmitResponse = { ticket_no: string };

export type PublicTrackResponse = {
  ticket_no: string;
  created_at: string;
  zone: Zone;
  complaint_type: ComplaintType;
  subject: string;
  priority: string;
  status: string;
  location_text: string;
};

export type TicketStatus = string;
export type TicketPriority = string;

export type Ticket = {
  id: string; // uuid
  ticket_no: string;
  created_at: string;
  updated_at: string;
  zone: Zone;
  complaint_type: ComplaintType;
  subject: string;
  description: string;
  location_text: string;
  asset_id_text: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_by: UserSlim | null;
  assigned_to: UserSlim | null;
};

export type TicketUpdate = {
  id: number;
  type: string;
  message: string;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
  actor: UserSlim | null;
};

