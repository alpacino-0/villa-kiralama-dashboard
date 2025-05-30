import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Şifre Güncelleme
        </h1>
        <p className="text-muted-foreground mt-2">
          Hesabınızın güvenliği için yeni bir şifre belirleyin
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
