export default function PublicPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Public Portal</h1>
        <p className="mt-2 text-zinc-300">
          Submit a new complaint or track an existing ticket using your ticket number and email.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900"
            href="/public/submit"
          >
            <div className="text-sm font-medium">Submit Complaint</div>
            <div className="mt-1 text-sm text-zinc-400">
              Get ticket number
            </div>
          </a>
          <a
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900"
            href="/public/track"
          >
            <div className="text-sm font-medium">Track Complaint</div>
            <div className="mt-1 text-sm text-zinc-400">
              Enter ticket number + Email.
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}

