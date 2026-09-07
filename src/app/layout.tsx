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
        {children}
      </body>
    </html>
  );
}
