export default function UsersPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-2 px-4 py-8">
        <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
          Users
        </h1>
        <p className="text-muted-foreground">
          User administration will be managed here.
        </p>
      </div>
    </div>
  );
}
