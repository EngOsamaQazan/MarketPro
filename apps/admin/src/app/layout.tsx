import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "سطوة | مركز قيادة التسويق الرقمي بالذكاء الاصطناعي",
  description:
    "سطوة — منصة عربية متكاملة تدير حملاتك الإعلانية، تصنع محتواك، وتحلل أداءك بذكاء اصطناعي لا ينام",
  keywords: [
    "سطوة",
    "تسويق رقمي",
    "ذكاء اصطناعي",
    "إدارة حملات",
    "محتوى",
    "SaaS",
    "Satwa",
    "AI Marketing",
  ],
  metadataBase: new URL("https://www.satwa.ai"),
  openGraph: {
    title: "سطوة | منصة التسويق الرقمي بالذكاء الاصطناعي",
    description:
      "منصة عربية متكاملة تدير حملاتك الإعلانية، تصنع محتواك، وتحلل أداءك — بذكاء لا ينام",
    url: "https://www.satwa.ai",
    siteName: "سطوة - Satwa",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "سطوة — منصة التسويق الرقمي بالذكاء الاصطناعي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سطوة | منصة التسويق الرقمي بالذكاء الاصطناعي",
    description:
      "منصة عربية متكاملة تدير حملاتك الإعلانية، تصنع محتواك، وتحلل أداءك — بذكاء لا ينام",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
