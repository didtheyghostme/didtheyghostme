import AllJobSearch from "./AllJobSearch";
import { VerifiedJobsToggle } from "./VerifiedJobsToggle";

export default function AllJobPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold sm:text-2xl">All Job Postings</p>
        <VerifiedJobsToggle />
      </div>

      <div className="mt-4">
        <AllJobSearch />
      </div>
    </>
  );
}
