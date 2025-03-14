"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"

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
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "pending" ? "secondary" : "default"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const link = row.original.link
      return link ? (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {row.getValue("name")}
        </a>
      ) : (
        row.getValue("name")
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
  },
] 