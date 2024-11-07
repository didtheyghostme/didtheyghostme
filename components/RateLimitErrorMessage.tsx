import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

export function RateLimitErrorMessage() {
  useEffect(() => {
    toast.error("Too many requests. Please try again later.", {
      duration: 5000,
    });
  }, []);

  return (
    <div className="p-6 text-center">
      <p className="mt-4 text-lg font-semibold text-red-600">Too many requests</p>
      <p className="mt-2 text-gray-600">You have made too many requests too quickly. Please wait a while before trying again</p>
      <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
        <Link className="hover:underline" href="/contact?toomanyrequest">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
