import { Metadata } from "next";
import { Suspense } from "react";

import { AllJobPageContainer } from "./AllJobPageContainer";

import { LoadingContent } from "@/components/LoadingContent";

export const metadata: Metadata = {
  title: "Internships & Jobs",
};

export default function JobsPage() {
  return (
    <Suspense fallback={<LoadingContent />}>
      <AllJobPageContainer />
    </Suspense>
  );
}
