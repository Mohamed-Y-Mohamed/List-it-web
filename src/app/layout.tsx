// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext"; // Add this
// import MergedNavigation from "@/components/Navbar/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "List-it",
  description: "A productive and simplified task management tool.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      url: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/app-icon.jpeg",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-WJE2Z8G3QZ"
        ></script>
        <script id="google-analytics">
          {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-WJE2Z8G3QZ');
    `}
        </script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full min-h-screen`}
      >
        <AuthProvider>
          {" "}
          {/* Add the AuthProvider here */}
          <ThemeProvider>
            {/* <MergedNavigation> */}
            <div className="flex flex-col  w-full  min-h-50">
              {children}
              <Footer />
            </div>
            {/* </MergedNavigation> */}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
