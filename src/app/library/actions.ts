"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";

const protectedCategories = new Set(["completed", "focusing"]);

function normalizeName(name: string) {
  return name.trim();
}

export async function createCategoryAction(name: string) {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to create categories." };
  }

  const cleaned = normalizeName(name);
  if (!cleaned) {
    return { ok: false, error: "Category name is required." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", cleaned)
    .limit(1);

  if (existingError) {
    return { ok: false, error: "Unable to check existing categories." };
  }

  if (existing && existing.length > 0) {
    return { ok: false, error: "A category with that name already exists." };
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: cleaned,
  });

  if (error) {
    return { ok: false, error: "Failed to create category." };
  }

  return { ok: true, message: "Category created." };
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to delete categories." };
  }

  if (!categoryId) {
    return { ok: false, error: "Category not found." };
  }

  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("id", categoryId)
    .single();

  if (fetchError || !category) {
    return { ok: false, error: "Category not found." };
  }

  if (protectedCategories.has(category.name.toLowerCase())) {
    return { ok: false, error: "This category cannot be deleted." };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "Failed to delete category." };
  }

  return { ok: true, message: "Category deleted." };
}
