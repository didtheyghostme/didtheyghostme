import { Metadata } from "next";
import { Suspense } from "react";

import { TableCompany } from "./TableCompany";

import { LoadingContent } from "@/components/LoadingContent";

export const metadata: Metadata = {
  title: "Companies",
};

export default function CompanyPage() {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<LoadingContent />}>
        <TableCompany />
      </Suspense>
    </div>
  );
}
