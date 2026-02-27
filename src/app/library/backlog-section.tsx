"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  addCategoryItemAction,
  addUserItemAction,
  removeCategoryItemAction,
  updateUserItemStatusAction,
} from "./actions";

type Item = {
  id: string;
  title: string;
  poster_url: string | null;
  media_type: "game" | "movie" | "tv" | "anime";
};

type UserItem = {
  item_id: string;
  status: "planned" | "focusing" | "completed" | "dropped";
  items: Item | null;
};

type Category = {
  id: string;
  name: string;
  sort_order: number | null;
};

type CategoryAssignment = {
  item_id: string;
  category_id: string;
  categories: Category | null;
};

type Notice = { type: "success" | "error"; text: string } | null;

type StatusOption = {
  value: UserItem["status"];
  label: string;
};

const statusOptions: StatusOption[] = [
  { value: "planned", label: "Planned" },
  { value: "focusing", label: "Focusing" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const statusBySection: Array<StatusOption> = statusOptions;

const mediaTypeLabel: Record<Item["media_type"], string> = {
  game: "Game",
  movie: "Movie",
  tv: "TV",
  anime: "Anime",
};

export default function BacklogSection() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserItem["status"]>(
    "planned"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [notice, setNotice] = useState<Notice>(null);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const trimmedSearch = search.trim();

  const {
    data: userItems = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user-items", categoryFilter],
    queryFn: async (): Promise<UserItem[]> => {
      const baseQuery = supabase
        .from("user_items")
        .select(
          categoryFilter === "all"
            ? "item_id, status, items (id, title, poster_url, media_type)"
            : "item_id, status, items (id, title, poster_url, media_type), category_items!inner(category_id)"
        )
        .order("updated_at", { ascending: false });

      const { data, error: queryError } =
        categoryFilter === "all"
          ? await baseQuery
          : await baseQuery.eq("category_items.category_id", categoryFilter);

      if (queryError) {
        throw new Error(queryError.message);
      }

      return (data ?? []) as UserItem[];
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["items-search", trimmedSearch],
    enabled: trimmedSearch.length >= 2,
    queryFn: async (): Promise<Item[]> => {
      const { data, error: queryError } = await supabase
        .from("items")
        .select("id, title, poster_url, media_type")
        .ilike("title", `%${trimmedSearch}%`)
        .order("title", { ascending: true })
        .limit(8);

      if (queryError) {
        throw new Error(queryError.message);
      }

      return (data ?? []) as Item[];
    },
  });

  const { data: categories = [] } = useQuery({
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

      return (data ?? []) as Category[];
    },
  });

  const { data: categoryAssignments = [] } = useQuery({
    queryKey: ["category-items"],
    queryFn: async (): Promise<CategoryAssignment[]> => {
      const { data, error: queryError } = await supabase
        .from("category_items")
        .select("item_id, category_id, categories (id, name, sort_order)")
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      return (data ?? []) as CategoryAssignment[];
    },
  });

  const itemsByStatus = statusBySection.reduce<Record<string, UserItem[]>>(
    (acc, section) => {
      acc[section.value] = [];
      return acc;
    },
    {}
  );

  userItems.forEach((item) => {
    if (itemsByStatus[item.status]) {
      itemsByStatus[item.status].push(item);
    }
  });

  const categoryAssignmentsByItem = categoryAssignments.reduce<
    Record<string, CategoryAssignment[]>
  >((acc, assignment) => {
    if (!acc[assignment.item_id]) {
      acc[assignment.item_id] = [];
    }
    acc[assignment.item_id].push(assignment);
    return acc;
  }, {});

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!selectedItem) {
      setNotice({ type: "error", text: "Select an item to add." });
      return;
    }

    startTransition(async () => {
      const result = await addUserItemAction(selectedItem.id, selectedStatus);
      if (result.ok) {
        setNotice({ type: "success", text: result.message });
        setSearch("");
        setSelectedItem(null);
        await queryClient.invalidateQueries({ queryKey: ["user-items"] });
      } else {
        setNotice({ type: "error", text: result.error });
      }
    });
  };

  const handleStatusChange = (itemId: string, nextStatus: UserItem["status"]) => {
    setNotice(null);
    startTransition(async () => {
      const result = await updateUserItemStatusAction(itemId, nextStatus);
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: ["user-items"] });
      } else {
        setNotice({ type: "error", text: result.error });
      }
    });
  };

  const handleCategoryToggle = (
    itemId: string,
    categoryId: string,
    isChecked: boolean
  ) => {
    setNotice(null);
    startTransition(async () => {
      const result = isChecked
        ? await addCategoryItemAction(itemId, categoryId)
        : await removeCategoryItemAction(itemId, categoryId);
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: ["category-items"] });
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
            Backlog
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Your status grid
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Track what you plan to watch or play and what you&apos;ve finished.
          </p>
        </div>
        <form onSubmit={handleAdd} className="w-full max-w-md space-y-3">
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Add to backlog
          </label>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedItem(null);
              }}
              placeholder="Search items"
              className="flex-1 rounded-full border border-white/10 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
            />
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as UserItem["status"])
              }
              className="rounded-full border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Filter by category
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="mt-2 w-full rounded-full border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {trimmedSearch.length >= 2 && searchResults.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Results
              </p>
              <div className="mt-2 grid gap-2">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setSearch(item.title);
                    }}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedItem?.id === item.id
                        ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                        : "border-white/10 bg-zinc-950 text-zinc-200 hover:border-white/30"
                    }`}
                  >
                    <span>{item.title}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {mediaTypeLabel[item.media_type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {trimmedSearch.length >= 2 && searchResults.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-400">
              No items found.
            </div>
          ) : null}
        </form>
      </div>

      {notice ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusBySection.map((section) => (
          <div key={section.value} className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                {section.label}
              </p>
              <p className="text-xs text-zinc-500">
                {itemsByStatus[section.value]?.length ?? 0} items
              </p>
            </div>
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                Loading...
              </div>
            ) : null}
            {isError ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error instanceof Error
                  ? error.message
                  : "Unable to load items."}
              </div>
            ) : null}
            {!isLoading && !isError && itemsByStatus[section.value]?.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                No items yet.
              </div>
            ) : null}
            {!isLoading && !isError
              ? itemsByStatus[section.value]?.map((entry) => {
                  const item = entry.items;
                  if (!item) return null;
                  return (
                    <article
                      key={entry.item_id}
                      className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-12 overflow-hidden rounded-xl bg-zinc-900">
                          {item.poster_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.poster_url}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            {mediaTypeLabel[item.media_type]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(categoryAssignmentsByItem[entry.item_id] ?? [])
                          .map((assignment) => assignment.categories)
                          .filter(Boolean)
                          .map((category) => (
                            <span
                              key={category!.id}
                              className="rounded-full border border-white/10 bg-zinc-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300"
                            >
                              {category!.name}
                            </span>
                          ))}
                      </div>
                      <details className="mt-3 rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2">
                        <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Categories
                        </summary>
                        <div className="mt-2 grid gap-2">
                          {categories.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                              Create a category to assign.
                            </p>
                          ) : (
                            categories.map((category) => {
                              const isChecked = Boolean(
                                (categoryAssignmentsByItem[entry.item_id] ?? []).find(
                                  (assignment) =>
                                    assignment.category_id === category.id
                                )
                              );
                              return (
                                <label
                                  key={category.id}
                                  className="flex items-center justify-between gap-2 text-xs text-zinc-300"
                                >
                                  <span>{category.name}</span>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(event) =>
                                      handleCategoryToggle(
                                        entry.item_id,
                                        category.id,
                                        event.target.checked
                                      )
                                    }
                                    className="h-4 w-4 accent-amber-400"
                                    disabled={isPending}
                                  />
                                </label>
                              );
                            })
                          )}
                        </div>
                      </details>
                      <div className="mt-3">
                        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Status
                        </label>
                        <select
                          value={entry.status}
                          onChange={(event) =>
                            handleStatusChange(
                              entry.item_id,
                              event.target.value as UserItem["status"]
                            )
                          }
                          className="mt-2 w-full rounded-full border border-white/10 bg-zinc-950 px-3 py-2 text-xs uppercase tracking-[0.2em] text-zinc-100 focus:border-amber-400/60 focus:outline-none"
                          disabled={isPending}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })
              : null}
          </div>
        ))}
      </div>
    </section>
  );
}
