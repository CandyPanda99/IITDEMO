"use client";

import { Badge } from "@/components/ui/badge";

interface RecurringBadgeProps {
  frequency: "WEEKLY" | "MONTHLY" | "YEARLY";
}

const labels: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function RecurringBadge({ frequency }: RecurringBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs">
      ↺ {labels[frequency]}
    </Badge>
  );
}
