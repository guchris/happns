"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  Header,
} from "@tanstack/react-table"
import { doc, updateDoc, deleteDoc, getDocs, collection, query, where, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/data-table-pagination"
import { DataTableViewOptions } from "@/components/data-table-view-options"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Pencil, Trash2 } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table-column-header"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onStatusChange?: (selectedIds: string[], newStatus: "pending" | "approved" | "rejected") => void
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  onStatusChange,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast()
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [isUpdating, setIsUpdating] = React.useState(false)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const updateSelectedStatus = async (newStatus: string) => {
    if (isUpdating) return

    try {
      setIsUpdating(true)
      const selectedRows = table.getFilteredSelectedRowModel().rows
      
      // Update each selected event's status in Firestore
      await Promise.all(
        selectedRows.map(async (row) => {
          const event = row.original as { id: string }
          const eventRef = doc(db, "pending-events", event.id)
          await updateDoc(eventRef, { status: newStatus })
        })
      )

      toast({
        title: "status updated",
        description: `updated ${selectedRows.length} events to ${newStatus}`,
      })
      setRowSelection({}) // Clear selection after update
      onStatusChange?.(selectedRows.map(row => row.original.id), newStatus as "pending" | "approved" | "rejected") // Call the onStatusChange callback if provided
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "error",
        description: "failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = () => {
    const selectedRows = table.getSelectedRowModel().rows
    if (selectedRows.length === 1) {
      const event = selectedRows[0].original as any
      router.push(`/event-form?id=${event.id}&mode=edit`)
    }
  }

  const handleClearAll = async () => {
    try {
      const pendingEventsRef = collection(db, "pending-events")
      const snapshot = await getDocs(pendingEventsRef)
      
      if (snapshot.empty) {
        toast({
          title: "no events to clear",
          description: "the pending events collection is already empty",
        })
        return
      }

      const batch = writeBatch(db)
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      await batch.commit()

      toast({
        title: "events cleared",
        description: `successfully removed ${snapshot.size} events from pending`,
      })
    } catch (error) {
      console.error("Error clearing events:", error)
      toast({
        title: "error clearing events",
        description: "there was a problem removing the events",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="filter events..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center ml-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={handleClearAll}
            disabled={data.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            clear all
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto" disabled={isUpdating}>
                status {isUpdating ? "..." : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateSelectedStatus("approved")}>
                approved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSelectedStatus("pending")}>
                pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSelectedStatus("rejected")}>
                rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {table.getSelectedRowModel().rows.length === 1 && (
            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              edit
            </Button>
          )}
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} selected
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {!header.isPlaceholder && (
                      <DataTableColumnHeader 
                        column={header.column} 
                        table={table} 
                        title={header.column.columnDef.header as string} 
                      />
                    )}
                  </TableHead>
                ))}
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
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  no results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-0">
        <div className="flex items-center space-x-2">
          {table.getSelectedRowModel().rows.length === 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              edit
            </Button>
          )}
          {table.getSelectedRowModel().rows.length > 0 && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(
                table.getSelectedRowModel().rows.map(row => (row.original as any).id),
                "approved"
              )}
            >
              approve selected
            </Button>
          )}
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
} 