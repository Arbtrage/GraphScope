"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button.js";
import { cn } from "../../lib/utils.js";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center", className)}>
      <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
      <h3 className="text-lg font-medium">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
