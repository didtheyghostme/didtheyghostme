import { Card, CardBody, CardHeader } from "@nextui-org/react";

import AdminReportTable from "./AdminReportTable";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </CardHeader>
        <CardBody>
          <AdminReportTable />
        </CardBody>
      </Card>
    </div>
  );
}
