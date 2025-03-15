"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

// This type matches our Firestore event structure
export type PendingEvent = {
  id: string
  name: string
  link: string
  location: string
  details: string
  category: string
  image: string
  status: string
}

export const columns: ColumnDef<PendingEvent>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant="outline"
          className={cn(
            status === "pending" && "border-orange-200 bg-orange-100 text-orange-900 hover:bg-orange-100 hover:text-orange-900",
            status === "approved" && "border-green-200 bg-green-100 text-green-900 hover:bg-green-100 hover:text-green-900",
            status === "rejected" && "border-red-200 bg-red-100 text-red-900 hover:bg-red-100 hover:text-red-900"
          )}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="name" />
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="location" />
    ),
  },
  {
    accessorKey: "link",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="link" />
    ),
    cell: ({ row }) => {
      const link = row.getValue("link") as string
      return link ? (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null
    },
  },
] 