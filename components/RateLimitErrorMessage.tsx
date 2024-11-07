import type { RateLimitError } from "@/lib/errorHandling";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RateLimitErrorMessageProps {
  error: RateLimitError;
}

export function RateLimitErrorMessage({ error }: RateLimitErrorMessageProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    // reset is already in milliseconds from Upstash
    const resetTime = error.cause?.reset ?? 0;
    const now = Date.now();
    const remainingMs = Math.max(0, resetTime - now);

    return Math.ceil(remainingMs / 1000);
  });

  useEffect(() => {
    if (timeLeft > 0) {
      toast.error(`Too many requests. Please try again in ${timeLeft} seconds.`, {
        duration: 5000,
      });
    }

    const timer = setInterval(() => {
      setTimeLeft((_) => {
        const resetTime = error.cause?.reset ?? 0;
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((resetTime - now) / 1000));

        if (remaining <= 0) {
          clearInterval(timer);

          return 0;
        }

        return remaining;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [error.cause?.reset]);

  if (timeLeft === 0) return null;

  return (
    <div className="p-4 text-center">
      <h3 className="text-lg font-semibold text-red-600">Rate Limit Exceeded</h3>
      <p className="mt-2 text-gray-600">
        Please wait {timeLeft} {timeLeft === 1 ? "second" : "seconds"} before making more requests.
      </p>
    </div>
  );
}
