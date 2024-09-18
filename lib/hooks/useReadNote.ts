import useSWR from "swr";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

const fetchNote = async () => {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from("notes").select();

  if (error) throw new Error(error.message);

  return data;
};

const useReadNote = () => {
  const { data, isLoading } = useSWR<Note[]>("notesKey", fetchNote);

  return { data, isLoading };
};

export default useReadNote;
