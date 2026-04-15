import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="glass-card fade-up rounded-2xl p-6 sm:p-10">
          <div className="max-w-3xl">
            <div className="text-xs tracking-[0.3em] uppercase text-cyan-300/80">
              Campus maintenance management
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              InfraDesk
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-300">
              Streamline reporting and resolution of infrastructure issues with
              a modern complaint workflow for the public and staff teams.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link className="glass-card interactive-card fade-up fade-up-delay-1 rounded-xl p-6" href="/staff">
              <div className="text-sm font-semibold text-cyan-200">Staff Portal</div>
              <div className="mt-2 text-sm text-zinc-300">
                Login, assign tickets, update status, and manage workflow.
              </div>
            </Link>
            <Link className="glass-card interactive-card fade-up fade-up-delay-2 rounded-xl p-6" href="/public">
              <div className="text-sm font-semibold text-cyan-200">Public Portal</div>
              <div className="mt-2 text-sm text-zinc-300">
                Submit complaints and track progress with ticket number + email.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
