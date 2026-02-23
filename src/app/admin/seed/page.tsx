import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server-component";
import SeedPanel from "./seed-panel";

export default async function AdminSeedPage() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const userEmail = user?.email?.toLowerCase();

  if (!user) {
    redirect("/login");
  }

  if (!adminEmail || adminEmail !== userEmail) {
    redirect("/library");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <SeedPanel />
      </main>
    </div>
  );
}
