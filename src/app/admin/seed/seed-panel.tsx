"use client";

import { useState, useTransition } from "react";
import { seedItemsAction } from "./actions";

type Notice =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export default function SeedPanel() {
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice>(null);

  const handleSeed = () => {
    setNotice(null);
    startTransition(async () => {
      const result = await seedItemsAction();
      if (result.ok) {
        setNotice({
          type: "success",
          text: `Seed complete. Inserted ${result.inserted}, updated ${result.updated}.`,
        });
      } else {
        setNotice({ type: "error", text: result.error });
      }
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Seed items</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Upsert local catalog entries into Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={isPending}
          className="rounded-full border border-white/10 bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Seeding..." : "Seed items"}
        </button>
      </div>

      {notice ? (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </section>
  );
}
