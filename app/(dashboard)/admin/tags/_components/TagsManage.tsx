'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { VillaTag } from '@/types/villatag'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface TagFormProps {
  tag: VillaTag | null;
  action: (formData: FormData) => Promise<void>;
}

interface DeleteButtonProps {
  id: string;
  name: string;
  onDelete: (id: string) => Promise<void>;
}

// Etiket Formu Bileşeni
export function TagForm({ tag, action }: TagFormProps) {
  return (
    <form action={action} className="space-y-4">
      {tag && <input type="hidden" name="id" value={tag.id} />}
      
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Etiket Adı</Label>
          <input 
            id="name"
            name="name" 
            defaultValue={tag?.name || ''} 
            required
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" variant="default">
          {tag ? 'Güncelle' : 'Ekle'}
        </Button>
      </div>
    </form>
  )
}

// Silme Butonu Bileşeni
export function DeleteButton({ id, name, onDelete }: DeleteButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  
  const handleDelete = async () => {
    await onDelete(id)
    setIsConfirmOpen(false)
  }
  
  return (
    <>
      <Button 
        size="icon" 
        variant="destructive" 
        onClick={() => setIsConfirmOpen(true)}
      >
        <IconTrash className="h-4 w-4" />
      </Button>
      
      {isConfirmOpen && (
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Etiketi Sil</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <p className="mb-4">{name} etiketini silmek istediğinize emin misiniz?</p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfirmOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                >
                  Sil
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Ana Tablo Bileşeni
export function TagsManageComponent({ initialTags }: { 
  initialTags: VillaTag[]
}) {
  const [tags, setTags] = useState<VillaTag[]>(initialTags)
  const router = useRouter()
  const supabase = createClient()
  
  // Etiket Ekleme
  const handleAddTag = async (formData: FormData) => {
    const name = formData.get('name') as string;
    
    const { data, error } = await supabase
      .from('VillaTag')
      .insert({
        name
      })
      .select()
    
    if (error) {
      console.error('Etiket eklenirken hata oluştu:', error)
      return
    }
    
    setTags(prev => [...prev, data[0] as VillaTag])
    router.refresh()
  }
  
  // Etiket Güncelleme
  const handleUpdateTag = async (formData: FormData) => {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    
    const { data, error } = await supabase
      .from('VillaTag')
      .update({
        name
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Etiket güncellenirken hata oluştu:', error)
      return
    }
    
    setTags(prev => prev.map(tag => tag.id === id ? (data[0] as VillaTag) : tag))
    router.refresh()
  }
  
  // Etiket Silme
  const handleDeleteTag = async (id: string) => {
    const { error } = await supabase
      .from('VillaTag')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Etiket silinirken hata oluştu:', error)
      return
    }
    
    setTags(prev => prev.filter(tag => tag.id !== id))
    router.refresh()
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Etiketler</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default">
              Yeni Etiket Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Etiket Ekle</DialogTitle>
            </DialogHeader>
            <TagForm 
              tag={null} 
              action={handleAddTag} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Etiket Adı</TableHead>
              <TableHead>Oluşturulma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Henüz etiket bulunmamaktadır. Yeni etiket ekleyin.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.name}</TableCell>
                  <TableCell>{new Date(tag.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="outline">
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Etiketi Düzenle: {tag.name}</DialogTitle>
                          </DialogHeader>
                          <TagForm 
                            tag={tag} 
                            action={handleUpdateTag} 
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <DeleteButton 
                        id={tag.id} 
                        name={tag.name} 
                        onDelete={handleDeleteTag} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 