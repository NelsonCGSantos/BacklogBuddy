import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server-component";
import CategoriesSection from "./categories-section";
import BacklogSection from "./backlog-section";

const defaultCategories = [
  { name: "Focusing", sort_order: 1 },
  { name: "Completed", sort_order: 2 },
];

async function ensureDefaultCategories({
  userId,
}: {
  userId: string;
}) {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .in(
      "name",
      defaultCategories.map((category) => category.name)
    );

  if (error) {
    return;
  }

  const existing = new Set(
    (data ?? []).map((category) => category.name.toLowerCase())
  );
  const missing = defaultCategories.filter(
    (category) => !existing.has(category.name.toLowerCase())
  );

  if (missing.length === 0) {
    return;
  }

  await supabase.from("categories").insert(
    missing.map((category) => ({
      user_id: userId,
      name: category.name,
      sort_order: category.sort_order,
    }))
  );
}

export default async function LibraryPage() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureDefaultCategories({ userId: user.id });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
        <header className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">
            Library
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Your private backlog
          </h1>
          <p className="mt-2 text-base text-zinc-300">
            This is the signed-in home for your media focus.
          </p>
        </header>
        <CategoriesSection />
        <BacklogSection />
      </main>
    </div>
  );
}
