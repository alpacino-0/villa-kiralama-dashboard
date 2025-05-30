// app/villas/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Villa } from '@/types/villa';
import { Card, CardContent } from '@/components/ui/card';

export default async function Page() {
  const supabase = await createClient();

  const { data: villas, error } = await supabase
    .from('Villa')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Villa fetch error:', error.message);
    return <div className="p-6 text-red-500">Veri yüklenemedi: {error.message}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Villalar</h1>

      {villas && villas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {villas.map((villa: Villa) => (
            <Card key={villa.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-lg font-semibold">{villa.title}</h2>
                <p className="text-muted-foreground text-sm">{villa.description}</p>
                <div className="text-sm text-gray-600">
                  {villa.bedrooms} yatak odası, {villa.bathrooms} banyo, {villa.slug} , {villa.mainRegion}/{villa.subRegion} bölgesinde
                </div>
                <div className="text-sm text-gray-500">Maksimum {villa.maxGuests} misafir</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>Henüz villa eklenmemiş.</p>
      )}
    </div>
  );
}
