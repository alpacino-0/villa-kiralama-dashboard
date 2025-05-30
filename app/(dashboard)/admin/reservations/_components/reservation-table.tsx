"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconEdit,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrash,
  IconClockHour2,
  IconCircleX,
  IconCalendarCheck,
  IconCurrency,
  IconMail,
  IconCalendar,
  IconUsers
} from "@tabler/icons-react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

import { reservationService } from "./reservation-data-service"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ReservationWithVilla, ReservationStatus } from "@/types/reservation"

// Durum badge'ini renklendiren yardımcı fonksiyon
const getStatusBadge = (status: ReservationStatus) => {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="px-2 py-1 text-yellow-600 border-yellow-300">
          <IconClockHour2 className="mr-1 size-3" />
          Beklemede
        </Badge>
      )
    case 'CONFIRMED':
      return (
        <Badge variant="default" className="px-2 py-1 bg-green-600">
          <IconCircleCheckFilled className="mr-1 size-3" />
          Onaylandı
        </Badge>
      )
    case 'COMPLETED':
      return (
        <Badge variant="default" className="px-2 py-1 bg-blue-600">
          <IconCalendarCheck className="mr-1 size-3" />
          Tamamlandı
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="px-2 py-1 text-red-600 border-red-300">
          <IconCircleX className="mr-1 size-3" />
          İptal Edildi
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="px-2 py-1">
          <IconLoader className="mr-1 size-3" />
          Bilinmiyor
        </Badge>
      )
  }
}

// Tutar formatlama fonksiyonu
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Tarih formatlama fonksiyonu
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd MMM yyyy', { locale: tr })
}

interface ReservationTableProps {
  data: ReservationWithVilla[]
}

export function ReservationTable({ data: initialData }: ReservationTableProps) {
  const [data, setData] = React.useState<ReservationWithVilla[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  // Rezervasyon silme işlemi
  const deleteReservation = React.useCallback(async (id: string, bookingRef: string) => {
    try {
      if (!confirm(`${bookingRef} numaralı rezervasyonu silmek istediğinize emin misiniz?`)) {
        return
      }
      
      setIsLoading(true)
      await reservationService.deleteReservation(id)
      
      // Local state'i güncelle
      setData(prev => prev.filter(r => r.id !== id))
      
      toast.success("Rezervasyon başarıyla silindi")
    } catch (error) {
      console.error("Rezervasyon silinirken hata:", error)
      toast.error("Rezervasyon silinirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Rezervasyon durumu güncelleme
  const updateReservationStatus = React.useCallback(async (
    id: string, 
    status: ReservationStatus,
    cancellationReason?: string
  ) => {
    try {
      setIsLoading(true)
      await reservationService.updateReservationStatus(id, status, cancellationReason)
      
      // Local state'i güncelle
      setData(prev => prev.map(r => 
        r.id === id 
          ? { 
              ...r, 
              status, 
              ...(status === 'CANCELLED' && { 
                cancelledAt: new Date().toISOString(),
                cancellationReason 
              })
            }
          : r
      ))
      
      toast.success("Rezervasyon durumu başarıyla güncellendi")
    } catch (error) {
      console.error("Rezervasyon durumu güncellenirken hata:", error)
      toast.error("Rezervasyon durumu güncellenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Rezervasyon tablosu için sütun tanımları
  const reservationColumns: ColumnDef<ReservationWithVilla>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Tümünü seç"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Rezervasyonu seç"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "bookingRef",
      header: "Rezervasyon No",
      cell: ({ row }) => (
        <div className="font-mono font-medium text-sm">
          {row.getValue("bookingRef")}
        </div>
      ),
    },
    {
      accessorKey: "Villa.title",
      header: "Villa",
      cell: ({ row }) => {
        const villa = row.original.Villa
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{villa?.title}</div>
            <div className="text-xs text-muted-foreground">
              {villa?.mainRegion} / {villa?.subRegion}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "customerName",
      header: "Müşteri",
      cell: ({ row }) => (
        <div className="max-w-[150px]">
          <div className="font-medium truncate">{row.getValue("customerName")}</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                  <IconMail className="size-3" />
                  {(row.original.customerEmail as string).split('@')[0]}...
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.original.customerEmail}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Giriş - Çıkış",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <IconCalendar className="size-3" />
            {formatDate(row.getValue("startDate"))}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.endDate)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "guestCount",
      header: "Misafir",
      cell: ({ row }) => (
        <div className="text-center flex items-center justify-center gap-1">
          <IconUsers className="size-3" />
          {row.getValue("guestCount")}
        </div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Toplam Tutar",
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-medium flex items-center justify-end gap-1">
            <IconCurrency className="size-3" />
            {formatCurrency(row.getValue("totalAmount"))}
          </div>
          <div className="text-xs text-muted-foreground">
            Avans: {formatCurrency(row.original.advanceAmount)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ row }) => {
        const status = row.getValue("status") as ReservationStatus
        return getStatusBadge(status)
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const reservation = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menüyü aç</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(reservation.id)}
              >
                ID&apos;yi kopyala
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(reservation.bookingRef)}
              >
                Rezervasyon No&apos;yu kopyala
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {reservation.status === 'PENDING' && (
                <>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-green-600"
                    onClick={() => updateReservationStatus(reservation.id, 'CONFIRMED')}
                  >
                    <IconCircleCheckFilled className="size-4" />
                    Onayla
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600"
                    onClick={() => {
                      const reason = prompt('İptal nedeni (opsiyonel):')
                      updateReservationStatus(reservation.id, 'CANCELLED', reason || undefined)
                    }}
                  >
                    <IconCircleX className="size-4" />
                    İptal Et
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {reservation.status === 'CONFIRMED' && (
                <>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-blue-600"
                    onClick={() => updateReservationStatus(reservation.id, 'COMPLETED')}
                  >
                    <IconCalendarCheck className="size-4" />
                    Tamamla
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600"
                    onClick={() => {
                      const reason = prompt('İptal nedeni (opsiyonel):')
                      updateReservationStatus(reservation.id, 'CANCELLED', reason || undefined)
                    }}
                  >
                    <IconCircleX className="size-4" />
                    İptal Et
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => router.push(`/admin/reservations/${reservation.id}/edit`)}
              >
                <IconEdit className="size-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-red-600"
                onClick={() => deleteReservation(reservation.id, reservation.bookingRef)}
              >
                <IconTrash className="size-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [deleteReservation, router, updateReservationStatus])

  // React Table instance
  const table = useReactTable({
    data,
    columns: reservationColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      {/* Üst kontroller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Rezervasyon ara..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string[])?.join(",") || "all"}
            onValueChange={(value) => {
              table.getColumn("status")?.setFilterValue(value === "all" ? undefined : [value])
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="PENDING">Beklemede</SelectItem>
              <SelectItem value="CONFIRMED">Onaylandı</SelectItem>
              <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
              <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => router.push("/admin/reservations/new")}
            className="gap-2"
          >
            <IconPlus className="size-4" />
            Yeni Rezervasyon
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <IconLayoutColumns className="size-4" />
                Sütunlar
                <IconChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tablo */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={isLoading ? "opacity-50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={reservationColumns.length}
                  className="h-24 text-center"
                >
                  Rezervasyon bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sayfalama */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} satır seçildi.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Sayfa başına satır</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">İlk sayfaya git</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Önceki sayfaya git</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Sonraki sayfaya git</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Son sayfaya git</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 