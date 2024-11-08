import { Metadata } from "next";

import { AllJobPageContainer } from "./AllJobPageContainer";

export const metadata: Metadata = {
  title: "Internships & Jobs",
};

export default function JobsPage() {
  return <AllJobPageContainer />;
}
