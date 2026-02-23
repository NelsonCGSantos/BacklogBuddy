"use server";

import items from "../../../../data/items.json";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";

type SeedResult =
  | { ok: true; inserted: number; updated: number }
  | { ok: false; error: string };

export async function seedItemsAction(): Promise<SeedResult> {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const userEmail = user?.email?.toLowerCase();

  if (!user || !adminEmail || adminEmail !== userEmail) {
    return { ok: false, error: "Unauthorized." };
  }

  const ids = items.map((item) => item.id);
  const { data: existing, error: existingError } = await supabase
    .from("items")
    .select("id")
    .in("id", ids);

  if (existingError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Seed items lookup failed:", existingError);
    }
    return { ok: false, error: existingError.message };
  }

  const existingIds = new Set((existing ?? []).map((item) => item.id));
  const inserted = ids.filter((id) => !existingIds.has(id)).length;
  const updated = ids.length - inserted;

  const payload = items.map((item) => ({
    id: item.id,
    media_type: item.mediaType,
    title: item.title,
    poster_url: item.posterUrl,
    genres: item.genres,
    external_ids: item.externalIds,
  }));

  const { error } = await supabase
    .from("items")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Seed items failed:", error);
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, inserted, updated };
}
