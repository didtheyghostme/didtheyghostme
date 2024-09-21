"use client";

import { Button, Input, Spacer } from "@nextui-org/react";
import { FormEvent } from "react";

import TableCompany from "./TableCompany";

import { title } from "@/components/primitives";
import { useCreateCompany } from "@/lib/hooks/useCreateCompany";
import { getErrorMessage, isDuplicateUrlError } from "@/lib/errorHandling";

export default function DocsPage() {
  const { createCompany } = useCreateCompany();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.warn("Form submitted handle..");
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);

    console.log("Form data:", formData.get("companyName"), formData.get("companyURL"));

    // Check if inputs are empty
    if (!formData.get("companyName") || !formData.get("companyURL")) {
      console.error("Company name and URL are required");

      // Show error message or toast to user here
      return;
    }

    const newCompany: Company = {
      company_name: formData.get("companyName") as string,
      company_url: formData.get("companyURL") as string,
      // status: "pending",
    };

    try {
      await createCompany(newCompany);
      form.reset();
    } catch (error) {
      console.error("Error creating post:!!", getErrorMessage(error));
      if (isDuplicateUrlError(error)) {
        console.error("Duplicate company URL");
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TableCompany />

      {/* Form creation below */}

      <h1 className={title()}>Docs</h1>

      <h1 className={title({ color: "yellow" })}>Add a new job</h1>

      {/* input for the company name, date of the job */}

      {/* <Input
        className="max-w-[220px]"
        color="primary"
        defaultValue="junior@nextui.org"
        label="Email"
        placeholder="Enter your email"
        type="email"
      />

      <DatePicker isRequired className="max-w-[284px]" label="Birth date" /> */}

      <Spacer y={6} />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input isClearable isRequired label="Enter Company Name" name="companyName" type="text" />

        <Input isClearable isRequired label="Enter URL" name="companyURL" type="text" />

        <Button color="success" type="submit" variant="bordered">
          Submit
        </Button>
      </form>
    </div>
  );
}
