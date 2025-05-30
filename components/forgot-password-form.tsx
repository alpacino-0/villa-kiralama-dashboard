"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        // Başarı Durumu
        <div className="text-center space-y-4">
          {/* Başarı İkonu */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-green-600 dark:text-green-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
              E-posta Gönderildi
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Şifre sıfırlama talimatları e-posta adresinize gönderildi. 
              E-posta kutunuzu kontrol edin ve spam klasörünü de kontrol etmeyi unutmayın.
            </p>
          </div>
          
          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                Giriş Sayfasına Dön
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        // Form Durumu
        <form onSubmit={handleForgotPassword}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/50"
              />
              <p className="text-xs text-muted-foreground">
                Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
              </p>
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-11 font-medium" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gönderiliyor...
                </div>
              ) : (
                "Şifre Sıfırlama E-postası Gönder"
              )}
            </Button>
            
            <div className="text-center text-sm border-t border-border/50 pt-4">
              <span className="text-muted-foreground">Hesabınızı hatırladınız mı? </span>
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
