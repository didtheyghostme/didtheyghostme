"use server";

import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";

const delay = () => new Promise<void>((res) => setTimeout(() => res(), 3000));

const actionCreateCompany = async (key: string, { arg: newCompany }: { arg: Company }): Promise<Company> => {
  //   await delay();
  const supabase = await createClerkSupabaseClientSsr();

  try {
    // const newNote: Note = {
    //   title: formData.get("name") as string,
    // };
    console.warn("new company is", newCompany);

    const { data, error } = await supabase.from("company").insert(newCompany).select();

    if (error) {
      console.error("Insert error fail:", error.message);
      if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
        throw new Error(ERROR_MESSAGES.DUPLICATE_URL);
      }
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

export default actionCreateCompany;
