import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import PWAProvider from "@/components/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "List It - Smart Task Management",
  description:
    "Organize your tasks, notes, and projects efficiently with List It",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "List It",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only render GA scripts when a valid-format measurement ID is configured.
  // Validates that the ID matches Google's GA4 (G-XXXXXXXXXX) or
  // Universal Analytics (UA-XXXXXXXX-X) format to prevent accidental injection.
  const gaIdPattern = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/;
  const gaId =
    process.env.NEXT_PUBLIC_GA_ID &&
    gaIdPattern.test(process.env.NEXT_PUBLIC_GA_ID)
      ? process.env.NEXT_PUBLIC_GA_ID
      : null;

  return (
    <html lang="en" className="w-full h-full">
      <head>
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            ></script>
            <script id="google-analytics">
              {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaId}');
              `}
            </script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full min-h-screen`}
      >
        <AuthProvider>
          <ThemeProvider>
            <PWAProvider>
              <div className="flex flex-col w-full min-h-50">
                {children}
                <Footer />
              </div>
            </PWAProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
