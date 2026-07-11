import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Optimists Club",
    template: "%s · The Optimists Club",
  },
  description:
    "A private community restoring confidence, agency, and intellectual courage in Germany and Europe.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Optimists Club",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#002d57",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
