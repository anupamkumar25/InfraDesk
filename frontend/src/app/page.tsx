export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-zinc-400">
              Campus maintenance management
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              InfraDesk
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Next.js frontend + Django/DRF API + Postgres. Start with Docker,
              then add real auth, RBAC, public submit, and staff workflows.
            </p>
          </div>
          <div className="hidden sm:flex flex-col gap-2 text-right">
            <div className="text-xs text-zinc-400">API base</div>
            <code className="rounded bg-zinc-900 px-3 py-2 text-xs">
              {process.env.NEXT_PUBLIC_API_BASE_URL ?? "not set"}
            </code>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900"
            href="/staff"
          >
            <div className="text-sm font-medium">Staff Portal (WIP)</div>
            <div className="mt-1 text-sm text-zinc-400">
              Login, ticket register, ticket detail, updates.
            </div>
          </a>
          <a
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900"
            href="/public"
          >
            <div className="text-sm font-medium">Public Portal (WIP)</div>
            <div className="mt-1 text-sm text-zinc-400">
              Submit + track via OTP/tracking token.
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}
