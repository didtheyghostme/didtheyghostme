import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
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
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { columns } from "./data";

import { ChevronDownIcon, PlusIcon, SearchIcon, VerticalDotsIcon } from "@/components/icons";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";

type ColumnKey = keyof Company | "actions";

type CustomSortDescriptor = Omit<SortDescriptor, "column"> & {
  column: ColumnKey;
};

type ChipColor = NonNullable<ChipProps["color"]>;

type StatusColorPriority = {
  color: ChipColor;
  priority: number;
};

const STATUS_MAP = {
  Active: { color: "success", priority: 1 },
  Vacation: { color: "warning", priority: 2 },
  Paused: { color: "danger", priority: 3 },
  default: { color: "default", priority: Number.MAX_SAFE_INTEGER },
} as const;

const statusOptions = Object.keys(STATUS_MAP).filter((key): key is Exclude<keyof typeof STATUS_MAP, "default"> => key !== "default");

const getStatusColorPriority = (status: string | null): StatusColorPriority => {
  if (status && status in STATUS_MAP) {
    return STATUS_MAP[status as keyof typeof STATUS_MAP];
  }

  return STATUS_MAP.default;
};

const INITIAL_VISIBLE_COLUMNS = ["company_name", "company_url", "status", "actions"] as const;

const MAX_ROWS_PER_PAGE = 10;

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function TableCompany() {
  const { data: companies = [], isLoading } = useSWR<Company[]>(API.COMPANY.getAll, fetcher);
  const router = useRouter();

  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(MAX_ROWS_PER_PAGE);
  const [sortDescriptor, setSortDescriptor] = React.useState<CustomSortDescriptor>({
    column: "company_name",
    direction: "ascending",
  });
  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor({
      column: descriptor.column as ColumnKey,
      direction: descriptor.direction,
    });
  };
  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all" || (visibleColumns instanceof Set && visibleColumns.has("all"))) return columns;

    return columns.filter((column) => Array.from(visibleColumns).includes(column.name));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredCompanies = [...companies];

    if (hasSearchFilter) {
      filteredCompanies = filteredCompanies.filter((company) => company.company_name.toLowerCase().includes(filterValue.toLowerCase()));
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filteredCompanies = filteredCompanies.filter((company) => Array.from(statusFilter).includes(company.status as string));
    }

    return filteredCompanies;
  }, [companies, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Company];
      const second = b[sortDescriptor.column as keyof Company];

      if (sortDescriptor.column === "status") {
        const priorityA = getStatusColorPriority(a.status).priority;
        const priorityB = getStatusColorPriority(b.status).priority;

        return (priorityA - priorityB) * (sortDescriptor.direction === "descending" ? -1 : 1);
      }

      if (first == null && second == null) return 0;
      if (first == null) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (second == null) return sortDescriptor.direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedItems.slice(start, end);
  }, [page, rowsPerPage, sortedItems]);

  const renderCell = React.useCallback((company: Company, columnKey: ColumnKey) => {
    const cellValue = company[columnKey as keyof Company];

    switch (columnKey) {
      case "company_name":
        return <p className="text-bold text-tiny capitalize">{company.company_name}</p>;
      case "company_url":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-bold text-tiny capitalize text-default-400">{company.company_url}</p>
          </div>
        );
      case "status":
        const statusInfo = getStatusColorPriority(company.status);

        return (
          <Chip className="capitalize" color={statusInfo.color} size="sm" variant="flat">
            {cellValue ?? "Unknown"}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center justify-end gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem>View</DropdownItem>
                <DropdownItem>Edit</DropdownItem>
                <DropdownItem>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
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

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const handleOnRowClick = (key: React.Key) => {
    console.log("Row clicked, key:", key);
    console.log("Current paginatedItems:", paginatedItems);

    const clickedCompany = paginatedItems.find((company) => company.id === Number(key));

    if (clickedCompany) {
      console.log("Clicked company:", clickedCompany.company_name);
      router.push(`/company/${clickedCompany.id}`);
    }
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            isClearable
            placeholder="Search by company name..."
            startContent={<SearchIcon className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu disallowEmptySelection aria-label="Table Columns" closeOnSelect={false} selectedKeys={statusFilter} selectionMode="multiple" onSelectionChange={setStatusFilter}>
                {statusOptions.map((status) => (
                  <DropdownItem key={status} className="capitalize">
                    {capitalize(status)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu disallowEmptySelection aria-label="Table Columns" closeOnSelect={false} selectedKeys={visibleColumns} selectionMode="multiple" onSelectionChange={setVisibleColumns}>
                {columns.map((column) => (
                  <DropdownItem key={column.name} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button color="primary" endContent={<PlusIcon />}>
              Add New
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">Total {companies.length} companies</span>
          <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select className="bg-transparent text-small text-default-400 outline-none" onChange={onRowsPerPageChange}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [filterValue, statusFilter, visibleColumns, onRowsPerPageChange, companies.length, onSearchChange, hasSearchFilter]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="flex items-center justify-between px-2 py-2">
        <span className="w-[30%] text-small text-default-400">{selectedKeys === "all" ? "All items selected" : `${selectedKeys.size} of ${filteredItems.length} selected`}</span>
        <Pagination isCompact showControls showShadow color="primary" page={page} total={pages} onChange={setPage} />
        <div className="hidden w-[30%] justify-end gap-2 sm:flex">
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
            Previous
          </Button>
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a skeleton/loading component
  }

  return (
    <Table
      isHeaderSticky
      aria-label="Example table with custom cells, pagination and sorting"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[500px]",
      }}
      onRowAction={handleOnRowClick}
      onSelectionChange={setSelectedKeys}
      onSortChange={handleSortChange}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn key={column.name} align={column.name === "actions" ? "center" : "start"} allowsSorting={column.sortable} className="uppercase">
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No users found"} items={paginatedItems}>
        {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey as ColumnKey)}</TableCell>}</TableRow>}
      </TableBody>
    </Table>
  );
}
