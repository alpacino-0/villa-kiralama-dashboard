'use client';

import { useEffect } from 'react';
import { Geist, Geist_Mono } from "next/font/google";

// Font değişkenlerini burada da tanımlıyoruz
// Root layout'ta tanımlananın aynısı
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Global Error Kapsayıcı
 * 
 * Bu bileşen, root layout içerisinde meydana gelen hatalar için
 * bir hata sınırı oluşturur. Uygulama genelinde bir hata olduğunda
 * bu bileşen gösterilir.
 * 
 * Not: global-error bileşeni kendi html ve body etiketlerini içermelidir
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Hata detaylarını konsola yazdır
  useEffect(() => {
    console.error('Global hata:', error);
  }, [error]);

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hata Oluştu | Villa Kiralama</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Kritik Hata
            </h1>
            
            <div className="my-6">
              <p className="text-gray-700 mb-4">
                Üzgünüz, uygulamada beklenmedik bir hata oluştu. 
                Lütfen daha sonra tekrar deneyin.
              </p>
              
              <div className="bg-gray-100 p-3 rounded text-left text-sm mb-4">
                <p><strong>Hata kodu:</strong> {error.digest}</p>
                <p className="mt-1"><strong>Mesaj:</strong> {error.message || 'Bilinmeyen hata'}</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => reset()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded transition-colors"
            >
              Uygulamayı Yenile
            </button>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Bu sorun devam ederse lütfen destek ekibimizle iletişime geçin: 
            <a href="mailto:destek@example.com" className="text-blue-500 hover:underline ml-1">
              destek@example.com
            </a>
          </p>
        </div>
      </body>
    </html>
  );
} 