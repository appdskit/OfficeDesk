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

import type { StaffProfile, Division } from "@/lib/types";

type GetColumnsProps = {
    divisions: Division[];
};

const getInitials = (name: string) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : "";

export const getStaffColumns = ({ divisions }: GetColumnsProps): ColumnDef<StaffProfile>[] => [
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
        const { name, email, profileImage } = row.original;
        const initials = getInitials(name);
        return (
             <div className="flex items-center gap-3 pl-4">
                <Avatar className="h-9 w-9 border">
                    <AvatarImage src={profileImage} alt={name} />
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
    accessorKey: "designationGrade",
    header: "Designation",
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
    accessorKey: "mobileNumber",
    header: "Contact No",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const profile = row.original;

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
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem
                    className="text-destructive"
                    // onClick={() => onDelete(user.uid)}
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
