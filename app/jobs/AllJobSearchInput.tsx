"use client";

import React from "react";
import { Input } from "@nextui-org/react";

type AllJobSearchInputProps = {
  search: string;
  onSearchChange: (newSearch: string) => void;
};

export function AllJobSearchInput({ search, onSearchChange }: AllJobSearchInputProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return <Input className="mb-4" placeholder="Search jobs by title..." value={search} onChange={handleSearchChange} />;
}
