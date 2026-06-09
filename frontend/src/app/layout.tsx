import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/ReduxProvider";
import { ToastProvider } from "@/components/ToastProvider";
import Header from "@/components/Header";
import AdminSideBar from "@/components/admin/AdminSideBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vedic Puja Sanskar - Authentic Rudraksh & Puja Path",
  description: "Shop authentic Rudraksh malas, sacred puja path essentials, and spiritual products for your sacred journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: 'light' }}
    >
      <body className="min-h-full flex flex-col bg-white">
        <ToastProvider />
        <ReduxProvider>
          <Header />
          <div className="flex">
            <AdminSideBar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
