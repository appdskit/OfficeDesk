
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

import type { LeaveBalance } from "@/lib/types";

type GetColumnsProps = {
    onEdit: (balance: LeaveBalance) => void;
};

export const getLeaveBalanceColumns = ({ onEdit }: GetColumnsProps): ColumnDef<LeaveBalance>[] => [
  {
    accessorKey: "userName",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Staff Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => <div className="pl-4 font-medium">{row.getValue("userName")}</div>,
  },
  {
    accessorKey: "casual",
    header: "Casual Leave",
    cell: ({ row }) => <div className="text-center">{row.getValue("casual")}</div>,
  },
  {
    accessorKey: "vocation",
    header: "Vocation Leave",
    cell: ({ row }) => <div className="text-center">{row.getValue("vocation")}</div>,
  },
  {
    accessorKey: "past",
    header: "Past Leave",
    cell: ({ row }) => <div className="text-center">{row.getValue("past")}</div>,
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => <div className="text-center">{row.getValue("year")}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const balance = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(balance)}>
                    Edit Balance
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
