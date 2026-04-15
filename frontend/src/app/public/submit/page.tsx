"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import {
  apiFetch,
  ApiError,
  ComplaintType,
  PublicSubmitRequest,
  PublicSubmitResponse,
  Zone,
} from "@/lib/api";

type SubmitState =
  | { kind: "form" }
  | { kind: "success"; data: PublicSubmitResponse };

function unwrapList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const results = (v as Record<string, unknown>).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

const priorities: Array<PublicSubmitRequest["priority"]> = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

export default function PublicSubmitPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [types, setTypes] = useState<ComplaintType[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "form" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<PublicSubmitRequest>({
    name: "",
    email: "",
    phone: "",
    zone_id: 0,
    complaint_type_id: 0,
    subject: "",
    description: "",
    location_text: "",
    asset_id_text: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoadingMeta(true);
      try {
        const [z, t] = await Promise.all([
          apiFetch<unknown>("/zones/"),
          apiFetch<unknown>("/complaint-types/"),
        ]);
        if (!alive) return;
        const zonesList = unwrapList<Zone>(z);
        const typesList = unwrapList<ComplaintType>(t);
        setZones(zonesList);
        setTypes(typesList);
        setForm((f) => ({
          ...f,
          zone_id: zonesList[0]?.id ?? 0,
          complaint_type_id: typesList[0]?.id ?? 0,
        }));
      } finally {
        if (alive) setLoadingMeta(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length >= 2 &&
      form.email.includes("@") &&
      form.zone_id > 0 &&
      form.complaint_type_id > 0 &&
      form.subject.trim().length >= 4 &&
      form.location_text.trim().length >= 4 &&
      form.description.trim().length >= 10
    );
  }, [form]);

  async function onSubmit() {
    setErr(null);
    if (!canSubmit) {
      setErr("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: PublicSubmitRequest = {
        ...form,
        phone: form.phone?.trim() ? form.phone.trim() : undefined,
        asset_id_text: form.asset_id_text?.trim()
          ? form.asset_id_text.trim()
          : undefined,
      };
      const res = await apiFetch<PublicSubmitResponse>("/public/tickets/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSubmitState({ kind: "success", data: res });
    } catch (e) {
      if (e instanceof ApiError) {
        setErr(
          typeof e.body === "object" && e.body
            ? JSON.stringify(e.body)
            : "Submit failed."
        );
      } else {
        setErr("Submit failed.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitState.kind === "success") {
    const { ticket_no } = submitState.data;
    return (
      <main className="min-h-screen text-zinc-50">
        <header className="top-nav">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <BrandMark href="/public" label="InfraDesk Public" />
            <Link href="/" className="secondary-btn px-3 py-1.5 text-xs font-semibold text-zinc-100">Home</Link>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="glass-card rounded-2xl p-8 sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight">Complaint Submitted</h1>
          <p className="mt-2 text-zinc-300">
            Save your ticket number. You can track your complaint using this
            ticket number and your email address.
          </p>

          <div className="mt-8 glass-card rounded-xl p-5">
            <div className="text-xs text-zinc-400">Ticket Number</div>
            <div className="mt-1 font-mono text-lg">{ticket_no}</div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="primary-btn px-4 py-2 text-sm disabled:opacity-60"
                onClick={async () => {
                  await navigator.clipboard.writeText(`Ticket: ${ticket_no}`);
                }}
              >
                Copy
              </button>
              <a
                className="secondary-btn px-4 py-2 text-sm font-semibold text-zinc-100"
                href={`/public/track?ticket_no=${encodeURIComponent(ticket_no)}`}
              >
                Track now
              </a>
              <a
                className="secondary-btn px-4 py-2 text-sm font-semibold text-zinc-100"
                href="/public/submit"
                onClick={() => {
                  setSubmitState({ kind: "form" });
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    zone_id: zones[0]?.id ?? 0,
                    complaint_type_id: types[0]?.id ?? 0,
                    subject: "",
                    description: "",
                    location_text: "",
                    asset_id_text: "",
                    priority: "MEDIUM",
                  });
                }}
              >
                Submit another
              </a>
            </div>
          </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-zinc-50">
      <header className="top-nav">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <BrandMark href="/public" label="InfraDesk Public" />
          <Link href="/" className="secondary-btn px-3 py-1.5 text-xs font-semibold text-zinc-100">Home</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="glass-card rounded-2xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight">Submit Complaint</h1>
        <p className="mt-2 text-zinc-300">
          You will receive a ticket number. Use it with your email address to
          track the complaint.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="glass-card rounded-xl p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-9 py-2 text-sm"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
              </Field>
              <Field label="Email *">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M5.5 8l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-9 py-2 text-sm"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
              </Field>
              <Field label="Phone">
                <input
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </Field>
              <Field label="Priority">
                <select
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: e.target.value as PublicSubmitRequest["priority"],
                    }))
                  }
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Zone *">
                <select
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm disabled:opacity-60"
                  disabled={loadingMeta}
                  value={form.zone_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zone_id: Number(e.target.value) }))
                  }
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Complaint type *">
                <select
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm disabled:opacity-60"
                  disabled={loadingMeta}
                  value={form.complaint_type_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      complaint_type_id: Number(e.target.value),
                    }))
                  }
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location *">
                <input
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  value={form.location_text}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location_text: e.target.value }))
                  }
                />
              </Field>
              <Field label="Asset ID">
                <input
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  value={form.asset_id_text ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, asset_id_text: e.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="Subject *">
                <input
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                />
              </Field>
              <Field label="Description *">
                <textarea
                  className="min-h-32 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>
            </div>

            {err ? (
              <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            <div className="mt-5 flex items-center gap-3">
              <button
                className="primary-btn px-4 py-2 text-sm disabled:opacity-60"
                onClick={onSubmit}
                disabled={submitting || loadingMeta}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <a
                className="text-sm text-zinc-300 underline decoration-zinc-700 hover:text-zinc-100"
                href="/public/track"
              >
                I already have a ticket
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <div className="text-xs font-medium text-zinc-300">{label}</div>
      {children}
    </label>
  );
}

