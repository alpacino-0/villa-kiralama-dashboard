"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return false;
    if (!/(?=.*[a-z])/.test(pwd)) return false;
    if (!/(?=.*[A-Z])/.test(pwd)) return false;
    if (!/(?=.*\d)/.test(pwd)) return false;
    return true;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!password || !confirmPassword) {
      setError("Lütfen tüm alanları doldurunuz.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor. Lütfen kontrol ediniz.");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Şifre en az 8 karakter olmalı ve büyük harf, küçük harf, rakam içermelidir.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess("Şifreniz başarıyla güncellendi. Ana sayfaya yönlendiriliyorsunuz...");
      
      // 2 saniye sonra yönlendir
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message === "New password should be different from the old password." 
          ? "Yeni şifre eski şifreden farklı olmalıdır."
          : error.message);
      } else {
        setError("Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyiniz.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(pwd)) strength++;
    if (/(?=.*[A-Z])/.test(pwd)) strength++;
    if (/(?=.*\d)/.test(pwd)) strength++;
    if (/(?=.*[@$!%*?&])/.test(pwd)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return "Zayıf";
    if (strength <= 3) return "Orta";
    return "Güçlü";
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Şifre Güncelleme</CardTitle>
          <CardDescription className="text-base">
            Hesabınızın güvenliği için güçlü bir şifre belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {/* Alert Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Yeni Şifre *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Yeni şifrenizi giriniz"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Strength */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor(getPasswordStrength(password))}`}
                        style={{ width: `${(getPasswordStrength(password) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-12">
                      {getStrengthText(getPasswordStrength(password))}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className={password.length >= 8 ? "text-green-600" : ""}>
                      • En az 8 karakter
                    </p>
                    <p className={/(?=.*[a-z])/.test(password) ? "text-green-600" : ""}>
                      • Küçük harf içermeli
                    </p>
                    <p className={/(?=.*[A-Z])/.test(password) ? "text-green-600" : ""}>
                      • Büyük harf içermeli
                    </p>
                    <p className={/(?=.*\d)/.test(password) ? "text-green-600" : ""}>
                      • Rakam içermeli
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Şifre Tekrarı *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Şifrenizi tekrar giriniz"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                <p className="text-xs text-green-600">Şifreler eşleşiyor ✓</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            >
              {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
