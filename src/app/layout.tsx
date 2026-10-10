import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import PWAProvider from "@/components/PWAProvider";
import NativeShell from "@/components/native/NativeShell";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { SURFACE_RAMPS } from "@/lib/surfaceTheme";

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
        {/* Paints the stored theme and background before the first frame.
            Render-blocking on purpose, and kept to a few hundred bytes for it.

            ThemeContext reads localStorage in an effect, which is after mount and
            therefore after paint: a dark-mode user saw one white frame, and once
            the background became a preference that frame could be the wrong colour
            as well as the wrong brightness. The CSS defaults below it can only know
            the system setting, not the choice.

            Everything is inside a try/catch returning silently: the WebView throws
            rather than returning null when site data is blocked, and a background
            preference is not worth taking the document down over. */}
        <script
          id="surface-theme-no-flash"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var RAMPS=${JSON.stringify(SURFACE_RAMPS)};
var t=localStorage.getItem('theme');
if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
document.documentElement.classList.toggle('dark',t==='dark');
var c=localStorage.getItem('listit.surface.'+t);
if(c!=='mono'&&c!=='soft'&&c!=='cool'&&c!=='warm'){c='mono';}
var r=RAMPS[t][c],s=document.documentElement.style;
s.setProperty('--surface-field',r.field);
s.setProperty('--surface-deep',r.deep);
s.setProperty('--surface-raised',r.raised);
s.setProperty('--surface-card',r.card);
s.setProperty('--surface-selected',r.selected);
s.setProperty('--surface-border',r.border);
}catch(e){}})();`,
          }}
        />
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
            {/* Renders nothing; every effect is a no-op outside the native shell. */}
            <NativeShell />
            <PWAProvider>
              <div className="flex flex-col w-full min-h-50">
                {children}
                {/* The footer carries App Store links, company links and social
                    icons — a website's furniture. An installed app should not be
                    advertising its own store listing, and the iOS app has no
                    equivalent, so it is web-only. */}
                {!IS_NATIVE_BUILD && <Footer />}
              </div>
            </PWAProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
