import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "Finlytics — Personal Finance Dashboard",
  description: "Track your income, expenses, and budgets in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint (see theme-context.tsx). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("finlytics:theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-canvas text-ink font-sans">
        {/* Theme wraps everything, including the login pages */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
