import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <SignUp />
      </div>
    </>
  );
}
