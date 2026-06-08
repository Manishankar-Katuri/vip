import type { Metadata } from "next";
import { GlobalCommandPalette } from "@/components/intelligence-os";
import { Geist_Mono, Inter } from "next/font/google";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { HospitalContextProvider } from "@/providers/HospitalContextProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIP | Healthcare Growth Intelligence",
  description: "Multi-tenant, evidence-led and clinically governed healthcare growth playbooks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ReactQueryProvider>
          <HospitalContextProvider>
            {children}
            <GlobalCommandPalette />
          </HospitalContextProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
