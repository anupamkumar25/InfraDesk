"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError, PublicTrackResponse } from "@/lib/api";

export default function PublicTrackPage() {
  const [ticketNo, setTicketNo] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<PublicTrackResponse | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tn = sp.get("ticket_no");
    if (tn) setTicketNo(tn);
    const em = sp.get("email");
    if (em) setEmail(em);
  }, []);

  const canTrack = useMemo(() => {
    return ticketNo.trim().length >= 6 && email.includes("@");
  }, [ticketNo, email]);

  async function onTrack() {
    setErr(null);
    setResult(null);
    if (!canTrack) {
      setErr("Enter a ticket number and the email you used when submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<PublicTrackResponse>("/public/tickets/track/", {
        method: "POST",
        body: JSON.stringify({
          ticket_no: ticketNo.trim().toUpperCase(),
          email: email.trim(),
        }),
      });
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError) {
        setErr("Ticket not found or email does not match.");
      } else {
        setErr("Track failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Track Complaint</h1>
        <p className="mt-2 text-zinc-300">
          Enter your ticket number and the email you used when submitting.
        </p>

        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">
                Ticket number
              </div>
              <input
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono"
                value={ticketNo}
                onChange={(e) => setTicketNo(e.target.value)}
                placeholder="TKT-2026-000001"
              />
            </label>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">
                Email
              </div>
              <input
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>

          {err ? (
            <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            <button
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-60"
              onClick={onTrack}
              disabled={loading}
            >
              {loading ? "Checking..." : "Track"}
            </button>
            <a
              className="text-sm text-zinc-300 underline decoration-zinc-700 hover:text-zinc-100"
              href="/public/submit"
            >
              Submit new complaint
            </a>
          </div>
        </div>

        {result ? (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-400">Ticket</div>
                <div className="mt-1 font-mono text-lg">{result.ticket_no}</div>
              </div>
              <div className="text-sm">
                <span className="text-zinc-400">Status:</span>{" "}
                <span className="font-semibold">{result.status}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Zone" value={result.zone.name} />
              <Info label="Type" value={result.complaint_type.label} />
              <Info label="Priority" value={result.priority} />
              <Info label="Location" value={result.location_text} />
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium text-zinc-300">Subject</div>
              <div className="mt-1 text-sm text-zinc-100">{result.subject}</div>
            </div>
          </div>
        ) : null}
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

