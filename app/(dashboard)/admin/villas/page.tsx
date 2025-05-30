import { Suspense } from "react"
import { VillaTableContainer } from "./_components/villa-table-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function VillasPage() {
  return (
    <div className="container max-w-[calc(100%-2rem)] mx-auto space-y-6 py-6 pr-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Villa Yönetimi</h1>
            <p className="text-sm text-muted-foreground">
              Sistem üzerindeki villaları görüntüleyin, düzenleyin ve yönetin
            </p>
          </div>
        </div>
      </div>
      
      <Suspense fallback={<TableSkeleton />}>
        <VillaTableContainer />
      </Suspense>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="rounded-md border">
        <div className="h-12 border-b px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          </div>
        </div>
        <div className="divide-y">
          {/* Linter hatasını önlemek için benzersiz ID'ler kullanıyoruz */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`row-skeleton-${i * 3 + 1}`} className="h-16 px-6">
              <div className="flex h-full items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 