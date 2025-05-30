import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, Home } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Erişim Reddedildi
          </CardTitle>
          <CardDescription className="text-gray-600">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. 
            Admin paneline sadece yönetici kullanıcılar erişebilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Eğer bu bir hata olduğunu düşünüyorsanız, 
            lütfen sistem yöneticisi ile iletişime geçin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Ana Sayfaya Dön
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/login">
                Farklı Hesapla Giriş Yap
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 