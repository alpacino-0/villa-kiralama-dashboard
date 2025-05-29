'use client';

import { useEffect } from 'react';

/**
 * Global Error Sayfası
 * 
 * Bu bileşen, bir hata meydana geldiğinde kullanıcıya hata 
 * hakkında bilgi vermek için kullanılır.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 1. Hata oluştuğunda loglama
  useEffect(() => {
    // Hata bilgilerini konsola kaydet
    console.error('Uygulama hatası:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5">
      <h1 className="text-4xl font-bold text-red-600 mb-4">
        Hata Oluştu
      </h1>
      
      <p className="text-lg mb-6 max-w-lg text-center">
        Üzgünüz, bir şeyler yanlış gitti. Teknik ekibimiz bu konuda bilgilendirildi.
      </p>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6 max-w-lg">
        <p className="font-medium">Hata kodu: {error.digest}</p>
        <p className="text-sm mt-2 text-gray-700">{error.message || 'Bilinmeyen hata'}</p>
      </div>
      
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-3 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
} 