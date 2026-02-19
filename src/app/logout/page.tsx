import { redirect } from "next/navigation";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";

export default function LogoutPage() {
  async function logoutAction() {
    "use server";

    const supabase = await createSupabaseServerActionClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-zinc-200/70 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign out</h1>
        <p className="mt-2 text-sm text-zinc-600">
          You can sign back in anytime.
        </p>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Confirm sign out
          </button>
        </form>
      </div>
    </div>
  );
}
