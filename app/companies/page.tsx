import { Metadata } from "next";

import { TableCompany } from "./TableCompany";

export const metadata: Metadata = {
  title: "Companies",
};

export default function CompanyPage() {
  return (
    <div className="flex flex-col gap-4">
      <TableCompany />
    </div>
  );
}
