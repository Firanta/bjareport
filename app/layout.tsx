import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | BJA Report",
    default: "BJA Report — PT Wanna Mulia Sejahtera",
  },
  description:
    "Sistem manajemen tagihan transportasi material batu split PT Wanna Mulia Sejahtera",
  robots: "noindex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: "rgba(10, 5, 20, 0.95)",
                border: "1px solid rgba(139,92,246,0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                color: "rgba(255,255,255,0.9)",
                boxShadow: "0 20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.1)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
