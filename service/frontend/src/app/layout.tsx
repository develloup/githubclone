import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/NavBar"; // Menu component included

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GH/L Clone",
  description: "The github and gitlab clone is used to use the rest apis to provide additional functionality to github ui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar /> {/* ✅ Inserts the navigation bar */}
        <main> {/* 🔹 Wrapper for children to make sure that only one element exists. */}
          {children}
        </main>
      </body>
    </html>
  );
}