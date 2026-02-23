"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createCategoryAction, deleteCategoryAction } from "./actions";

const protectedCategories = new Set(["completed", "focusing"]);

type Category = {
  id: string;
  name: string;
  sort_order: number | null;
};

type Notice = { type: "success" | "error"; text: string };

export default function CategoriesSection() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error: queryError } = await supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (queryError) {
        throw new Error(queryError.message);
      }

      return data ?? [];
    },
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    startTransition(async () => {
      const result = await createCategoryAction(name);
      if (result.ok) {
        setName("");
        setNotice({ type: "success", text: result.message });
        await queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        setNotice({ type: "error", text: result.error });
      }
    });
  };

  const handleDelete = (categoryId: string) => {
    setNotice(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);
      if (result.ok) {
        setNotice({ type: "success", text: result.message });
        await queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        setNotice({ type: "error", text: result.error });
      }
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
            Categories
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Organize your backlog
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Create and manage custom buckets for your focus list.
          </p>
        </div>
        <form
          onSubmit={handleCreate}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            New category
          </label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Add a category"
              className="flex-1 rounded-full border border-white/10 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {notice ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            Loading categories...
          </div>
        ) : null}
        {isError ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error instanceof Error
              ? error.message
              : "Unable to load categories."}
          </div>
        ) : null}
        {!isLoading && !isError && categories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            No categories yet. Create your first one.
          </div>
        ) : null}
        {!isLoading && !isError
          ? categories.map((category) => {
              const isProtected = protectedCategories.has(
                category.name.toLowerCase()
              );
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {category.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Sort order {category.sort_order ?? 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    disabled={isProtected || isPending}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 transition hover:border-rose-400/60 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProtected ? "Locked" : "Delete"}
                  </button>
                </div>
              );
            })
          : null}
      </div>
    </section>
  );
}
