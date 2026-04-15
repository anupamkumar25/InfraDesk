import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function PublicPage() {
  return (
    <main className="min-h-screen text-zinc-50">
      <header className="top-nav">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BrandMark />
          <Link href="/staff/login" className="secondary-btn px-3 py-1.5 text-xs font-semibold text-zinc-100">Staff Login</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="glass-card fade-up rounded-2xl p-6 sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight">Public Portal</h1>
          <p className="mt-3 text-zinc-300">
          Submit a new complaint or track an existing ticket using your ticket number and email.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link className="glass-card interactive-card fade-up fade-up-delay-1 rounded-xl p-6" href="/public/submit">
              <div className="text-sm font-semibold text-cyan-200">Submit Complaint</div>
              <div className="mt-2 text-sm text-zinc-300">Create a new complaint ticket.</div>
            </Link>
            <Link className="glass-card interactive-card fade-up fade-up-delay-2 rounded-xl p-6" href="/public/track">
              <div className="text-sm font-semibold text-cyan-200">Track Complaint</div>
              <div className="mt-2 text-sm text-zinc-300">
                Check status with ticket number and email.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

