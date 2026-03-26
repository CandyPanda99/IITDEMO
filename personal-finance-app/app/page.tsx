export default function HomePage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome to Personal Finance</h1>
      </div>
      <p className="text-muted-foreground mt-4">
        Please select an option from the navigation menu above to manage your finances.
      </p>
    </main>
  );
}
