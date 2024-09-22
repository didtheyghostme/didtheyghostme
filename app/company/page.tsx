"use client";

import { Button, Input, Spacer } from "@nextui-org/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import TableCompany from "./TableCompany";

import { title } from "@/components/primitives";
import { useCreateCompany } from "@/lib/hooks/useCreateCompany";
import { getErrorMessage, isDuplicateUrlError } from "@/lib/errorHandling";
import { CompanyFormData, companySchema } from "@/lib/schema/companySchema";

export default function CompanyPage() {
  const { createCompany } = useCreateCompany();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmit = async (data: CompanyFormData) => {
    console.log("Form data:", data);

    // const newCompany: Company = {
    //   company_name: formData.get("companyName") as string,
    //   company_url: formData.get("companyURL") as string,
    //   // status: "pending",
    // };

    try {
      await createCompany(data);
      reset();
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

      <h1 className={title()}>Companies</h1>

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

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input {...register("company_name")} isClearable isRequired errorMessage={errors.company_name?.message} isInvalid={!!errors.company_name} label="Enter Company Name" />

        <Input {...register("company_url")} isClearable isRequired errorMessage={errors.company_url?.message} isInvalid={!!errors.company_url} label="Enter URL" />

        <Button color="success" type="submit" variant="bordered">
          Submit
        </Button>
      </form>
    </div>
  );
}
