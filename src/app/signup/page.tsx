export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-zinc-200/70 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Signups closed</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Backlog Buddy is private right now. New accounts are invite-only.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          If you already have access, use the login page instead.
        </p>
      </div>
    </div>
  );
}
