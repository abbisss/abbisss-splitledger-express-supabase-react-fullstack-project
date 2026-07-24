import supabase from "../config/supabase.js";

export const getUserId = async (authId: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  return user.id;
};
