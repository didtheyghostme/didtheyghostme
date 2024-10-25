"use client";

import React from "react";
import { Input } from "@nextui-org/react";

type AllJobSearchInputProps = {
  search: string;
  onSearchChange: (newSearch: string) => void;
};

export default function AllJobSearchInput({ search, onSearchChange }: AllJobSearchInputProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return <Input className="mb-4" placeholder="Search jobs..." value={search} onChange={handleSearchChange} />;
}
