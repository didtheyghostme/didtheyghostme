"use server";

import supabase from "@/lib/supabase";

const delay = () => new Promise<void>((res) => setTimeout(() => res(), 3000));

const actionCreateNote = async (
  key: string,
  { arg: newNote }: { arg: Note },
): Promise<Note> => {
  await delay();

  try {
    // const newNote: Note = {
    //   title: formData.get("name") as string,
    // };

    const { data, error } = await supabase
      .from("notes")
      .insert([newNote])
      .select();

    if (error) {
      console.error("Insert error fail:", error.message);
      throw new Error(error.message);
    } else {
      console.log("Insert successful:", data);
    }

    return data[0];
  } catch (err) {
    console.error("Error executing insert:", err);
    throw err;
  }
};

export default actionCreateNote;
