'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { IconTrash } from '@tabler/icons-react'
import { RegionData } from '@/types/region'

interface RegionFormProps {
  regions: RegionData[] | null;
  region: RegionData | null;
  action: (formData: FormData) => Promise<void>;
  dialogTitle: string;
}

interface DeleteButtonProps {
  id: string;
  name: string;
  onDelete: (formData: FormData) => Promise<void>;
}

// Bölge Formu Bileşeni
export function RegionForm({ regions, region, action }: RegionFormProps) {
  return (
    <form action={action} className="space-y-4">
      {region && <input type="hidden" name="id" value={region.id} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bölge Adı</Label>
          <input 
            id="name"
            name="name" 
            defaultValue={region?.name || ''} 
            required
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <input 
            id="slug"
            name="slug" 
            defaultValue={region?.slug || ''} 
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parentId">Üst Bölge</Label>
          <select 
            id="parentId"
            name="parentId" 
            defaultValue={region?.parentId || ''} 
            className="w-full p-2 border rounded-md"
          >
            <option value="">Ana Bölge (Üst bölge yok)</option>
            {regions?.filter(r => r.id !== region?.id).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Resim URL</Label>
          <input 
            id="imageUrl"
            name="imageUrl" 
            defaultValue={region?.imageUrl || ''} 
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Açıklama</Label>
          <textarea 
            id="description"
            name="description" 
            defaultValue={region?.description || ''} 
            rows={3}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Başlık</Label>
          <input 
            id="metaTitle"
            name="metaTitle" 
            defaultValue={region?.metaTitle || ''} 
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="metaDesc">Meta Açıklama</Label>
          <input 
            id="metaDesc"
            name="metaDesc" 
            defaultValue={region?.metaDesc || ''} 
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="isMainRegion" 
            name="isMainRegion" 
            defaultChecked={region?.isMainRegion || false}
          />
          <Label htmlFor="isMainRegion">Ana Bölge</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="isPromoted" 
            name="isPromoted" 
            defaultChecked={region?.isPromoted || false}
          />
          <Label htmlFor="isPromoted">Öne Çıkarılmış</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="isActive" 
            name="isActive" 
            defaultChecked={region?.isActive !== false}
          />
          <Label htmlFor="isActive">Aktif</Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" variant="default">
          {region ? 'Güncelle' : 'Ekle'}
        </Button>
      </div>
    </form>
  )
}

// DeleteButton client component
export function DeleteButton({ id, name, onDelete }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  
  const handleDelete = async () => {
    if (!confirm(`"${name}" bölgesini silmek istediğinizden emin misiniz?`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const formData = new FormData()
      formData.append('id', id)
      
      await onDelete(formData)
      router.refresh()
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  return (
    <Button 
      size="icon" 
      variant="destructive"
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      <IconTrash className="h-4 w-4" />
    </Button>
  )
} 