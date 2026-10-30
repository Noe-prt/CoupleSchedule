import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Together — A little more in sync",
  description: "Two people. Two schedules. One shared week.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
