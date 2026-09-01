import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "N5Deal — M&A marketplace for regulated financial assets",
  description:
    "Buy and sell licensed fintech, banking and payment businesses. A working marketplace prototype.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteNav />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
          {children}
        </div>
        <footer className="border-t border-line py-6 text-center text-[13px] text-muted">
          N5Deal prototype · built for a technical assignment · not a real service
        </footer>
      </body>
    </html>
  );
}
