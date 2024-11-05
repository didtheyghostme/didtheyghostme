import { Metadata } from "next";

import AllJobPage from "./AllJobPage";

export const metadata: Metadata = {
  title: "Internships & Jobs",
};

export default function JobsRoute() {
  return <AllJobPage />;
}
