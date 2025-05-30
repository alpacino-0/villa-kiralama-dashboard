import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: string
  created_at: string | null
}

export default async function Page() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone_number, role, created_at')
  
  // Kullanıcının tüm bilgilerini güncelleyen server action
  async function updateProfile(formData: FormData) {
    'use server'
    
    const userId = formData.get('userId') as string
    const email = formData.get('email') as string
    const fullName = formData.get('fullName') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const role = formData.get('role') as string
    
    if (!userId || !email) return // Email zorunlu alan
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        email,
        full_name: fullName || null,
        phone_number: phoneNumber || null,
        role
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Profil güncellenirken hata oluştu:', error)
      return
    }
    
    revalidatePath('/admin/profile')
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'CUSTOMER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Yönetici'
      case 'CUSTOMER':
        return 'Müşteri'
      default:
        return role
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Profil Yönetimi
        </h1>
        <p className="text-muted-foreground mt-2">
          Kullanıcı profillerini görüntüleyin ve düzenleyin
        </p>
      </div>
      
      <div className="grid gap-6">
        {profiles?.map((profile: Profile) => (
          <Card key={profile.id} className="w-full">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl">
                    {profile.full_name || 'İsimsiz Kullanıcı'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{profile.email}</span>
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {getRoleDisplayName(profile.role)}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Üyelik: {profile.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Kullanıcı Bilgileri */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kullanıcı Bilgileri</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">ID:</span>
                      <span className="col-span-2 font-mono text-xs break-all">
                        {profile.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">E-posta:</span>
                      <span className="col-span-2">{profile.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Telefon:</span>
                      <span className="col-span-2">
                        {profile.phone_number || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Rol:</span>
                      <span className="col-span-2">
                        <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                          {getRoleDisplayName(profile.role)}
                        </Badge>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profil Düzenleme Formu */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Profili Düzenle</h3>
                  <form action={updateProfile} className="space-y-4">
                    <input type="hidden" name="userId" value={profile.id} />
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${profile.id}`}>
                          E-posta Adresi *
                        </Label>
                        <Input 
                          id={`email-${profile.id}`}
                          type="email" 
                          name="email" 
                          defaultValue={profile.email}
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`fullName-${profile.id}`}>
                          Ad Soyad
                        </Label>
                        <Input 
                          id={`fullName-${profile.id}`}
                          type="text" 
                          name="fullName" 
                          defaultValue={profile.full_name || ''}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`phoneNumber-${profile.id}`}>
                          Telefon Numarası
                        </Label>
                        <Input 
                          id={`phoneNumber-${profile.id}`}
                          type="tel" 
                          name="phoneNumber" 
                          defaultValue={profile.phone_number || ''}
                          placeholder="0555 123 45 67"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`role-${profile.id}`}>
                          Kullanıcı Rolü
                        </Label>
                        <Select name="role" defaultValue={profile.role}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Rol seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                            <SelectItem value="ADMIN">Yönetici</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit"
                        className="w-full sm:w-auto"
                      >
                        Profili Güncelle
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!profiles || profiles.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Kullanıcı Bulunamadı</h3>
                <p className="text-muted-foreground">
                  Henüz hiç kullanıcı profili bulunmamaktadır.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
