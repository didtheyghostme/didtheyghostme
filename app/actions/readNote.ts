"use server";

import supabase from "@/lib/supabase";

const actionReadNote = async () => {
  const { data, error } = await supabase.from("notes").select();

  if (error) throw new Error(error.message);

  return data;
};

export default actionReadNote;
