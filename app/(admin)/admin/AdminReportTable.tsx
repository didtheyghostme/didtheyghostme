"use client";

import { Key, useCallback } from "react";
import useSWR from "swr";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, User } from "@nextui-org/react";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";
import { AdminReportResponse } from "@/app/api/(admin)/admin/route";

type ColumnKey = keyof Pick<AdminReportResponse, "entity_type" | "report_type" | "report_message" | "report_status" | "created_at" | "resolution_notes" | "reporter" | "handler">;

export default function AdminReportTable() {
  const { data: reports, error } = useSWR<AdminReportResponse[]>(API.ADMIN.getAllReports, fetcher);

  const renderCell = useCallback((report: AdminReportResponse, columnKey: Key) => {
    // Type assertion here is safe because we control the column keys in TableHeader
    const key = columnKey as ColumnKey;

    switch (key) {
      case "reporter":
        return (
          <User
            name={report.reporter.full_name}
            avatarProps={{
              src: report.reporter.profile_pic_url,
            }}
          />
        );
      case "report_status":
        return <Chip color={report.report_status === "Pending" ? "warning" : report.report_status === "Resolved" ? "success" : "danger"}>{report.report_status}</Chip>;
      case "created_at":
        return formatDateDayMonthYear(report.created_at);
      case "handler":
        if (!report.handler) return "-";

        return (
          <User
            name={report.handler.full_name}
            avatarProps={{
              src: report.handler.profile_pic_url,
            }}
          />
        );
      default:
        // Type-safe access to report properties
        return report[key]?.toString() || "-";
    }
  }, []);

  if (error) return <div>Failed to load reports</div>;
  if (!reports) return <div>Loading...</div>;

  return (
    <Table aria-label="Admin reports table">
      <TableHeader>
        <TableColumn key="reporter">REPORTED BY</TableColumn>
        <TableColumn key="entity_type">TYPE</TableColumn>
        <TableColumn key="report_type">REPORT TYPE</TableColumn>
        <TableColumn key="report_message">MESSAGE</TableColumn>
        <TableColumn key="report_status">STATUS</TableColumn>
        <TableColumn key="created_at">CREATED</TableColumn>
        <TableColumn key="handler">HANDLED BY</TableColumn>
        <TableColumn key="resolution_notes">RESOLUTION NOTES</TableColumn>
      </TableHeader>
      <TableBody items={reports}>{(report) => <TableRow key={report.id}>{(columnKey) => <TableCell>{renderCell(report, columnKey)}</TableCell>}</TableRow>}</TableBody>
    </Table>
  );
}
