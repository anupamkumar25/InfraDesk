"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError, MeResponse, StaffDirectoryUser, Ticket, TicketUpdate } from "@/lib/api";
import { apiFetchStaff, clearTokens, getMe } from "@/lib/staffAuth";

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function unwrapList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const results = (v as Record<string, unknown>).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function StaffTicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [updatesRaw, setUpdatesRaw] = useState<unknown>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [staff, setStaff] = useState<StaffDirectoryUser[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignedToId, setAssignedToId] = useState<number | "">( "");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return !!ticket && newStatus.trim().length > 0 && newStatus !== ticket.status && !saving;
  }, [ticket, newStatus, saving]);

  const updates = useMemo(() => unwrapList<TicketUpdate>(updatesRaw), [updatesRaw]);

  async function load() {
    if (!id) return;
    setErr(null);
    setLoading(true);
    try {
      const [meRes, t, u] = await Promise.all([
        getMe(),
        apiFetchStaff<Ticket>(`/tickets/${id}/`),
        apiFetchStaff<Paginated<TicketUpdate> | TicketUpdate[]>(
          `/tickets/${id}/updates/`
        ),
      ]);
      setMe(meRes);
      setTicket(t);
      setNewStatus(t.status);
      setUpdatesRaw(u);
      setAssignedToId(t.assigned_to?.id ?? "");

      if (meRes.is_se) {
        const directory = await apiFetchStaff<StaffDirectoryUser[]>(`/auth/staff/`);
        setStaff(directory);
      } else {
        setStaff([]);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.replace(`/staff/login?next=${encodeURIComponent(`/staff/tickets/${id}`)}`);
        return;
      }
      setErr("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSaveStatus() {
    if (!ticket) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await apiFetchStaff<Ticket>(`/tickets/${ticket.id}/status/`, {
        method: "POST",
        body: JSON.stringify({
          status: newStatus,
          message: statusMessage.trim() ? statusMessage.trim() : "",
        }),
      });
      setTicket(res);
      setStatusMessage("");
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.replace(`/staff/login?next=${encodeURIComponent(`/staff/tickets/${id}`)}`);
        return;
      }
      setErr("Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  async function onAssign() {
    if (!ticket) return;
    if (!me?.is_se) return;
    setAssigning(true);
    setErr(null);
    try {
      const payload =
        assignedToId === ""
          ? { assigned_to_id: null }
          : { assigned_to_id: Number(assignedToId) };
      const res = await apiFetchStaff<Ticket>(`/tickets/${ticket.id}/assign/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTicket(res);
      setAssignedToId(res.assigned_to?.id ?? "");
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.replace(`/staff/login?next=${encodeURIComponent(`/staff/tickets/${id}`)}`);
        return;
      }
      setErr("Failed to assign ticket.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-zinc-400">
              Staff
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Ticket</h1>
            <p className="mt-1 text-sm text-zinc-300">
              {ticket ? (
                <span className="font-mono">{ticket.ticket_no}</span>
              ) : (
                "Loading…"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-100 hover:bg-zinc-800"
              onClick={() => router.push("/staff/profile")}
              title="View profile"
            >
              U
            </button>
            <Link
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
              href="/staff/tickets"
            >
              Back to tickets
            </Link>
            <button
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
              onClick={() => {
                clearTokens();
                router.replace("/staff/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-6 rounded-md border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-300">
            Loading…
          </div>
        ) : ticket ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-zinc-400">Subject</div>
                    <div className="mt-1 text-lg font-semibold text-zinc-100">
                      {ticket.subject}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-400">Current status</div>
                    <div className="mt-1 inline-flex rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1 text-xs">
                      {ticket.status}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Info label="Zone" value={ticket.zone?.name ?? "-"} />
                  <Info label="Type" value={ticket.complaint_type?.label ?? "-"} />
                  <Info label="Priority" value={ticket.priority} />
                  <Info label="Location" value={ticket.location_text} />
                  <Info label="Asset ID" value={ticket.asset_id_text || "-"} />
                  <Info label="Updated" value={fmt(ticket.updated_at)} />
                </div>

                <div className="mt-5">
                  <div className="text-xs font-medium text-zinc-300">Description</div>
                  <div className="mt-2 whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-100">
                    {ticket.description}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="text-sm font-semibold">Updates</div>
                <div className="mt-4 grid gap-3">
                  {updates.length === 0 ? (
                    <div className="text-sm text-zinc-300">No updates yet.</div>
                  ) : (
                    updates.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-md border border-zinc-800 bg-zinc-950/40 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs text-zinc-400">
                            {u.type}
                            {u.actor?.username ? ` • ${u.actor.username}` : ""}
                          </div>
                          <div className="text-xs text-zinc-400">{fmt(u.created_at)}</div>
                        </div>
                        {u.from_status || u.to_status ? (
                          <div className="mt-2 text-xs text-zinc-300">
                            {u.from_status ? (
                              <span className="font-mono">{u.from_status}</span>
                            ) : (
                              "-"
                            )}{" "}
                            →{" "}
                            {u.to_status ? (
                              <span className="font-mono">{u.to_status}</span>
                            ) : (
                              "-"
                            )}
                          </div>
                        ) : null}
                        {u.message ? (
                          <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">
                            {u.message}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="text-sm font-semibold">Update status</div>
                <p className="mt-2 text-sm text-zinc-300">
                  Select a new status and optionally add a message.
                </p>

                <label className="mt-4 grid gap-1">
                  <div className="text-xs font-medium text-zinc-300">Status</div>
                  <select
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="REOPENED">REOPENED</option>
                  </select>
                </label>

                <label className="mt-4 grid gap-1">
                  <div className="text-xs font-medium text-zinc-300">Message</div>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Optional note for the timeline"
                  />
                </label>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-60"
                    onClick={onSaveStatus}
                    disabled={!canSave}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 disabled:opacity-60"
                    onClick={() => {
                      setNewStatus(ticket.status);
                      setStatusMessage("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {me?.is_se ? (
                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="text-sm font-semibold">Assign ticket</div>
                  <p className="mt-2 text-sm text-zinc-300">
                    Only SE can assign tickets to staff.
                  </p>

                  <label className="mt-4 grid gap-1">
                    <div className="text-xs font-medium text-zinc-300">Assigned to</div>
                    <select
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm disabled:opacity-60"
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value ? Number(e.target.value) : "")}
                      disabled={assigning}
                    >
                      <option value="">Unassigned</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.username}
                          {s.first_name || s.last_name
                            ? ` • ${`${s.first_name} ${s.last_name}`.trim()}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-60"
                      onClick={onAssign}
                      disabled={assigning}
                    >
                      {assigning ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-300">
            Ticket not found.
          </div>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

