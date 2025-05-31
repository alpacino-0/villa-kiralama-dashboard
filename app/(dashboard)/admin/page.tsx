import { ChartAreaInteractive } from "@/app/(dashboard)/_components/chart-area-interactive"
import { DataTable } from "@/app/(dashboard)/_components/data-table"
import { SectionCards } from "@/app/(dashboard)/_components/section-cards"
import { isCurrentUserAdmin } from "@/lib/supabase/profiles"
import { redirect } from "next/navigation"

import data from "./data.json"

// Admin sayfası cookies kullandığından dynamic rendering zorla
export const dynamic = 'force-dynamic'

export default async function Page() {
  // Server-side admin kontrolü
  const isAdmin = await isCurrentUserAdmin()
  
  if (!isAdmin) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}
