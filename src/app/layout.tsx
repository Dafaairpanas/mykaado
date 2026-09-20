import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { Header } from "@/components/layout/header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jpFont = localFont({
  src: "../../public/fonts/UDDigiKyokashoN-R-01.ttf",
  variable: "--font-jp-custom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyKaado",
  description: "Learn Japanese with Spaced Repetition",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyKaado",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} ${jpFont.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme') || 'dark';
                let style = localStorage.getItem('style') || 'neobrutalism';
                let color = localStorage.getItem('color') || 'matcha';
                
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.setAttribute('data-style', style);
                document.documentElement.setAttribute('data-color', color);
                
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      {/* We use script injection to prevent flash of unstyled theme. We will implement ThemeProvider later */}
      <body className="antialiased" suppressHydrationWarning>
        <Suspense fallback={<div className="h-16" />}>
          <Header />
        </Suspense>
        <main className="flex-1 overflow-y-auto pt-8 pb-24 md:pb-8">
          {children}
          
          <footer className="mt-20 pb-8 text-center text-sm font-bold w-full">
            <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="text-[var(--color-text-muted)]">Created with <span className="text-red-500 animate-pulse inline-block">❤</span> by</span>
              <span className="text-[var(--color-btn-text)] bg-[var(--color-accent)] px-4 py-1.5 rounded-[var(--radius-sm)] shadow-[3px_3px_0px_var(--color-shadow-main)] border-[2px] border-[var(--color-border-main)] transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-shadow-main)] cursor-default">
                Aditya Rasya Dafa Putra
              </span>
            </div>
          </footer>
        </main>
      </body>
    </html>
  );
}
