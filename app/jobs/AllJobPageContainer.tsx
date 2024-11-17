import { AllJobSearch } from "./AllJobSearch";

export function AllJobPageContainer() {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-base font-bold sm:text-2xl">All Job Postings</p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <AllJobSearch />
      </div>
    </>
  );
}
