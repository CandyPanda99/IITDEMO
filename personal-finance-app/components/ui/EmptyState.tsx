interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No data",
  description = "Nothing to show here yet.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
