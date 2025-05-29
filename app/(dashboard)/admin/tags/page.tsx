import { createClient } from '@/lib/supabase/server'
import { TagsManageComponent } from './_components/TagsManage'
import { VillaTag } from '@/types/villatag'

export default async function Page() {
  const supabase = await createClient()

  // VillaTag verisini çek
  const { data: tags } = await supabase
    .from('VillaTag')
    .select('*')
    .order('name')

  // Villa verilerini çekmeye gerek kalmadı
  // Bu kısmı tamamen kaldırdık

  return (
    <div className="p-6">
      <TagsManageComponent 
        initialTags={tags as VillaTag[] || []} 
      />
    </div>
  )
}
