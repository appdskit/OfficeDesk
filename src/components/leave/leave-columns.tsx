"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, CheckCircle, XCircle, Send } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import type { LeaveApplication } from "@/lib/types";

type GetColumnsProps = {
    onCancel?: (id: string) => void;
    onPrint?: (applications: LeaveApplication[]) => void;
};

// Base columns for viewing leave applications
export const getLeaveColumns = ({ onCancel, onPrint }: GetColumnsProps = {}): ColumnDef<LeaveApplication>[] => [
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
    accessorKey: "userName",
    header: "Applicant",
    cell: ({ row }) => <div className="font-medium">{row.original.userName}</div>,
  },
  {
    accessorKey: "leaveType",
    header: "Leave Type",
    cell: ({ row }) => <div>{row.getValue("leaveType")}</div>,
  },
  {
    accessorKey: "leaveDays",
    header: "No. of Days"
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => format(new Date(row.getValue("startDate")), "dd MMM, yyyy"),
  },
  {
    accessorKey: "resumeDate",
    header: "Resume Date",
    cell: ({ row }) => format(new Date(row.getValue("resumeDate")), "dd MMM, yyyy"),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Status <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as LeaveApplication['status'];
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (status === "Pending" || status === "Pending Acting Acceptance") variant = "outline";
      if (status === "Recommended") variant = "secondary";
      if (status === "Approved") variant = "default";
      if (status === "Rejected" || status === "Cancelled" || status === "Acting Rejected") variant = "destructive";
      
      return <div className="text-left pl-4"><Badge variant={variant} className={status === 'Approved' ? 'bg-green-500 hover:bg-green-600' : ''}>{status}</Badge></div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Submitted On",
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), "dd MMM, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const application = row.original;
      return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                 <DropdownMenuItem onClick={() => onPrint?.([application])}>View/Print Details</DropdownMenuItem>
                {(row.original.status === 'Pending' || row.original.status === 'Pending Acting Acceptance') && onCancel && 
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onCancel(row.original.id)}
                  >
                    Cancel Application
                  </DropdownMenuItem>
                }
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      )
    },
  },
];


// Columns for taking action (recommend/approve)
type GetActionColumnsProps = {
  onAction: (application: LeaveApplication) => void;
};

export const getLeaveActionColumns = ({ onAction }: GetActionColumnsProps): ColumnDef<LeaveApplication>[] => [
  ...getLeaveColumns().filter(col => col.id !== 'actions' && col.accessorKey !== 'status' && col.id !== 'select'), // Inherit base columns
   {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as LeaveApplication['status'];
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        if (status === "Pending" || status === "Pending Acting Acceptance") variant = "outline";
        if (status === "Recommended") variant = "secondary";
        return <Badge variant={variant}>{status}</Badge>;
    }
   },
   {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const application = row.original;
      return (
        <Button onClick={() => onAction(application)} size="sm">
          Review & Action
        </Button>
      );
    },
  },
];
