import { createSupabaseServer } from "./server";

export async function getProfile() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, school")
    .eq("id", user.id)
    .single();

  return data;
}