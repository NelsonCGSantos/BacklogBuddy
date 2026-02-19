import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Providers from "./providers";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server-component";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Backlog Buddy",
  description: "Private media backlog and leaderboard tracker.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}
      >
        <Providers>
          <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-sm">
              <Link href="/" className="font-semibold text-zinc-100">
                Backlog Buddy
              </Link>
              <nav className="flex items-center gap-4 text-zinc-300">
                {user ? (
                  <>
                    <Link href="/library" className="hover:text-white">
                      Library
                    </Link>
                    <Link
                      href="/logout"
                      className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 hover:border-white/40"
                    >
                      Logout
                    </Link>
                  </>
                ) : (
                  <Link href="/login" className="hover:text-white">
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
