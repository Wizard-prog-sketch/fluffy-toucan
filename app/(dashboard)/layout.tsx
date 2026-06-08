import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <span className="text-violet-400 text-xl">✦</span>
            <span>Fluffy Toucan</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/stories" className="hover:text-white transition-colors">Stories</Link>
            <Link href="/stories/new" className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors">
              + New Story
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
