"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, Ticket } from "@/lib/api";
import { apiFetchStaff, clearTokens } from "@/lib/staffAuth";

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

export default function TicketsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const q = sp.get("q") ?? "";
  const status = sp.get("status") ?? "";

  const [qDraft, setQDraft] = useState(q);
  const [statusDraft, setStatusDraft] = useState(status);

  useEffect(() => {
    setQDraft(q);
    setStatusDraft(status);
  }, [q, status]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (status) params.set("status", status);
        const res = await apiFetchStaff<Paginated<Ticket> | Ticket[]>(
          `/tickets/${params.toString() ? `?${params.toString()}` : ""}`
        );
        if (!alive) return;
        setTickets(unwrapList<Ticket>(res));
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.replace(`/staff/login?next=${encodeURIComponent("/staff/tickets")}`);
          return;
        }
        setErr("Failed to load tickets.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [q, status, router]);

  const filteredCountLabel = useMemo(() => {
    if (q || status) return "Filtered";
    return "All";
  }, [q, status]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-zinc-400">
              Staff
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Tickets</h1>
            <p className="mt-1 text-sm text-zinc-300">
              {filteredCountLabel} view. Click a ticket to open details.
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
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
              href="/staff"
            >
              Staff home
            </Link>
            <button
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
              onClick={() => {
                clearTokens();
                router.replace("/staff/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 sm:col-span-2">
              <div className="text-xs font-medium text-zinc-300">Search</div>
              <input
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Ticket no or subject"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const params = new URLSearchParams();
                    if (qDraft.trim()) params.set("q", qDraft.trim());
                    if (statusDraft) params.set("status", statusDraft);
                    router.push(`/staff/tickets${params.toString() ? `?${params.toString()}` : ""}`);
                  }
                }}
              />
            </label>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">Status</div>
              <select
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
              >
                <option value="">All</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="OPEN">OPEN</option>
                <option value="REOPENED">REOPENED</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-60"
              onClick={() => {
                const params = new URLSearchParams();
                if (qDraft.trim()) params.set("q", qDraft.trim());
                if (statusDraft) params.set("status", statusDraft);
                router.push(`/staff/tickets${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              disabled={loading}
            >
              Apply
            </button>
            <button
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 disabled:opacity-60"
              onClick={() => router.push("/staff/tickets")}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-6 rounded-md border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="grid grid-cols-12 gap-0 border-b border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs font-medium text-zinc-300">
            <div className="col-span-3">Ticket</div>
            <div className="col-span-5">Subject</div>
            <div className="col-span-2">Zone</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-sm text-zinc-300">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="px-4 py-6 text-sm text-zinc-300">No tickets found.</div>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                className="grid grid-cols-12 gap-0 border-b border-zinc-800 px-4 py-3 text-sm hover:bg-zinc-900/60"
                href={`/staff/tickets/${t.id}`}
              >
                <div className="col-span-3 font-mono text-zinc-100">{t.ticket_no}</div>
                <div className="col-span-5 truncate text-zinc-100">{t.subject}</div>
                <div className="col-span-2 truncate text-zinc-300">{t.zone?.name ?? "-"}</div>
                <div className="col-span-2 text-right">
                  <span className="rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1 text-xs">
                    {t.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

