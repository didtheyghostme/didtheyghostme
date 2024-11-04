"use client";

import React, { useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button, Pagination, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import useSWR from "swr";
import { usePathname, useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { SignedOut } from "@clerk/nextjs";
import { SignedIn } from "@clerk/nextjs";
import { useQueryState, parseAsStringLiteral } from "nuqs";

import { CreateCompanyModal } from "./CreateCompanyModal";

import { PlusIcon, SearchIcon, ChevronDownIcon } from "@/components/icons";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";

type ColumnKey = keyof Pick<CompanyTable, "company_name" | "company_url">;

type Column = {
  name: ColumnKey;
  displayName: string;
};

const columns: Column[] = [
  { name: "company_name", displayName: "Company Name" },
  { name: "company_url", displayName: "Company URL" },
];

const sortOptions = [
  { key: "name_asc", label: "Company Name: A to Z", column: "company_name", direction: "ascending" },
  { key: "name_desc", label: "Company Name: Z to A", column: "company_name", direction: "descending" },
] as const;

type SortOption = (typeof sortOptions)[number];

export default function TableCompany() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const { data: companies = [], isLoading } = useSWR<CompanyTable[]>(API.COMPANY.getAll, fetcher);
  const router = useRouter();

  const [currentSort, setCurrentSort] = useQueryState("sort", parseAsStringLiteral(sortOptions.map((option) => option.key)).withDefault("name_asc"));

  const [filterValue, setFilterValue] = React.useState("");
  const [page, setPage] = React.useState(1);
  const ROWS_PER_PAGE = 10;

  const hasSearchFilter = Boolean(filterValue);

  const sortedAndFilteredItems = React.useMemo(() => {
    let filteredCompanies = [...companies];

    if (hasSearchFilter) {
      filteredCompanies = filteredCompanies.filter((company) => company.company_name.toLowerCase().includes(filterValue.toLowerCase()));
    }

    // Add sorting
    const sortOption = sortOptions.find((option) => option.key === currentSort) || sortOptions[0];

    return [...filteredCompanies].sort((a, b) => {
      const first = a[sortOption.column];
      const second = b[sortOption.column];

      const cmp = first.toLowerCase() < second.toLowerCase() ? -1 : first.toLowerCase() > second.toLowerCase() ? 1 : 0;

      return sortOption.direction === "descending" ? -cmp : cmp;
    });
  }, [companies, filterValue, currentSort]);

  const pages = Math.ceil(sortedAndFilteredItems.length / ROWS_PER_PAGE);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return sortedAndFilteredItems.slice(start, end);
  }, [page, sortedAndFilteredItems]);

  const renderCell = React.useCallback((company: CompanyTable, columnKey: ColumnKey) => {
    const cellValue = company[columnKey];

    switch (columnKey) {
      case "company_name":
        return <p className="text-bold text-small capitalize">{company.company_name}</p>;
      case "company_url":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small text-default-400">{company.company_url}</p>
          </div>
        );
      default:
        return cellValue;
    }
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

  const handleSortChange = (key: SortOption["key"]) => {
    setCurrentSort(key);
  };

  const handleOnRowClick = (key: React.Key) => {
    const clickedCompany = paginatedItems.find((company) => company.id === key);

    if (clickedCompany) {
      router.push(`/company/${clickedCompany.id}`);
    }
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Input
            isClearable
            placeholder="Search by company name..."
            startContent={<SearchIcon className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            classNames={{
              base: "w-full sm:max-w-[44%]", // Keep existing max-width for larger screens
              inputWrapper: "border-1",
            }}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex flex-row justify-end gap-3">
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
            <SignedIn>
              <Button color="primary" endContent={<PlusIcon />} onPress={() => setIsModalOpen(true)}>
                Add New
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                <Button color="primary" endContent={<PlusIcon />}>
                  Add New
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">Total {companies.length} companies</span>
        </div>
      </div>
    );
  }, [filterValue, companies.length, onSearchChange, currentSort]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="flex items-center justify-center px-2 py-2">
        <Pagination isCompact showControls showShadow color="primary" page={page} total={pages} onChange={setPage} />
      </div>
    );
  }, [page, pages]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Table
        isHeaderSticky
        aria-label="Companies table"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        selectionMode="single"
        topContent={topContent}
        topContentPlacement="outside"
        classNames={{
          wrapper: "max-h-[500px]",
          tr: "cursor-pointer",
        }}
        onRowAction={handleOnRowClick}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.name} align="start">
              {column.displayName}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No companies found"} items={paginatedItems}>
          {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey as ColumnKey)}</TableCell>}</TableRow>}
        </TableBody>
      </Table>

      <CreateCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
