import { title } from "./primitives";

type EmptyStateProps = {
  heading?: string;
  message?: string;
  className?: string;
  padding?: string;
};

export function EmptyContent({ heading = "No items found", message = "Nothing to display at the moment", className = "min-h-[100px]", padding = "py-4 sm:py-12" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${padding} ${className}`}>
      <div
        className={title({
          size: "sm",
          color: "foreground",
          className: "opacity-80",
        })}
      >
        {heading}
      </div>
      <span className="max-w-md text-center text-default-400">{message}</span>
    </div>
  );
}
