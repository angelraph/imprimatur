import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Wordmark } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-dark flex min-h-screen flex-1 flex-col lg:flex-row">
      <aside className="border-b border-rule bg-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:px-5 lg:py-5">
          <Wordmark size={24} />
          <Link href="/sit" className="rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-semibold text-white lg:hidden">
            New exam
          </Link>
        </div>
        <AppNav />
        <p className="mt-auto hidden px-5 pb-5 pt-8 text-xs leading-relaxed text-muted lg:block">
          Every vendor, wallet and invoice in an exam is invented.
        </p>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
