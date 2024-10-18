import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  SortDescriptor,
  Selection,
  ChipProps,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { parseDate } from "@internationalized/date";

import { ChevronDownIcon } from "@/components/icons";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";
import { formatDate } from "@/lib/formatDate";

type ColumnKey = keyof ProcessedApplication | "days_between";

type Column = {
  name: ColumnKey;
  sortable: boolean;
  displayName: string;
  mobileDisplayName: string;
};

const columns: Column[] = [
  { name: "applied_date", sortable: true, displayName: "Applied on", mobileDisplayName: "Applied on" },
  { name: "first_response_date", sortable: true, displayName: "First response on", mobileDisplayName: "First Response" },
  { name: "days_between", sortable: true, displayName: "No. of days", mobileDisplayName: "Days" },
  { name: "status", sortable: true, displayName: "Status", mobileDisplayName: "Status" },
];

type CustomSortDescriptor = Omit<SortDescriptor, "column"> & {
  column: ColumnKey;
};

type ChipColor = NonNullable<ChipProps["color"]>;

type StatusColorPriority = {
  color: ChipColor;
  priority: number;
};

const STATUS_MAP = {
  [APPLICATION_STATUS.APPLIED]: { color: "primary", priority: 1 },
  [APPLICATION_STATUS.INTERVIEWING]: { color: "primary", priority: 2 },
  [APPLICATION_STATUS.REJECTED]: { color: "danger", priority: 3 },
  [APPLICATION_STATUS.GHOSTED]: { color: "warning", priority: 4 },
  [APPLICATION_STATUS.OFFERED]: { color: "success", priority: 5 },
} as const satisfies Record<ApplicationStatus, StatusColorPriority>;

const statusOptions = Object.values(APPLICATION_STATUS);

const getStatusColorPriority = (status: ApplicationStatus): StatusColorPriority => {
  return STATUS_MAP[status];
};

const MAX_ROWS_PER_PAGE = 10;

interface TableOfAppliedApplicationProps {
  applications: ProcessedApplication[];
}

export default function TableOfAppliedApplication({ applications }: TableOfAppliedApplicationProps) {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [sortDescriptor, setSortDescriptor] = React.useState<CustomSortDescriptor>({
    column: "applied_date",
    direction: "ascending",
  });
  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor({
      column: descriptor.column as ColumnKey,
      direction: descriptor.direction,
    });
  };

  const [page, setPage] = React.useState(1);

  const filteredItems = React.useMemo(() => {
    if (statusFilter === "all") return applications;

    return applications.filter((application) => (statusFilter as Set<string>).has(application.status));
  }, [applications, statusFilter]);

  const pages = Math.ceil(filteredItems.length / MAX_ROWS_PER_PAGE);

  const calculateDaysBetween = (appliedDate: string, firstResponseDate: string | null): number => {
    if (!firstResponseDate) return 0;
    const applied = parseDate(appliedDate);
    const response = parseDate(firstResponseDate);

    return response.compare(applied);
  };

  const handleOnRowClick = (key: React.Key) => {
    console.log("Row clicked, key:", key);
    console.log("Current paginatedItems:", paginatedItems);

    const clickedApplication = paginatedItems.find((application) => application.id === key);

    if (clickedApplication) {
      console.log("Clicked application:", clickedApplication.id);
      router.push(`/interview/${clickedApplication.id}`);
    }
  };

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof ProcessedApplication];
      const second = b[sortDescriptor.column as keyof ProcessedApplication];

      if (sortDescriptor.column === "status") {
        const priorityA = getStatusColorPriority(a.status).priority;
        const priorityB = getStatusColorPriority(b.status).priority;

        return (priorityA - priorityB) * (sortDescriptor.direction === "descending" ? -1 : 1);
      }

      if (sortDescriptor.column === "days_between") {
        const daysA = calculateDaysBetween(a.applied_date, a.first_response_date);
        const daysB = calculateDaysBetween(b.applied_date, b.first_response_date);

        return (daysA - daysB) * (sortDescriptor.direction === "descending" ? -1 : 1);
      }

      if (first == null && second == null) return 0;
      if (first == null) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (second == null) return sortDescriptor.direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * MAX_ROWS_PER_PAGE;
    const end = start + MAX_ROWS_PER_PAGE;

    return sortedItems.slice(start, end);
  }, [page, sortedItems]);

  const renderCell = React.useCallback((application: ProcessedApplication, columnKey: ColumnKey) => {
    switch (columnKey) {
      case "applied_date":
      case "first_response_date":
        return <p>{application[columnKey] ? formatDate(application[columnKey]) : "N/A"}</p>;
      case "days_between":
        const days = calculateDaysBetween(application.applied_date, application.first_response_date);

        return <p>{application.first_response_date ? days : "N/A"}</p>;
      case "status":
        const statusInfo = getStatusColorPriority(application.status);

        return (
          <Chip className="text-center text-xs sm:text-sm" color={statusInfo.color} size="sm" variant="flat">
            {application.status}
          </Chip>
        );
      default:
        return <p className="text-xs sm:text-sm">{application[columnKey as keyof ProcessedApplication]}</p>;
    }
  }, []);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const handleStatusFilterChange = (keys: Selection) => {
    setStatusFilter(keys);
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col items-end">
        <Dropdown>
          <DropdownTrigger>
            <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
              Filter status
            </Button>
          </DropdownTrigger>
          <DropdownMenu disallowEmptySelection aria-label="Table Columns" closeOnSelect={false} selectedKeys={statusFilter} selectionMode="multiple" onSelectionChange={handleStatusFilterChange}>
            {statusOptions.map((status) => (
              <DropdownItem key={status}>{status}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }, [statusFilter]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="flex flex-row items-center justify-between px-2 py-2">
        <span className="text-small text-default-400"> {filteredItems.length} applicants </span>
        <div className="flex flex-1 items-center justify-end sm:flex-initial sm:justify-center">
          <Pagination isCompact showControls showShadow color="primary" page={page} total={pages} onChange={setPage} />
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
            Previous
          </Button>
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [filteredItems.length, page, pages, onPreviousPage, onNextPage]);

  return (
    <Table
      isHeaderSticky
      aria-label="Table of applied applications"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      selectionMode="single"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[500px]",
        th: "text-center py-2 px-1 sm:px-2 sm:text-sm",
        td: "text-center py-2 px-1 sm:px-2",
        tr: "cursor-pointer",
        sortIcon: "ml-0",
      }}
      onRowAction={handleOnRowClick}
      onSortChange={handleSortChange}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.name} align="center" allowsSorting={column.sortable}>
            <span className="hidden sm:inline">{column.displayName}</span>
            <span className="sm:hidden">{column.mobileDisplayName}</span>
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No applications found"} items={paginatedItems}>
        {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey as ColumnKey)}</TableCell>}</TableRow>}
      </TableBody>
    </Table>
  );
}
