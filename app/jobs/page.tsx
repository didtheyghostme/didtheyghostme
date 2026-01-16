import { Metadata } from "next";

import { AllJobPageContainer } from "./AllJobPageContainer";

export const metadata: Metadata = {
  title: "Internships & Jobs Singapore 2026 Summer | Tech Internships SG",
  description: "Find software engineering, product management, and tech internships in Singapore for Summer 2026. Track GitHub Summer 2026 internships and other SG tech roles in one place.",
};

export default function JobsPage() {
  return <AllJobPageContainer />;
}
