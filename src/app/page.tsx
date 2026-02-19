import MediaBoard from "./media-board";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">
            Backlog Buddy
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">
                Private media backlog and leaderboard
              </h1>
              <p className="mt-2 max-w-2xl text-base text-zinc-300">
                Track what you are focusing on, rank favorites, and keep the
                queue moving without letting the list become noise.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
              Invite-only access. Signups are disabled.
            </div>
          </div>
        </header>
        <MediaBoard />
      </main>
    </div>
  );
}
