import { useEffect } from "react";
import { toast } from "sonner";

export function RateLimitErrorMessage() {
  useEffect(() => {
    toast.error("Too many requests. Please try again later.", {
      duration: 5000,
    });
  }, []);

  return (
    <div className="p-4 text-center">
      <h3 className="text-lg font-semibold text-red-600">Rate Limit Exceeded</h3>
      <p className="mt-2 text-gray-600">Please try again later.</p>
    </div>
  );
}
