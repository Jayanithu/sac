import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Signature Animator - Create Animated Signatures",
  description: "Create stunning animated signatures. Draw, preview, and export your signature animations in SVG, MP4, or Lottie JSON formats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: `!function(){try{var e=localStorage.getItem("theme");var s=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=e==="dark"||e==="light"?e:s;var r=document.documentElement;if(t==="dark")r.classList.add("dark");else r.classList.remove("dark")}catch{}}()`}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
