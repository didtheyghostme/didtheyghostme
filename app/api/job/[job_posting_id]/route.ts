import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { JobDetails } from "@/app/job/[job_posting_id]/page";

// TODO: on this job specific page, select all the applications for this job

export type SelectedJobPosting = Pick<JobPostingTable, "id" | "title" | "country" | "url" | "created_at" | "closed_at" | "company_id"> & {
  company: Pick<CompanyTable, "id" | "company_name">;
};

interface JoinConfig {
  table: (typeof DBTable)[keyof typeof DBTable]; // Table name
  alias?: string; // Optional alias for the joined table
  foreignKey?: string; // Type of join, default is 'inner'
  fields: readonly string[]; // Fields to select from the joined table
}

function createSelectQuery(mainFields: readonly string[], joins?: JoinConfig[]): string {
  // Convert main fields to string
  const mainSelect = mainFields.join(", ");

  if (!joins || joins.length === 0) {
    return mainSelect;
  }

  // Construct join select strings
  const joinSelects = joins.map((join) => {
    const { table, alias, foreignKey, fields } = join;

    // Determine the alias for the joined table
    const joinAlias = alias || table;

    // Supabase join syntax:
    // alias:table!foreignKey(fields)
    // Example: company:companies!company_id(id, company_name)
    return `${joinAlias}:${table}!${foreignKey}(${fields.join(", ")})`;
  });

  // Combine main select with join selects
  const fullSelect = `${mainSelect}, ${joinSelects.join(", ")}`;

  return fullSelect;
}

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const jobFields = ["id", "title", "country", "url"] as const satisfies readonly (keyof JobPostingTable)[];
  // const companyFields = ["id", "company_name"] as const satisfies readonly (keyof CompanyTable)[];

  // const query = createSelectQuery(jobFields, {
  //   [DBTable.COMPANY]: companyFields,
  // } as JoinConfig);
  const joins: JoinConfig[] = [
    {
      table: DBTable.COMPANY,
      alias: "company",
      foreignKey: "company_id",
      fields: ["id", "company_name"] as const satisfies readonly (keyof CompanyTable)[],
    },
  ];

  const selectQuery = createSelectQuery(jobFields, joins);
  console.log("select query is ", selectQuery);

  // const query = `
  //   ${jobFields.join(", ")},
  //   ${DBTable.COMPANY}!inner(${companyFields.join(", ")})
  // ` as const;

  const { data, error } = await supabase
    .from(DBTable.JOB_POSTING)
    .select(selectQuery)

    .eq("id", params.job_posting_id)
    .maybeSingle<JobDetails>();

  console.error("data in route handler of this joaab", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  console.warn("data in route handler of this job", data);

  return NextResponse.json(data);
}
