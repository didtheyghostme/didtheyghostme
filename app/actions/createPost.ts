"use server";

import { revalidatePath } from "next/cache";

import supabase from "@/lib/supabase";
const delay = () => new Promise<void>((res) => setTimeout(() => res(), 3000));

const createPost = async (formData: FormData) => {
  await delay();

  try {
    const newNote: Note = {
      title: formData.get("name") as string,
    };

    const { data, error } = await supabase
      .from("notes")
      .insert([newNote])
      .select();

    if (error) {
      console.error("Insert error:", error.message);
      throw new Error(error.message);
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
