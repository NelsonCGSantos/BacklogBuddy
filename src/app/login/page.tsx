import { redirect } from "next/navigation";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const adminEmail = process.env.ADMIN_EMAIL ?? "";

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect("/login?error=1");
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = data.user?.email?.trim().toLowerCase();

    if (adminEmail && userEmail !== adminEmail) {
      await supabase.auth.signOut();
      redirect("/login?error=access_denied");
    }

    redirect("/library");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16 text-zinc-100">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Sign in to your private backlog.
        </p>
        {sp.error ? (
          <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
            {sp.error === "access_denied"
              ? "Access denied."
              : "That email or password did not work."}
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-zinc-300">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={adminEmail}
              className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
