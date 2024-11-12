import { AllJobSearch } from "./AllJobSearch";
import { VerifiedJobsToggle } from "./VerifiedJobsToggle";

export function AllJobPageContainer() {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-base font-bold sm:text-2xl">All Job Postings</p>
        <VerifiedJobsToggle />
      </div>

      <div className="mt-4">
        <AllJobSearch />
      </div>
    </>
  );
}
