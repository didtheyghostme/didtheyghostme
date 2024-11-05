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
  Selection,
  ChipProps,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { parseDate } from "@internationalized/date";
import { parseAsStringLiteral, parseAsArrayOf, useQueryStates, parseAsInteger } from "nuqs";
import mixpanel from "mixpanel-browser";

import { ChevronDownIcon } from "@/components/icons";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";

type ColumnKey = keyof Pick<ProcessedApplication, "status" | "applied_date" | "first_response_date"> | "days_between";

type Column = {
  name: ColumnKey;
  displayName: string;
  mobileDisplayName: string;
};

const columns: Column[] = [
  { name: "applied_date", displayName: "Applied on", mobileDisplayName: "Applied on" },
  { name: "first_response_date", displayName: "First response on", mobileDisplayName: "First Response" },
  { name: "days_between", displayName: "No. of days", mobileDisplayName: "Days" },
  { name: "status", displayName: "Status", mobileDisplayName: "Status" },
];

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

type SortOptionDefinition = {
  key: string;
  label: string;
  column: ColumnKey;
  direction: "ascending" | "descending";
};

const sortOptions = [
  { key: "applied_date_asc", label: "Applied on: Oldest to Newest", column: "applied_date", direction: "ascending" },
  { key: "applied_date_desc", label: "Applied on: Newest to Oldest", column: "applied_date", direction: "descending" },
  { key: "first_response_date_asc", label: "First response on: Oldest to Newest", column: "first_response_date", direction: "ascending" },
  { key: "first_response_date_desc", label: "First response on: Newest to Oldest", column: "first_response_date", direction: "descending" },
  { key: "days_between_asc", label: "No. of days: Low to High", column: "days_between", direction: "ascending" },
  { key: "days_between_desc", label: "No. of days: High to Low", column: "days_between", direction: "descending" },
  { key: "status_asc", label: "Status: Applied to Offered", column: "status", direction: "ascending" },
  { key: "status_desc", label: "Status: Offered to Applied", column: "status", direction: "descending" },
] as const satisfies readonly SortOptionDefinition[];

type SortOption = (typeof sortOptions)[number];

type StatusFilterOption = ApplicationStatus | "all";

const statusFilterOptions = ["all", ...Object.values(APPLICATION_STATUS)] as const satisfies readonly StatusFilterOption[];

interface TableOfAppliedApplicationProps {
  applications: ProcessedApplication[];
}

