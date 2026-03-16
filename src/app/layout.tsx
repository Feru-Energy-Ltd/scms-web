import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Safaricharger Web CMS - Welcome",
  description: "Welcome to the web CMS for Safaricharger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body >
        {children}
      </body>
    </html>
  );
}
