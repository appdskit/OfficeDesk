"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Role } from "@/lib/types";
import { Badge } from "../ui/badge";

type GetColumnsProps = {
    onEdit: (role: Role) => void;
    onDelete: (id: string) => void;
};

export const getRoleColumns = ({ onEdit, onDelete }: GetColumnsProps): ColumnDef<Role>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="pl-4 font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.getValue("permissions") as Record<string, string[]>;
      const count = Object.values(permissions).reduce((acc, perms) => acc + perms.length, 0);
      return <Badge variant="secondary">{count} Permissions</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const role = row.original;

      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(role)}>
                Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(role.id)}
                >
                Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
