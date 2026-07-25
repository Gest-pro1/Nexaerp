import type { Metadata } from "next";
import { Be_Vietnam_Pro, Oswald, Geist } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200","300","400","500","600","700"],
});

export const metadata: Metadata = {
  title: "Next ERP",
  description: "sistema de gestão empresarial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${beVietnam.variable} ${oswald.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
