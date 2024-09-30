"use server";

import { z } from "zod";

import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { CompanyFormData, companySchema } from "@/lib/schema/companySchema";
import { DBTable } from "@/lib/constants/dbTables";

const actionCreateCompany = async (key: string, { arg: newCompany }: { arg: CompanyFormData }): Promise<Company> => {
  const supabase = await createClerkSupabaseClientSsr();

  try {
    // Server-side validation
    const validatedData = companySchema.parse(newCompany);

    const { data, error } = await supabase.from(DBTable.COMPANY).insert(validatedData).select();

    if (error) {
      console.error("Insert error fail:", error.message);
      if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
        throw new Error(ERROR_MESSAGES.DUPLICATE_URL);
      }
      throw new Error(error.message);
    }

    return data[0];
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("Zod validation error:", err.errors);
      throw new Error(err.errors.map((issue) => issue.message).join(", "));
    }
    console.error("Error executing insert:", err);
    throw err;
  }
};

export default actionCreateCompany;
