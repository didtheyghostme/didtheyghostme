import Link from "next/link";
import { Button } from "@heroui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
      {/* 404 heading */}
      <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">404</h1>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-default-600 md:text-2xl">Page Not Found</h2>
        <p className="max-w-md text-lg text-default-500">Looks like this page ghosted you. Don&apos;t worry, it happens to the best of us.</p>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-4">
        <Button as={Link} className="min-w-[200px] font-medium transition-transform ease-in-out hover:scale-105" color="primary" href="/" size="lg" variant="solid">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
