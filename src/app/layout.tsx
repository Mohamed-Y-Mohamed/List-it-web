import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import BootLoader from "@/components/BootLoader";
import PWAProvider from "@/components/PWAProvider";
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
    /* `suppressHydrationWarning` belongs on this element specifically.
     *
     * The script below is render-blocking and writes the six `--surface-*`
     * custom properties onto `document.documentElement.style` before React
     * hydrates — that is the entire point of it. React then finds a `style`
     * attribute on <html> that was not in the server HTML and logs a hydration
     * mismatch on every single page load, ending "This won't be patched up".
     *
     * Nothing was broken by it: React does not own that attribute, so the
     * values survive and the page is correct. But a permanent console error
     * trains everyone to ignore the console, which is where the next real one
     * will appear.
     *
     * This is the documented escape hatch for an element knowingly mutated
     * before hydration, and it is deliberately not on <body>: it only applies
     * one level deep, so a genuine mismatch anywhere inside the app still
     * reports. */
    <html lang="en" className="w-full h-full" suppressHydrationWarning>
      <head>
        {/* Paints the stored theme and background before the first frame.
            Render-blocking on purpose, and kept to a few hundred bytes for it.

            The theme and background are saved in cookies (listit_theme,
            listit_surface, and listit_custom_light / listit_custom_dark for a
            custom colour). One background choice covers both themes. With nothing saved it
            follows the system theme and uses Grey (light) or Midnight (dark).

            Everything is inside a try/catch returning silently: the browser throws
            rather than returning null when site data is blocked, and a background
            preference is not worth taking the document down over. */}
        <script
          id="surface-theme-no-flash"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var RAMPS=${JSON.stringify(SURFACE_RAMPS)};
function k(n){var m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):null;}
var t=k('listit_theme');
if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
document.documentElement.classList.toggle('dark',t==='dark');
document.documentElement.style.colorScheme=t;
var c=k('listit_surface')||k('listit_surface_'+t);
var r=RAMPS[t][c];
if(c==='custom'){var p=(k('listit_custom_'+t)||'').split('|');if(p.length===6&&/^#[0-9a-fA-F]{6}$/.test(p[0])){r={field:p[0],deep:p[1],raised:p[2],card:p[3],selected:p[4],border:p[5]};}}
if(!r){r=RAMPS[t].soft;}
var s=document.documentElement.style;
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
        {/* App-icon loading screen. Plain markup so it is on the very first
            paint; BootLoader fades it out once the page is ready. */}
        <div id="boot-loader" role="status" aria-label="Loading List It">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/android-chrome-192x192.png" alt="" width={96} height={96} />
          <span className="boot-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
        <noscript>
          <style>{`#boot-loader{display:none}`}</style>
        </noscript>
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
        <BootLoader />
      </body>
    </html>
  );
}
