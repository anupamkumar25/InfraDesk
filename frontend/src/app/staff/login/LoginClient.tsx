"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { clearTokens, getMe, login, setTokens } from "@/lib/staffAuth";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/staff/tickets";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return username.trim().length >= 2 && password.length >= 4;
  }, [username, password]);

  async function onSubmit() {
    setErr(null);
    if (!canSubmit) {
      setErr("Enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const tokens = await login({ username: username.trim(), password });
      setTokens(tokens);
      const me = await getMe();
      const allowed =
        me.is_superuser ||
        me.is_staff ||
        me.is_se ||
        (Array.isArray(me.groups) && (me.groups.includes("SE") || me.groups.includes("STAFF")));
      if (!allowed) {
        clearTokens();
        setErr("This account does not have staff access.");
        return;
      }
      router.replace(next);
    } catch (e) {
      clearTokens();
      if (e instanceof ApiError) {
        setErr("Invalid credentials.");
      } else {
        setErr("Login failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold">Staff Login</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Sign in with your InfraDesk staff account.
        </p>

        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <label className="grid gap-1">
            <div className="text-xs font-medium text-zinc-300">Username</div>
            <input
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="mt-4 grid gap-1">
            <div className="text-xs font-medium text-zinc-300">Password</div>
            <input
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
          </label>

          {err ? (
            <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            <button
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-60"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <Link
              className="text-sm text-zinc-300 underline decoration-zinc-700 hover:text-zinc-100"
              href="/"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

