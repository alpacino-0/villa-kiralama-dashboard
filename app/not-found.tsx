'use client';

// app/not-found.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * 404 Not Found Sayfası
 * 
 * Kullanıcıların var olmayan sayfalara erişmeye çalıştığında
 * gösterilen sade ve minimal 404 hata sayfasıdır.
 */
export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              404 - Sayfa Bulunamadı
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Aradığınız sayfa mevcut değil.
            </p>
            
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link href="/">
                  Ana Sayfa
                </Link>
              </Button>
              
              <Button variant="outline" onClick={handleGoBack}>
                Geri Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
