import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function StaffPage() {
  return (
    <main className="min-h-screen text-zinc-50">
      <header className="top-nav">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BrandMark />
          <Link href="/public" className="secondary-btn px-3 py-1.5 text-xs font-semibold text-zinc-100">Public Portal</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="glass-card rounded-2xl p-8 sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight">Staff Portal</h1>
          <p className="mt-3 text-zinc-300">
            Handle complaint operations, assignment flow, and ticket status updates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="primary-btn px-4 py-2 text-sm" href="/staff/login">
              Staff login
            </Link>
            <Link className="secondary-btn px-4 py-2 text-sm font-semibold text-zinc-100" href="/staff/tickets">
              View tickets
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

