"use client";

import React, { Suspense, useState } from "react";
import { Input, Pagination, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Link } from "@heroui/react";
import useSWR from "swr";
import { usePathname } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { SignedOut } from "@clerk/nextjs";
import { SignedIn } from "@clerk/nextjs";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import mixpanel from "mixpanel-browser";
import NextLink from "next/link";

import { CreateCompanyModal } from "./CreateCompanyModal";

import { PlusIcon, SearchIcon, ChevronDownIcon } from "@/components/icons";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { GetAllCompaniesResponse } from "@/app/api/company/route";
import { CustomButton } from "@/components/CustomButton";
import { ClickType, getClickType, isMiddleClick } from "@/lib/getClickType";

const sortOptions = [
  { key: "name_asc", label: "Company Name: A to Z", column: "company_name", direction: "ascending" },
  { key: "name_desc", label: "Company Name: Z to A", column: "company_name", direction: "descending" },
] as const;

type SortOption = (typeof sortOptions)[number];

export function TableCompanyContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const { data: companies = [], isLoading, error } = useSWR<GetAllCompaniesResponse[]>(API.COMPANY.getAll, fetcher);

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

  const pages = Math.max(1, Math.ceil(sortedAndFilteredItems.length / ROWS_PER_PAGE));

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return sortedAndFilteredItems.slice(start, end);
  }, [page, sortedAndFilteredItems]);

  const onSearchChange = (value: string) => {
    if (value) {
      mixpanel.track("Company Table", {
        action: "search",
        search_term: value,
        current_page: page,
        total_pages: pages,
      });
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  };

  const onClear = () => {
    mixpanel.track("Company Table", {
      action: "clear_search",
      search_term: filterValue,
      current_page: page,
      total_pages: pages,
    });
    setFilterValue("");
    setPage(1);
  };

  const handleSortChange = (key: SortOption["key"]) => {
    mixpanel.track("Company Table", {
      action: "sort_changed",
      search_term: filterValue,
      sort_key: key,
      current_page: page,
      total_pages: pages,
    });
    setCurrentSort(key);
    setPage(1);
  };

  const mixpanelTrackOnRowClick = (companyId: string, clickType: ClickType) => {
    const clickedCompany = companies.find((company) => company.id === companyId);

    mixpanel.track("Company Table", {
      click_type: clickType,
      company_id: companyId,
      company_name: clickedCompany?.company_name,
      search_term: filterValue,
      current_page: page,
      total_pages: pages,
    });
  };

  // Track pagination
  const handlePageChange = (newPage: number) => {
    mixpanel.track("Company Table", {
      action: "page_changed",
      search_term: filterValue,
      from_page: page,
      to_page: newPage,
      current_page: page,
      total_pages: pages,
    });
    setPage(newPage);
  };

  // Track modal interactions
  const handleModalOpen = () => {
    mixpanelTrackModalOpen();
    setIsModalOpen(true);
  };

  const mixpanelTrackModalOpen = () => {
    mixpanel.track("Company Table", {
      action: "add_company_modal_opened",
      search_term: filterValue,
      current_page: page,
      total_pages: pages,
    });
  };

  const mixpanelTrackModalClose = () => {
    mixpanel.track("Company Table", {
      action: "add_company_modal_closed",
      search_term: filterValue,
      current_page: page,
      total_pages: pages,
    });
  };

  const mixpanelTrackLearnHowToAddNewCompanyClick = () => {
    mixpanel.track("Company Table", {
      action: "learn_how_to_add_new_company_clicked",
      search_term: filterValue,
      current_page: page,
      total_pages: pages,
    });
  };

  const handleModalClose = () => {
    mixpanelTrackModalClose();
    setIsModalOpen(false);
  };

  const handleSubmitSuccess = () => {
    setIsModalOpen(false);
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
                <CustomButton endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Sort by
                </CustomButton>
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
              <CustomButton color="primary" endContent={<PlusIcon />} onPress={handleModalOpen}>
                Add New
              </CustomButton>
            </SignedIn>
            <SignedOut>
              <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                <CustomButton color="primary" endContent={<PlusIcon />} onPress={mixpanelTrackModalOpen}>
                  Add New
                </CustomButton>
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
    if (sortedAndFilteredItems.length === 0) {
      return null;
    }

    return (
      <div className="flex items-center justify-center px-2 py-2">
        <Pagination isCompact showControls showShadow color="primary" page={page} total={pages} onChange={handlePageChange} />
      </div>
    );
  }, [page, pages, sortedAndFilteredItems.length]);

  // Handle rate limit error
  if (error) {
    if (isRateLimitError(error)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Failed to load companies" />;
  }

  if (isLoading) {
    return <LoadingContent />;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Top Content */}
        {topContent}

        {/* Company List */}
        <div className="flex flex-col gap-2">
          {/* Header - Visible on all devices */}
          <div className="grid grid-cols-2 border-b border-divider pb-2">
            <div className="text-small font-semibold text-default-600">Company Name</div>
            <div className="text-small font-semibold text-default-600">Company URL</div>
          </div>

          {/* Company Rows */}
          {paginatedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <span className="text-default-400">No companies found.</span>

              <Link showAnchorIcon className="inline-flex items-center gap-1" color="primary" href="/tutorial" underline="hover" onPress={mixpanelTrackLearnHowToAddNewCompanyClick}>
                Learn how to add new company
              </Link>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <NextLink
                key={item.id}
                className="group rounded-medium border border-transparent bg-content1 transition-colors hover:border-primary hover:bg-content2"
                href={`/company/${item.id}`}
                onClick={(e) => mixpanelTrackOnRowClick(item.id, getClickType(e))}
                onContextMenu={() => mixpanelTrackOnRowClick(item.id, "right_clicked")}
                onAuxClick={(e) => {
                  if (isMiddleClick(e)) {
                    mixpanelTrackOnRowClick(item.id, "middle_clicked");
                  }
                }}
              >
                <div className="grid grid-cols-2 gap-2 p-4">
                  <div className="break-words text-small capitalize text-foreground">{item.company_name}</div>
                  <div className="break-words text-small text-default-400">{item.company_url}</div>
                </div>
              </NextLink>
            ))
          )}
        </div>
        {/* Bottom Pagination */}
        {bottomContent}

        {/* Modal */}
        <CreateCompanyModal isOpen={isModalOpen} onClose={handleModalClose} onSubmitSuccess={handleSubmitSuccess} />
      </div>
    </>
  );
}

export function TableCompany() {
  return (
    <Suspense fallback={<LoadingContent />}>
      <TableCompanyContent />
    </Suspense>
  );
}
