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

export async function addUserItemAction(
  itemId: string,
  status: "planned" | "focusing" | "completed" | "dropped"
) {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to add items." };
  }

  if (!itemId) {
    return { ok: false, error: "Select an item to add." };
  }

  const { error } = await supabase.from("user_items").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      status,
    },
    { onConflict: "user_id,item_id" }
  );

  if (error) {
    return { ok: false, error: "Failed to add item to backlog." };
  }

  return { ok: true, message: "Item added to backlog." };
}

export async function updateUserItemStatusAction(
  itemId: string,
  status: "planned" | "focusing" | "completed" | "dropped"
) {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to update status." };
  }

  if (!itemId) {
    return { ok: false, error: "Item not found." };
  }

  const { error } = await supabase
    .from("user_items")
    .update({ status })
    .eq("user_id", user.id)
    .eq("item_id", itemId);

  if (error) {
    return { ok: false, error: "Failed to update status." };
  }

  return { ok: true };
}

export async function addCategoryItemAction(itemId: string, categoryId: string) {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to update categories." };
  }

  if (!itemId || !categoryId) {
    return { ok: false, error: "Missing category assignment." };
  }

  const { error } = await supabase.from("category_items").insert({
    user_id: user.id,
    item_id: itemId,
    category_id: categoryId,
  });

  if (error) {
    return { ok: false, error: "Failed to add category." };
  }

  return { ok: true };
}

export async function removeCategoryItemAction(
  itemId: string,
  categoryId: string
) {
  const supabase = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to update categories." };
  }

  if (!itemId || !categoryId) {
    return { ok: false, error: "Missing category assignment." };
  }

  const { error } = await supabase
    .from("category_items")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .eq("category_id", categoryId);

  if (error) {
    return { ok: false, error: "Failed to remove category." };
  }

  return { ok: true };
}
