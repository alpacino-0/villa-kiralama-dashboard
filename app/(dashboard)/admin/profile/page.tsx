import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profil Listesi</h1>
      <div className="space-y-8">
        {profiles?.map((profile) => (
          <div key={profile.id} className="border p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{profile.full_name || 'İsimsiz Kullanıcı'}</h2>
                <div className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm mb-3">
                  {profile.role === 'CUSTOMER' ? 'Müşteri' : profile.role}
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-4">Profili Düzenle</h3>
              <form action={updateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="hidden" name="userId" value={profile.id} />
                
                <div className="space-y-1">
                  <label htmlFor={`email-${profile.id}`} className="block text-sm font-medium text-gray-700">E-posta</label>
                  <input 
                    id={`email-${profile.id}`}
                    type="email" 
                    name="email" 
                    defaultValue={profile.email}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor={`fullName-${profile.id}`} className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                  <input 
                    id={`fullName-${profile.id}`}
                    type="text" 
                    name="fullName" 
                    defaultValue={profile.full_name || ''}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor={`phoneNumber-${profile.id}`} className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input 
                    id={`phoneNumber-${profile.id}`}
                    type="tel" 
                    name="phoneNumber" 
                    defaultValue={profile.phone_number || ''}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor={`role-${profile.id}`} className="block text-sm font-medium text-gray-700">Kullanıcı Rolü</label>
                  <select 
                    id={`role-${profile.id}`}
                    name="role" 
                    defaultValue={profile.role}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="CUSTOMER">Müşteri</option>
                    <option value="ADMIN">Yönetici</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 mt-2">
                  <button 
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Profili Güncelle
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-2">Kullanıcı Bilgileri</h3>
              <ul className="space-y-1">
                <li><span className="font-medium">ID:</span> <span className="text-sm text-gray-600">{profile.id}</span></li>
                <li><span className="font-medium">E-posta:</span> {profile.email}</li>
                <li><span className="font-medium">Telefon:</span> {profile.phone_number || 'Belirtilmemiş'}</li>
                <li><span className="font-medium">Oluşturma Tarihi:</span> {profile.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
