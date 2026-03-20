import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 text-zinc-50">
          <div className="mx-auto max-w-md px-6 py-16">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-300">
              Loading…
            </div>
          </div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

