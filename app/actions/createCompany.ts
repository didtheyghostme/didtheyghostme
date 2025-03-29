"use server";

import { z } from "zod";

import { ERROR_CODES, ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { CompanyFormData, companySchema } from "@/lib/schema/addCompanySchema";
import { DBTable } from "@/lib/constants/dbTables";
import { withRateLimit } from "@/lib/withRateLimit";
import { extractDomain } from "@/lib/extractDomain";
import { mpServerTrack } from "@/lib/mixpanelServer";

// Define a return type that includes success/error states
type CompanyActionResult = { success: true } | { success: false; error: string };

const actionCreateCompany = async (key: string, { arg: newCompany }: { arg: CompanyFormData }): Promise<CompanyActionResult> => {
  try {
    return await withRateLimit(async (user_id) => {
      const supabase = await createClerkSupabaseClientSsr();

      try {
        // Server-side validation
        const validatedData = companySchema.parse(newCompany);

        const dataToInsert = {
          ...validatedData,
          logo_url: extractDomain(validatedData.company_url),
          user_id,
        };

        const { error } = await supabase.from(DBTable.COMPANY).insert(dataToInsert).select();

        if (error) {
          console.error("Create Company error duplicate:", error);
          if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
            await mpServerTrack("Duplicate company error", {
              company_name: newCompany.company_name,
              company_url: newCompany.company_url,
              error_message: error.message,
              user_id,
            });

            if (error.message.includes("company_name")) {
              return { success: false, error: ERROR_MESSAGES.DUPLICATE_NAME };
            }

            if (error.message.includes("company_url")) {
              return { success: false, error: ERROR_MESSAGES.DUPLICATE_URL };
            }
          }

          return { success: false, error: error.message };
        }

        await mpServerTrack("Company Added Success", {
          company_name: newCompany.company_name,
          company_url: newCompany.company_url,
          user_id,
        });

        return { success: true };
      } catch (err) {
        // Add general error tracking for non-duplicate errors
        console.error("Create Company error:", err);

        const errorMessage = err instanceof z.ZodError ? err.errors.map((issue) => issue.message).join(", ") : err instanceof Error ? err.message : "Unknown error occurred";

        await mpServerTrack("Company Added Error", {
          company_name: newCompany.company_name,
          company_url: newCompany.company_url,
          error: errorMessage,
          user_id,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    }, "CreateCompany");
  } catch (error) {
    // Handle rate limit errors or other withRateLimit errors
    console.error("Rate limit or wrapper error:", error);

    // Use your type guard to check for rate limit errors
    if (isRateLimitError(error)) {
      return { success: false, error: ERROR_MESSAGES.TOO_MANY_REQUESTS };
    }

    // For any other errors from withRateLimit
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default actionCreateCompany;
