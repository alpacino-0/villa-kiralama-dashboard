import { ReservationManager } from "./_components/reservation-manager"

export default function ReservationsPage() {
  return (
    <div className="container max-w-[calc(100%-2rem)] mx-auto space-y-6 py-6 pr-8">
      <ReservationManager />
    </div>
  )
}