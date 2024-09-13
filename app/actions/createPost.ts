"use server";

import { revalidatePath } from "next/cache";

import supabase from "@/lib/supabase";

const createPost = async (formData: FormData) => {
  try {
    const newNote: Note = {
      title: formData.get("name") as string,
    };

    const { data, error } = await supabase.from("notes").insert([newNote]);

    if (error) {
      console.error("Insert error:", error.message);
    } else {
      console.log("Insert successful:", data);
    }
  } catch (err) {
    console.error("Error executing insert:", err);
  }
  console.warn("Note created");
  // revalidatePath("/");
};

export default createPost;
