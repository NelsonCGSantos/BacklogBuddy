import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server-component";

export default async function LibraryPage() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
        <section className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 text-sm text-zinc-300">
          Your collections and focus list will appear here.
        </section>
      </main>
    </div>
  );
}