function generateMockApplication(id: number): ProcessedApplication {
  const statuses = Object.values(APPLICATION_STATUS);
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const appliedDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
  const firstResponseDate = Math.random() > 0.3 ? new Date(appliedDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null;

  return {
    id: id.toString(),
    applied_date: appliedDate.toISOString().split("T")[0],
    first_response_date: firstResponseDate ? firstResponseDate.toISOString().split("T")[0] : null,
    status: randomStatus,
    created_at: appliedDate.toISOString(),
    updated_at: appliedDate.toISOString(),
    job_posting_id: "1",
    isCurrentUserItem: false,
    user_data: {
      full_name: "John Doe",
      profile_pic_url: "https://example.com/profile.jpg",
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockApplications(count: number): ProcessedApplication[] {
  return Array.from({ length: count }, (_, index) => generateMockApplication(index + 1));
}

// const applications = generateMockApplications(100);

export default function TableOfAppliedApplication({ applications }: TableOfAppliedApplicationProps) {
  const router = useRouter();

  const [{ status: statusFilter, sort: currentSort, page }, setQueryStates] = useQueryStates({
    status: parseAsArrayOf(parseAsStringLiteral(statusFilterOptions)).withDefault(["all"]),
    sort: parseAsStringLiteral(sortOptions.map((option) => option.key)).withDefault("applied_date_asc"),
    page: parseAsInteger.withDefault(1),
  });

  const filteredItems = React.useMemo(() => {
    if (statusFilter.includes("all")) return applications;

    return applications.filter((application) => statusFilter.includes(application.status));
  }, [applications, statusFilter]);

  const pages = Math.ceil(filteredItems.length / MAX_ROWS_PER_PAGE);

  const calculateDaysBetween = (appliedDate: string, firstResponseDate: string | null): number => {
    if (!firstResponseDate) return 0;
    const applied = parseDate(appliedDate);
    const response = parseDate(firstResponseDate);

    return response.compare(applied);
  };

  const handleOnRowClick = (key: React.Key) => {
    const clickedApplication = paginatedItems.find((application) => application.id === key);

    if (clickedApplication) {
      router.push(`/interview/${clickedApplication.id}`);
    }
  };

  const sortedItems = React.useMemo(() => {
    const sortOption = sortOptions.find((option) => option.key === currentSort) || sortOptions[0];

    return [...filteredItems].sort((a, b) => {
      const { column, direction } = sortOption;
      const first = a[column as keyof ProcessedApplication];
      const second = b[column as keyof ProcessedApplication];

      if (column === "status") {
        const priorityA = getStatusColorPriority(a.status).priority;
        const priorityB = getStatusColorPriority(b.status).priority;

        return (priorityA - priorityB) * (direction === "descending" ? -1 : 1);
      }

      if (column === "days_between") {
        const daysA = calculateDaysBetween(a.applied_date, a.first_response_date);
        const daysB = calculateDaysBetween(b.applied_date, b.first_response_date);

        return (daysA - daysB) * (direction === "descending" ? -1 : 1);
      }

      if (first == null && second == null) return 0;
      if (first == null) return direction === "descending" ? 1 : -1;
      if (second == null) return direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return direction === "descending" ? -cmp : cmp;
    });
  }, [currentSort, filteredItems]);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * MAX_ROWS_PER_PAGE;
    const end = start + MAX_ROWS_PER_PAGE;

    return sortedItems.slice(start, end);
  }, [page, sortedItems]);

  const renderCell = React.useCallback((application: ProcessedApplication, columnKey: ColumnKey) => {
    switch (columnKey) {
      case "applied_date":
        return <p>{formatDateDayMonthYear(application.applied_date)}</p>;
      case "first_response_date":
        return <p>{application.first_response_date ? formatDateDayMonthYear(application.first_response_date) : "N/A"}</p>;
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _exhaustiveCheck: never = columnKey;

        throw new Error(`Unhandled column key: ${_exhaustiveCheck}`);
    }
  }, []);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setQueryStates({ page: page + 1 });
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setQueryStates({ page: page - 1 });
    }
  }, [page, pages]);

  const handleStatusFilterChange = (keys: Selection) => {
    const selectedKeys = Array.from(keys as Set<string>) as StatusFilterOption[];

    mixpanel.track("Applied Applications Table Tab", {
      action: "filter_status_button_clicked",
      previous_filter: statusFilter,
      new_filter: selectedKeys,
    });

    if (selectedKeys.length === 0 || selectedKeys.length === statusFilterOptions.length - 1) {
      setQueryStates({ status: ["all"] });
    } else {
      setQueryStates({ status: selectedKeys });
    }
  };

  const handleSortChange = (key: SortOption["key"]) => {
    mixpanel.track("Applied Applications Table Tab", {
      action: "sort_by_button_clicked",
      sort_key: key,
    });
    setQueryStates({ sort: key });
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                Sort by
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Sort options"
              selectedKeys={new Set([currentSort])}
              selectionMode="single"
              onSelectionChange={(keys) => handleSortChange(Array.from(keys)[0] as SortOption["key"])}
            >
              {sortOptions.map((option) => (
                <DropdownItem key={option.key}>{option.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                Filter status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={new Set(statusFilter.includes("all") ? statusOptions : statusFilter)}
              selectionMode="multiple"
              onSelectionChange={handleStatusFilterChange}
            >
              {statusOptions.map((status) => (
                <DropdownItem key={status}>{status}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    );
  }, [currentSort, statusFilter]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="flex flex-row items-center justify-between px-2 py-2">
        <span className="text-small text-default-400"> {filteredItems.length} applicants </span>
        <div className="flex flex-1 items-center justify-end sm:flex-initial sm:justify-center">
          <Pagination isCompact showControls showShadow color="primary" page={page} total={pages} onChange={(newPage) => setQueryStates({ page: newPage })} />
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
      topContent={topContent}
      topContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[500px]",
        th: "text-center py-2 px-1 sm:px-2 sm:text-sm cursor-default",
        td: "text-center py-2 px-1 sm:px-2",
        tr: "cursor-pointer",
      }}
      onRowAction={handleOnRowClick}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.name} align="center">
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
