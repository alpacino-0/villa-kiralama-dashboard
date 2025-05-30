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
import { villaService } from "./villa-data-service"

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
import { Label } from "@/components/ui/label"
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
import type { Villa } from "@/types/villa"
import { VillaStatus } from "@/types/villa"

// Villa tablosu için sütun tanımları
export const villaColumns: ColumnDef<Villa>[] = [
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
          aria-label="Villayı seç"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Villa Adı",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "mainRegion",
    header: "Ana Bölge",
    cell: ({ row }) => <div>{row.getValue("mainRegion")}</div>,
  },
  {
    accessorKey: "subRegion",
    header: "Alt Bölge",
    cell: ({ row }) => <div>{row.getValue("subRegion")}</div>,
  },
  {
    accessorKey: "bedrooms",
    header: "Yatak Odası",
    cell: ({ row }) => <div className="text-center">{row.getValue("bedrooms")}</div>,
  },
  {
    accessorKey: "bathrooms",
    header: "Banyo",
    cell: ({ row }) => <div className="text-center">{row.getValue("bathrooms")}</div>,
  },
  {
    accessorKey: "maxGuests",
    header: "Maksimum Misafir",
    cell: ({ row }) => <div className="text-center">{row.getValue("maxGuests")}</div>,
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as VillaStatus
      return (
        <Badge 
          variant={status === "ACTIVE" ? "default" : "outline"} 
          className="px-2 py-1"
        >
          {status === "ACTIVE" ? (
            <>
              <IconCircleCheckFilled className="mr-1 size-3" />
              Aktif
            </>
          ) : (
            <>
              <IconLoader className="mr-1 size-3" />
              Pasif
            </>
          )}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "isPromoted",
    header: "Promosyon",
    cell: ({ row }) => {
      const isPromoted = row.getValue("isPromoted") as boolean
      return (
        <Badge 
          variant={isPromoted ? "default" : "outline"} 
          className="px-2 py-1"
        >
          {isPromoted ? "Öne Çıkan" : "Normal"}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
]

interface VillaTableProps {
  data: Villa[]
}

export function VillaTable({ data: initialData }: VillaTableProps) {
  const [data] = React.useState<Villa[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const router = useRouter()

  // Villa silme işlemi
  const deleteVilla = React.useCallback(async (id: string, title: string) => {
    try {
      // Onay isteyin
      if (!confirm(`${title} villasını silmek istediğinize emin misiniz?`)) {
        return;
      }
      
      // Villa silinmeden önce tüm etiketlerden ilişkiyi kaldır
      await villaService.clearVillaTags(id);
      
      // Villayı sil
      await villaService.deleteVilla(id);
      
      toast.success(`${title} villası başarıyla silindi`);
      router.refresh();
    } catch (error) {
      console.error("Villa silinirken hata oluştu:", error);
      toast.error("Villa silinemedi. Lütfen daha sonra tekrar deneyin.");
    }
  }, [router]);

  // Kolonları oluşturan fonksiyon 
  const getColumns = React.useCallback(() => {
    // Actions kolonu doğrudan bu fonksiyon içinde tanımla
    const actionsColumn: ColumnDef<Villa> = {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const villa = row.original
        
        // Durumu tersine çevirme fonksiyonu
        const toggleStatus = async () => {
          try {
            const newStatus = villa.status === VillaStatus.ACTIVE ? VillaStatus.INACTIVE : VillaStatus.ACTIVE
            await villaService.changeStatus(villa.id, newStatus)
            toast.success(`${villa.title} durumu ${newStatus === VillaStatus.ACTIVE ? "aktif" : "pasif"} olarak değiştirildi`)
            router.refresh()
          } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu")
            console.error(error)
          }
        }
        
        // Öne çıkarma durumunu tersine çevirme fonksiyonu
        const togglePromotion = async () => {
          try {
            const newPromotion = !villa.isPromoted
            await villaService.togglePromotion(villa.id, newPromotion)
            toast.success(`${villa.title} ${newPromotion ? "öne çıkarıldı" : "öne çıkarma kaldırıldı"}`)
            router.refresh()
          } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu")
            console.error(error)
          }
        }
        
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                router.push(`/admin/villas/edit/${villa.id}`)
              }}
            >
              <IconEdit className="size-4" />
              <span className="sr-only">Düzenle</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="data-[state=open]:bg-muted"
                  size="icon"
                >
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Menüyü aç</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem 
                  onClick={() => {
                    router.push(`/villa-kiralama/${villa.slug}`)
                  }}
                >
                  Görüntüle
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={toggleStatus}
                >
                  {villa.status === VillaStatus.ACTIVE ? "Pasife Al" : "Aktife Al"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={togglePromotion}
                >
                  {villa.isPromoted ? "Öne Çıkarmayı Kaldır" : "Öne Çıkar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => deleteVilla(villa.id, villa.title)}
                >
                  <IconTrash className="mr-2 size-4" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    }
    
    return [...villaColumns, actionsColumn]
  }, [router, deleteVilla])

  const table = useReactTable({
    data,
    columns: getColumns(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Villa ara..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Durum
                <IconChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => table.getColumn("status")?.setFilterValue(undefined)}
              >
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.getColumn("status")?.setFilterValue(["ACTIVE"])}
              >
                Sadece Aktif
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.getColumn("status")?.setFilterValue(["INACTIVE"])}
              >
                Sadece Pasif
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Promosyon
                <IconChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => table.getColumn("isPromoted")?.setFilterValue(undefined)}
              >
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.getColumn("isPromoted")?.setFilterValue(true)}
              >
                Sadece Öne Çıkarılanlar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.getColumn("isPromoted")?.setFilterValue(false)}
              >
                Öne Çıkarılmayanlar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <IconLayoutColumns className="mr-2 size-4" />
                Sütunlar
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
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === "mainRegion"
                        ? "Ana Bölge"
                        : column.id === "subRegion"
                        ? "Alt Bölge"
                        : column.id === "bedrooms"
                        ? "Yatak Odası"
                        : column.id === "bathrooms"
                        ? "Banyo"
                        : column.id === "maxGuests"
                        ? "Maks. Misafir"
                        : column.id === "status"
                        ? "Durum"
                        : column.id === "isPromoted"
                        ? "Promosyon"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            size="sm" 
            className="h-9"
            onClick={() => router.push("/admin/villas/add")}
          >
            <IconPlus className="mr-2 size-4" />
            Yeni Villa
          </Button>
        </div>
      </div>
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
                  colSpan={villaColumns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} / {" "}
          {table.getFilteredRowModel().rows.length} villa seçildi.
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm font-normal">
              Sayfa başına:
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger id="rows-per-page" className="h-8 w-16">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Sayfa {table.getState().pagination.pageIndex + 1}/{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">İlk sayfa</span>
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Önceki sayfa</span>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Sonraki sayfa</span>
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Son sayfa</span>
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 