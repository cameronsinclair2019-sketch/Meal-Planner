import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TJ Meal Planner",
  description: "Trader Joe's price book, meal planning, and grocery budgeting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <nav className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-3 flex gap-4 text-sm">
            <a href="/" className="font-medium hover:underline">
              Price Book
            </a>
            <a href="/recipes" className="font-medium hover:underline">
              Recipes
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
