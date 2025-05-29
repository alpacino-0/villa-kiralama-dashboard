import { Nunito, Montserrat } from "next/font/google";
import "./globals.css";
import type { Metadata } from 'next';


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Inn Elegance - Lüks Villa Kiralama",
  description: "Türkiye'nin en güzel bölgelerinde lüks ve özel villa kiralama hizmetleri sunan Inn Elegance",
  verification: {
    google: "Vc_SHpDfEKcmM1nVxIbd_ODzxXlk9QJ0WLovNYah2bE"
  },
};

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600"]
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["600", "700"]
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="tr" className={`${nunito.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
           <main className="flex-grow">
             {children}
           </main>
      </body>
    </html>
  );
}