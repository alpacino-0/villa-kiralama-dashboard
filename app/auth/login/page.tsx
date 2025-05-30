import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md">
            {/* Branding/Logo Alanı */}
            <div className="text-center mb-8">
              {/* Ana Logo */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Image
                    src="/logo-siyah.svg"
                    alt="Inn Elegance Logo"
                    width={280}
                    height={74}
                    className="h-auto w-auto max-w-[280px] dark:invert transition-all"
                    priority
                  />
                </div>
              </div>
              
              {/* Açıklama */}
              <p className="text-muted-foreground text-sm font-medium">
                Lüks Villa Kiralama Yönetim Sistemi
              </p>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <h2 className="text-xl font-semibold">
                    Yönetim Paneli Girişi
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Hesabınıza giriş yaparak villa yönetim paneline erişin
                  </p>
                </CardHeader>
                <CardContent>
                  <LoginForm className="gap-4" />
                </CardContent>
              </Card>

              {/* Footer Info */}
              <div className="text-center text-xs text-muted-foreground">
                <p>© 2024 Inn Elegance. Tüm hakları saklıdır.</p>
                <p className="mt-1">Güvenli giriş için lütfen doğru bilgilerinizi giriniz.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
