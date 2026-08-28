import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/lib/query/provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

/*
 * Three type roles, chosen from the subject's own vernacular rather than from
 * habit:
 *   display — Space Grotesk. Slightly mechanical, with distinctive numerals.
 *             Carries every headline and every large figure on the screen.
 *   sans    — Inter. Does the quiet work: dense tables, body copy, labels.
 *   mono    — JetBrains Mono. Reserved for identifiers, hashes and feature
 *             codes. In a case file, an identifier is a different kind of
 *             object from a sentence, and it should look like one.
 */
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Sentinel AI — Fraud Intelligence",
    template: "%s · Sentinel AI",
  },
  description:
    "Sentinel AI scores a transaction, then shows its work: schema alignment, calibrated probability, SHAP attribution, typology matching and the recommended action.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased h-screen overflow-hidden bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
