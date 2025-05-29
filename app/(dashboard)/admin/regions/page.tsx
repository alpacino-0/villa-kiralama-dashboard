import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IconEdit, IconPlus } from '@tabler/icons-react'
import Image from 'next/image'
// Client komponentleri import edelim
import { RegionForm, DeleteButton } from './_components/RegionComponents'
import { RegionData } from '@/types/region'

// Bölge ekleme action'ı
async function addRegion(formData: FormData) {
  'use server'
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isMainRegion = formData.get('isMainRegion') === 'on'
  const parentId = formData.get('parentId') as string || null
  const slug = formData.get('slug') as string
  const isActive = formData.get('isActive') === 'on'
  const isPromoted = formData.get('isPromoted') === 'on'
  const metaTitle = formData.get('metaTitle') as string
  const metaDesc = formData.get('metaDesc') as string
  const imageUrl = formData.get('imageUrl') as string

  if (!name) return // İsim zorunlu alan
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('Region')
    .insert({
      name,
      description: description || null,
      isMainRegion,
      parentId: parentId || null,
      slug: slug || null,
      isActive,
      isPromoted,
      metaTitle: metaTitle || null,
      metaDesc: metaDesc || null,
      imageUrl: imageUrl || null
    })
  
  if (error) {
    console.error('Bölge eklenirken hata oluştu:', error)
    return
  }
  
  revalidatePath('/admin/regions')
}

// Bölge güncelleme action'ı
async function updateRegion(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isMainRegion = formData.get('isMainRegion') === 'on'
  const parentId = formData.get('parentId') as string || null
  const slug = formData.get('slug') as string
  const isActive = formData.get('isActive') === 'on'
  const isPromoted = formData.get('isPromoted') === 'on'
  const metaTitle = formData.get('metaTitle') as string
  const metaDesc = formData.get('metaDesc') as string
  const imageUrl = formData.get('imageUrl') as string
  
  if (!id || !name) return // ID ve isim zorunlu alanlar
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('Region')
    .update({
      name,
      description: description || null,
      isMainRegion,
      parentId: parentId || null,
      slug: slug || null,
      isActive,
      isPromoted,
      metaTitle: metaTitle || null,
      metaDesc: metaDesc || null,
      imageUrl: imageUrl || null
    })
    .eq('id', id)
  
  if (error) {
    console.error('Bölge güncellenirken hata oluştu:', error)
    return
  }
  
  revalidatePath('/admin/regions')
}

// Bölge silme action'ı
async function deleteRegion(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  
  if (!id) return
  
  const supabase = await createClient()
  
  // Önce alt bölgeleri kontrol et
  const { data: childRegions } = await supabase
    .from('Region')
    .select('id')
    .eq('parentId', id)
  
  if (childRegions && childRegions.length > 0) {
    console.error('Bu bölgenin alt bölgeleri bulunmaktadır. Önce alt bölgeleri silmelisiniz.')
    return
  }
  
  const { error } = await supabase
    .from('Region')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Bölge silinirken hata oluştu:', error)
    return
  }
  
  revalidatePath('/admin/regions')
}

export default async function Page() {
  const supabase = await createClient()

  const { data: regions } = await supabase
    .from('Region')
    .select('*')
    .order('name')

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bölgeler</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Yeni Bölge Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yeni Bölge Ekle</DialogTitle>
            </DialogHeader>
            <RegionForm 
              regions={regions as RegionData[] | null} 
              region={null} 
              action={addRegion} 
              dialogTitle="Yeni Bölge Ekle" 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions?.map((region) => (
          <div key={region.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  {region.name}
                  {!region.isActive && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                      Pasif
                    </span>
                  )}
                  {region.isMainRegion && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Ana Bölge
                    </span>
                  )}
                  {region.isPromoted && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                      Öne Çıkan
                    </span>
                  )}
                </h2>
                {region.slug && <p className="text-sm text-gray-500">/{region.slug}</p>}
              </div>
              
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="outline">
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Bölgeyi Düzenle: {region.name}</DialogTitle>
                    </DialogHeader>
                    <RegionForm 
                      regions={regions as RegionData[] | null} 
                      region={region as RegionData} 
                      action={updateRegion} 
                      dialogTitle={`Bölgeyi Düzenle: ${region.name}`} 
                    />
                  </DialogContent>
                </Dialog>
                
                <DeleteButton 
                  id={region.id} 
                  name={region.name} 
                  onDelete={deleteRegion} 
                />
              </div>
            </div>
            
            {region.description && (
              <p className="text-sm text-gray-600 mt-2">{region.description}</p>
            )}
            
            {region.parentId && (
              <p className="text-sm mt-2">
                <span className="font-medium">Üst Bölge:</span>{" "}
                {regions?.find(r => r.id === region.parentId)?.name}
              </p>
            )}
            
            {region.imageUrl && (
              <div className="mt-2">
                <Image
                  src={region.imageUrl} 
                  alt={region.name}
                  className="h-24 w-full object-cover rounded-md" 
                />
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              Oluşturulma: {new Date(region.createdAt).toLocaleDateString('tr-TR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
