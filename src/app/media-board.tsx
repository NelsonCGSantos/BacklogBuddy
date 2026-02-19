"use client";

import { useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/types/media";
import { seedMedia } from "@/data/seed";

const statusLabel: Record<MediaItem["status"], string> = {
  planned: "Planned",
  focusing: "Focusing",
  completed: "Completed",
  dropped: "Dropped",
};

const typeLabel: Record<MediaItem["type"], string> = {
  game: "Game",
  movie: "Movie",
  tv: "TV",
  anime: "Anime",
};

export default function MediaBoard() {
  const { data } = useQuery({
    queryKey: ["media"],
    queryFn: async () => seedMedia,
    initialData: seedMedia,
  });

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Private</p>
          <h2 className="text-2xl font-semibold text-white">Current focus</h2>
        </div>
        <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Signups are disabled. Invite-only access.
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  {typeLabel[item.type]}
                </p>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-900">
                {statusLabel[item.status]}
              </span>
            </div>
            {item.notes ? (
              <p className="mt-3 text-sm text-zinc-300">{item.notes}</p>
            ) : null}
            <p className="mt-4 text-xs text-zinc-400">Last touched {item.lastTouched}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
