import { DatePicker, Input } from "@nextui-org/react";

import { title } from "@/components/primitives";

export default function DocsPage() {
  return (
    <div>
      <h1 className={title()}>Docs</h1>

      <h1 className={title({ color: "yellow" })}>Add a new job</h1>

      {/* input for the company name, date of the job */}

      <Input
        className="max-w-[220px]"
        color="primary"
        defaultValue="junior@nextui.org"
        label="Email"
        placeholder="Enter your email"
        type="email"
      />

      <DatePicker isRequired className="max-w-[284px]" label="Birth date" />
    </div>
  );
}
