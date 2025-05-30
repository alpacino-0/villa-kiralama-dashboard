import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

import { VillaForm } from "./_components/villa-form"


export default async function AddVillaPage() {
  // Supabase istemcisi oluştur
  const supabase = await createClient()
  
  // Bölgeleri getir
  const { data: regions } = await supabase
    .from("Region")
    .select("id, name, isMainRegion, parentId")
    .order("name")
  
  return (
    <div className="container p-6">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin/villas" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Villa Yönetimine Dön
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight">Yeni Villa Ekle</h1>
        <p className="text-muted-foreground">
          Yeni bir villa eklemek için aşağıdaki formu doldurun.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <VillaForm regions={regions || []} />
        </CardContent>
      </Card>
    </div>
  )
}
