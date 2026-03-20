import Link from "next/link";

export default function StaffPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Staff Portal</h1>
        <p className="mt-2 text-zinc-300">
          Continue to{" "}
          <Link
            className="underline decoration-zinc-700 hover:text-zinc-100"
            href="/staff/tickets"
          >
            tickets
          </Link>{" "}
          (requires login).
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300"
            href="/staff/login"
          >
            Staff login
          </Link>
          <Link
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
            href="/staff/tickets"
          >
            View tickets
          </Link>
        </div>
      </div>
    </main>
  );
}

