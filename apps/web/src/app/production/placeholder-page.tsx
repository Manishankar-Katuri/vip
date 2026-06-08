import { Hammer } from "lucide-react";
import { notFound } from "next/navigation";

export function ProductionPlaceholderPage({
  title
}: Readonly<{
  title:string;
}>) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900">
        <Hammer className="h-5 w-5" />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">
        Coming in next phase
      </h1>
    </div>
  );
}
