"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import type { UserProfile, Role, Division } from "@/lib/types";

type GetColumnsProps = {
    roles: Role[];
    divisions: Division[];
    onEdit: (user: UserProfile) => void;
    onDelete: (uid: string) => void;
};

export const getUserColumns = ({ roles, divisions, onEdit, onDelete }: GetColumnsProps): ColumnDef<UserProfile>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const name = row.original.name;
        const email = row.original.email;
        const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
        return (
             <div className="flex items-center gap-3 pl-4">
                <Avatar className="h-8 w-8 border">
                    <AvatarImage src={`https://i.pravatar.cc/40?u=${email}`} alt={name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="grid">
                    <span className="font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">{email}</span>
                </div>
            </div>
        )
    },
  },
  {
    accessorKey: "divisionId",
    header: "Division",
     cell: ({ row }) => {
      const divisionId = row.original.divisionId;
      const division = divisions.find(d => d.id === divisionId);
      return division ? division.name : <span className="text-muted-foreground">N/A</span>;
    },
  },
  {
    accessorKey: "roleId",
    header: "Role",
    cell: ({ row }) => {
      const roleId = row.original.roleId;
      const role = roles.find(r => r.id === roleId);
      return role ? <Badge>{role.name}</Badge> : <span className="text-muted-foreground">N/A</span>;
    },
  },
   {
    accessorKey: "staffType",
    header: "Staff Type",
     cell: ({ row }) => {
        const staffType = row.original.staffType;
        return <Badge variant="secondary">{staffType}</Badge>;
     }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

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
                <DropdownMenuItem onClick={() => onEdit(user)}>
                Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(user.uid)}
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
