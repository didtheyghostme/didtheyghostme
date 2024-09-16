import { SignIn } from "@clerk/nextjs";

export default function Page() {
  // TODO: add clerk/theme
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <SignIn />
      </div>
    </>
  );
}
