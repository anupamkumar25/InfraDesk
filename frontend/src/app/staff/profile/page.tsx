"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, MeResponse } from "@/lib/api";
import { clearTokens, getMe } from "@/lib/staffAuth";

export default function StaffProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const res = await getMe();
        if (!alive) return;
        setMe(res);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.replace("/staff/login");
          return;
        }
        setErr("Failed to load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const initials =
    me && (me.first_name || me.last_name)
      ? `${me.first_name || ""} ${me.last_name || ""}`
          .trim()
          .split(" ")
          .map((p) => p[0]?.toUpperCase() ?? "")
          .slice(0, 2)
          .join("")
      : me?.username?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-zinc-400">
              Staff
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Profile</h1>
            <p className="mt-1 text-sm text-zinc-300">
              View your account details for the staff portal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/staff/tickets"
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
            >
              Back to tickets
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
          {loading ? (
            <div className="text-sm text-zinc-300">Loading…</div>
          ) : err ? (
            <div className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : me ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-lg font-semibold text-zinc-950">
                {initials}
              </div>
              <div className="grid gap-3 text-sm">
                <div>
                  <div className="text-xs text-zinc-400">Username</div>
                  <div className="mt-1 font-mono text-zinc-100">{me.username}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Name</div>
                  <div className="mt-1 text-zinc-100">
                    {(me.first_name || me.last_name
                      ? `${me.first_name} ${me.last_name}`.trim()
                      : "") || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Email</div>
                  <div className="mt-1 text-zinc-100">{me.email || "—"}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

