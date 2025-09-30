
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, getDocs, Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaveApplication, LeaveBalance, Division, UserProfile } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LeaveSummaryPrintView } from "./LeaveSummaryPrintView";

const CURRENT_YEAR = new Date().getFullYear();

export type LeaveSummary = {
    userId: string;
    userName: string;
    divisionId: string;
    casualTaken: number;
    vocationTaken: number;
    medicalTaken: number;
    totalCasual: number;
    totalVocation: number;
    totalPast: number;
    totalMedical: number;
    year: number;
};

export function LeaveSummaryTab({ onPrint }: { onPrint: (applications: LeaveApplication[]) => void; }) {
  const [summaryData, setSummaryData] = useState<LeaveSummary[]>([]);
  const [allApplications, setAllApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [searchDate, setSearchDate] = useState<Date | undefined>(new Date());
  const [staffOnLeave, setStaffOnLeave] = useState<LeaveApplication[]>([]);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<LeaveSummary | null>(null);
  const [summaryToPrint, setSummaryToPrint] = useState<LeaveSummary | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubDivisions = onSnapshot(collection(db, "divisions"), (snapshot) => {
        setDivisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division)));
    });

    const fetchSummary = async () => {
      setLoading(true);

      const balancesQuery = query(collection(db, "leaveBalances"), where("year", "==", CURRENT_YEAR));
      const applicationsQuery = query(collection(db, "leaveApplications"), where("status", "==", "Approved"));
      const usersQuery = query(collection(db, "users"));

      try {
        const [balancesSnapshot, applicationsSnapshot, usersSnapshot] = await Promise.all([
            getDocs(balancesQuery),
            getDocs(applicationsQuery),
            getDocs(usersQuery),
        ]);

        const balances = balancesSnapshot.docs.map(doc => doc.data() as LeaveBalance);
        const applications = applicationsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                ...data, 
                id: doc.id, 
                startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate), 
                resumeDate: data.resumeDate instanceof Timestamp ? data.resumeDate.toDate() : new Date(data.resumeDate),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
            } as LeaveApplication;
        });
        const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

        setAllApplications(applications);

        const summary: LeaveSummary[] = users.map(user => {
            const userBalance = balances.find(b => b.id === user.uid) || { casual: 0, vocation: 0, past: 0, medical: 0, year: CURRENT_YEAR };
            const userApplications = applications.filter(app => {
                const appYear = app.startDate.getFullYear();
                return app.userId === user.uid && appYear === CURRENT_YEAR;
            });
            
            const casualTaken = userApplications.filter(app => app.leaveType === 'Casual' || app.leaveType.includes('Leave')).reduce((acc, app) => acc + app.leaveDays, 0);
            const vocationTaken = userApplications.filter(app => app.leaveType === 'Vocation').reduce((acc, app) => acc + app.leaveDays, 0);
            const medicalTaken = userApplications.filter(app => app.leaveType === 'Medical').reduce((acc, app) => acc + app.leaveDays, 0);

            return {
                userId: user.uid,
                userName: user.name,
                divisionId: user.divisionId || '',
                casualTaken,
                vocationTaken,
                medicalTaken,
                totalCasual: userBalance.casual,
                totalVocation: userBalance.vocation,
                totalPast: userBalance.past,
                totalMedical: userBalance.medical,
                year: userBalance.year,
            };
        });

        setSummaryData(summary);
      } catch (error) {
        console.error("Error fetching leave summary:", error);
        toast({ variant: "destructive", title: "Permission Error", description: "Could not fetch leave summary data. Please check your permissions."});
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    const unsubApps = onSnapshot(query(collection(db, "leaveApplications"), where("status", "==", "Approved")), fetchSummary);
    
    return () => {
        unsubDivisions();
        unsubApps();
    };
  }, [toast]);

  useEffect(() => {
    if (searchDate) {
        const startOfSearchDate = startOfDay(searchDate);
        const onLeave = allApplications.filter(app => {
            try {
                const leaveInterval = { start: startOfDay(app.startDate), end: endOfDay(app.resumeDate) };
                return isWithinInterval(startOfSearchDate, leaveInterval);
            } catch (e) {
                console.warn("Invalid date encountered in application:", app.id, app.startDate, app.resumeDate);
                return false;
            }
        });
        setStaffOnLeave(onLeave);
    }
  }, [searchDate, allApplications]);

  const filteredSummaryData = useMemo(() => {
    if (selectedDivision === "all") {
        return summaryData;
    }
    return summaryData.filter(item => item.divisionId === selectedDivision);
  }, [summaryData, selectedDivision]);

  const downloadCSV = () => {
    const headers = ["Staff Name", "Division", "Total Casual", "Casual Taken", "Casual Remaining", "Total Vocation", "Vocation Taken", "Vocation Remaining", "Total Past", "Total Medical", "Medical Taken"];
    const divisionMap = new Map(divisions.map(d => [d.id, d.name]));

    const rows = filteredSummaryData.map(row => [
        row.userName,
        divisionMap.get(row.divisionId) || 'N/A',
        row.totalCasual,
        row.casualTaken,
        row.totalCasual - row.casualTaken,
        row.totalVocation,
        row.vocationTaken,
        row.totalVocation - row.vocationTaken,
        row.totalPast,
        row.totalMedical,
        row.medicalTaken,
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const openEditDialog = (balance: LeaveSummary) => {
    setCurrentBalance(balance);
    setIsEditDialogOpen(true);
  };

  const openPrintDialog = (summary: LeaveSummary) => {
    setSummaryToPrint(summary);
    setIsPrintDialogOpen(true);
  }

  const handleSaveBalance = async () => {
    if (!currentBalance || !currentBalance.userId) return;
    
    setIsSubmitting(true);
    try {
        const docId = `${currentBalance.userId}_${currentBalance.year}`;
        const balanceDocRef = doc(db, "leaveBalances", docId);
        const dataToSave = {
            id: currentBalance.userId,
            userName: currentBalance.userName,
            casual: Number(currentBalance.totalCasual),
            vocation: Number(currentBalance.totalVocation),
            past: Number(currentBalance.totalPast),
            medical: Number(currentBalance.totalMedical),
            year: Number(currentBalance.year),
        };
        await setDoc(balanceDocRef, dataToSave, { merge: true });
        toast({ title: "Leave balance updated successfully." });
        setIsEditDialogOpen(false);
        setCurrentBalance(null);
    } catch (error) {
        toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const summaryColumns = useMemo(() => [
      { accessorKey: 'userName', header: 'Staff Name' },
      { id: 'division', header: 'Division', cell: ({row}: any) => divisions.find(d => d.id === row.original.divisionId)?.name || 'N/A' },
      { accessorKey: 'totalCasual', header: 'Total Casual' },
      { accessorKey: 'casualTaken', header: 'Casual Taken' },
      { id: 'casualRemaining', header: 'Casual Remaining', cell: ({ row }: any) => row.original.totalCasual - row.original.casualTaken, },
      { accessorKey: 'totalVocation', header: 'Total Vocation' },
      { accessorKey: 'vocationTaken', header: 'Vocation Taken' },
      { id: 'vocationRemaining', header: 'Vocation Remaining', cell: ({ row }: any) => row.original.totalVocation - row.original.vocationTaken, },
      { accessorKey: 'totalPast', header: 'Past Leave' },
      { accessorKey: 'totalMedical', header: 'Total Medical' },
      { accessorKey: 'medicalTaken', header: 'Medical Taken' },
      {
        id: "actions",
        cell: ({ row }: { row: { original: LeaveSummary }}) => {
          const summary = row.original;
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
                    <DropdownMenuItem onClick={() => openEditDialog(summary)}>
                        Edit Balance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPrintDialog(summary)}>
                        Print Summary
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          );
        },
      },
  ], [divisions]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold mb-2">Today's Leave Staff</h3>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !searchDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {searchDate ? format(searchDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={searchDate} onSelect={setSearchDate} initialFocus />
                    </PopoverContent>
                </Popover>
                 <div className="text-sm text-muted-foreground">
                    {staffOnLeave.length > 0 ? `${staffOnLeave.length} staff member(s) on leave.` : "No staff on leave on this date."}
                </div>
            </div>
             {staffOnLeave.length > 0 && (
                <div className="p-4">
                    <ul className="list-disc pl-5 space-y-1">
                        {staffOnLeave.map(app => <li key={app.id}>{app.userName} ({app.leaveType})</li>)}
                    </ul>
                </div>
            )}
        </div>
        
        <div>
            <h3 className="text-lg font-semibold mb-2">Staff Leave Summary</h3>
            <div className="flex items-center justify-between py-4">
                 <div className="flex items-center gap-2">
                    <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Division" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Divisions</SelectItem>
                            {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                <Button onClick={downloadCSV} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
            </div>
            <DataTable columns={summaryColumns} data={filteredSummaryData} filterColumn="userName" />
        </div>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Leave Balance for {currentBalance?.userName}</DialogTitle>
                    <DialogDescription>
                        Update the leave days available for the year {currentBalance?.year}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="casual" className="text-right">Casual</Label>
                    <Input id="casual" type="number" value={currentBalance?.totalCasual || 0} onChange={(e) => setCurrentBalance(prev => prev ? { ...prev, totalCasual: Number(e.target.value) } : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vocation" className="text-right">Vocation</Label>
                    <Input id="vocation" type="number" value={currentBalance?.totalVocation || 0} onChange={(e) => setCurrentBalance(prev => prev ? { ...prev, totalVocation: Number(e.target.value) } : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="past" className="text-right">Past</Label>
                    <Input id="past" type="number" value={currentBalance?.totalPast || 0} onChange={(e) => setCurrentBalance(prev => prev ? { ...prev, totalPast: Number(e.target.value) } : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="medical" className="text-right">Medical</Label>
                    <Input id="medical" type="number" value={currentBalance?.totalMedical || 0} onChange={(e) => setCurrentBalance(prev => prev ? { ...prev, totalMedical: Number(e.target.value) } : null)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveBalance} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
            <DialogContent className="max-w-4xl h-[90vh]">
                 <DialogHeader>
                    <DialogTitle>Print Leave Summary for {summaryToPrint?.userName}</DialogTitle>
                </DialogHeader>
                {summaryToPrint && <LeaveSummaryPrintView summary={summaryToPrint} division={divisions.find(d => d.id === summaryToPrint.divisionId)} />}
            </DialogContent>
        </Dialog>
    </div>
  );
}

