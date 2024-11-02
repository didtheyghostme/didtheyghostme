"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { CompanyFormData, companySchema } from "@/lib/schema/addCompanySchema";
import { DBTable } from "@/lib/constants/dbTables";

const actionCreateCompany = async (key: string, { arg: newCompany }: { arg: CompanyFormData }): Promise<CompanyTable> => {
  const supabase = await createClerkSupabaseClientSsr();

  const { userId: user_id } = auth();

  if (!user_id) {
    throw new Error("User not authenticated");
  }

  try {
    // Server-side validation
    const validatedData = companySchema.parse(newCompany);

    const dataToInsert = {
      ...validatedData,
      logo_url: validatedData.company_url,
      user_id,
    };

    const { data, error } = await supabase.from(DBTable.COMPANY).insert(dataToInsert).select();

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
