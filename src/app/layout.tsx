import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "../components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sac.jayanithu.dev'),
  title: {
    default: "sac - Signature Animation Creator | Create Animated Signatures",
    template: "%s | sac"
  },
  description: "Create stunning animated signatures with ease. Draw your signature, preview the animated reveal, and export in multiple formats including SVG, MP4, and Lottie JSON for use across web, video, and cross-platform applications.",
  keywords: [
    "signature animation",
    "animated signature",
    "signature creator",
    "SVG signature",
    "Lottie animation",
    "signature generator",
    "digital signature",
    "animated SVG",
    "signature video",
    "signature export",
    "web signature",
    "signature tool"
  ],
  authors: [{ name: "Jayanithu", url: "https://github.com/Jayanithu" }],
  creator: "Jayanithu",
  publisher: "Jayanithu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "sac - Signature Animation Creator",
    title: "sac - Signature Animation Creator",
    description: "Create stunning animated signatures with ease. Draw, preview, and export in multiple formats including SVG, MP4, and Lottie JSON.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "sac - Signature Animation Creator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "sac - Signature Animation Creator",
    description: "Create stunning animated signatures with ease. Draw, preview, and export in multiple formats.",
    creator: "@Jayaniithu",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "web application",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/header.jpg", sizes: "any", type: "image/jpeg" }
    ],
    shortcut: "/header.jpg",
    apple: "/header.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: `!function(){try{var e=localStorage.getItem("theme");var t=e==="dark"||e==="light"?e:"light";var r=document.documentElement;if(t==="dark")r.classList.add("dark");else r.classList.remove("dark")}catch{}}()`}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
